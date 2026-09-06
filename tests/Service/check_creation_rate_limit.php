<?php
require dirname(__DIR__, 2).'/vendor/autoload.php';
use App\Service\CreationRateLimiter;
use Symfony\Component\HttpFoundation\Request;
function verify($condition, $message) { if (!$condition) { throw new RuntimeException($message); } }
$directory = sys_get_temp_dir().'/metacasquette-limit-test-'.bin2hex(random_bytes(6));
mkdir($directory);
try {
    $limiter = new CreationRateLimiter($directory);
    verify($limiter->consume('192.0.2.1', 10000) === 0, 'First allowed');
    verify($limiter->consume('192.0.2.1', 10100) === 0, 'Second allowed');
    verify($limiter->consume('192.0.2.1', 10200) === 0, 'Third allowed');
    verify($limiter->consume('192.0.2.1', 10300) === 3300, 'Fourth refused');
    verify($limiter->consume('192.0.2.2', 10300) === 0, 'Independent IP');
    verify($limiter->consume('::ffff:192.0.2.1', 10300) === 3300, 'Mapped IPv4 cannot bypass');
    verify($limiter->consume('192.0.2.1', 13600) === 0, 'Exactly one hour releases first slot');
    verify($limiter->consume('192.0.2.1', 13600) === 100, 'Rolling window retains other slots');
    $class = new ReflectionClass(App\Controller\DefaultController::class);
    $controller = $class->newInstanceWithoutConstructor();
    $property = $class->getProperty('creationRateLimiter');
    $property->setAccessible(true);
    $property->setValue($controller, $limiter);
    $check = $class->getMethod('checkCreationRateLimit');
    $check->setAccessible(true);
    for ($i = 0; $i < 4; $i++) {
        $request = new Request([], [], [], [], [], ['REMOTE_ADDR'=>'192.0.2.3', 'HTTP_X_FORWARDED_FOR'=>'198.51.100.'.$i]);
        $response = $check->invoke($controller, $request);
        verify($i < 3 ? $response === null : $response->getStatusCode() === 429, 'Forwarded header must not bypass limit');
    }
    verify((int) $response->headers->get('Retry-After') > 0, 'Retry-After provided');
    if (!function_exists('pcntl_fork')) { throw new RuntimeException('pcntl required for concurrency test'); }
    $children=[];
    for ($i=0; $i<10; $i++) {
        $pid=pcntl_fork();
        if ($pid===0) {
            $allowed=(new CreationRateLimiter($directory))->consume('192.0.2.4',20000)===0;
            file_put_contents($directory.'/result-'.$i, $allowed ? '1' : '0');
            exit(0);
        }
        verify($pid>0,'Fork');
        $children[]=$pid;
    }
    foreach ($children as $pid) { pcntl_waitpid($pid,$status); verify(pcntl_wexitstatus($status)===0,'Child completed'); }
    $accepted=0;
    foreach (glob($directory.'/result-*') as $file) { $accepted+=(int)file_get_contents($file); }
    verify($accepted===3,'Only three concurrent requests accepted');
    echo "OK : limite glissante, IP distinctes, IPv4/IPv6, en-têtes falsifiés, réponse HTTP 429 et 10 demandes simultanées.\n";
} finally {
    foreach (glob($directory.'/*') as $file) { unlink($file); }
    rmdir($directory);
}
