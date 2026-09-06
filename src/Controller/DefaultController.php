<?php
namespace App\Controller;

use App\Service\CatalogueCsvService;
use App\Service\CreationRateLimiter;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

class DefaultController extends Controller
{
    private $catalogueCsvService;
    private $creationRateLimiter;

    public function __construct(CatalogueCsvService $catalogueCsvService, CreationRateLimiter $creationRateLimiter)
    {
        $this->catalogueCsvService = $catalogueCsvService;
        $this->creationRateLimiter = $creationRateLimiter;
    }

    public function indexAction()
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');
      $casquettes = $this->catalogueCsvService->getFrontendCatalog();
      $randCasquettes = array();
      $hasCatalog = count($casquettes) >= 7;

      if ($hasCatalog) {
        $randCasquettes = array_rand($casquettes, 7);
        shuffle($randCasquettes);
      }

      return $this->render('default/index.html.twig',array(
        'email' => $email,
        'facebook' => $facebook,
        'instagram' => $instagram,
        'telephone' => $telephone,
        'ytid' => $ytid,
        'mobile' => $this->isMobile(),
        'casquettes' => $casquettes,
        'randCasquettes' => $randCasquettes,
        'hasCatalog' => $hasCatalog,
      ));
    }

    public function produitAction($id)
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');
      $casquette = $this->catalogueCsvService->findFrontendRecordById((string) $id);

      if ($casquette === null) {
        throw $this->createNotFoundException();
      }

      return $this->render('default/produit.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram, 'telephone' => $telephone, 'ytid' => $ytid, 'casquette' => $casquette));
    }


    public function participationsJeuAction()
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');
      $pathFiles = $this->getParameter('app.pathFiles');

      $startIpRegex = "/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)_.+$/";

      $metaCasquettes = array();
      foreach ($this->scanGameDataDirectory() as $fileName) {
        if(strpos($fileName, "_layer.png") !== false){
          $startWithIp = preg_match($startIpRegex, $fileName);
          if(!$startWithIp){
            $strName = explode('_',$fileName);
            $id = $strName[0];
            $idPrefixPath = $this->getGameDataPath($id);
            if(file_exists($idPrefixPath.'.txt')){
              $id_auto_sort = date("YmdHis",filemtime($idPrefixPath.'.txt')).'_'.$id;
              $metaCasquettes[$id_auto_sort] = array('layer' => 'jeudatas/'.$id.'_layer.png', 'sound' => 'jeudatas/'.$id.'_smallDescription.mp3','description' => file_get_contents($idPrefixPath.'.txt'));
            }
          }
        }
      }
      return $this->render('default/jeuparticipations.html.twig',array('email' => $email, 'facebook' => $facebook, 'instagram' => $instagram, 'telephone' => $telephone, 'ytid' => $ytid, 'metacasquette' => $metaCasquettes));
    }

    public function jeuredirectAction()
    {
      $request = Request::createFromGlobals();
      $params = $request->query->all();
      if(count($params) > 0 && key_exists('id',$params)){
        return $this->redirect($this->generateUrl('jeu', array('id' => $params['id'])));
      }
      return $this->redirect($this->getParameter('app.gameurl'));
    }

    public function jeuAction($id)
    {
      $telephone = $this->getParameter('app.telephone');
      $email = $this->getParameter('app.email');
      $facebook = $this->getParameter('app.facebook');
      $instagram = $this->getParameter('app.instagram');
      $ytid = $this->getParameter('app.ytid');

      $ip = isset($_SERVER['HTTP_CLIENT_IP'])
        ? $_SERVER['HTTP_CLIENT_IP']
        : (isset($_SERVER['HTTP_X_FORWARDED_FOR'])
          ? $_SERVER['HTTP_X_FORWARDED_FOR']
          : $_SERVER['REMOTE_ADDR']);

      $hasPlayMoreThan2 = $this->numberIp($ip);
      $next = strtotime("tomorrow 00:00:01")-time();
      $template = $this->resolveGameTemplate((string) $id);
      if ($template === null) {
        throw $this->createNotFoundException();
      }

      return $this->render($template, array(
        'email' => $email,
        'facebook' => $facebook,
        'instagram' => $instagram,
        'telephone' => $telephone,
        'ytid' => $ytid,
        'hasPlayMoreThan2' => $hasPlayMoreThan2,
        'next' => $next,
        'gameId' => (string) $id,
      ));
    }


    public function upload($id, Request $request): Response
    {
      if (!$request->isMethod('POST')) {
          return $this->redirect($this->generateUrl('jeu', array('id' => $id)));
      }
      $ip = isset($_SERVER['HTTP_CLIENT_IP'])
        ? $_SERVER['HTTP_CLIENT_IP']
        : (isset($_SERVER['HTTP_X_FORWARDED_FOR'])
          ? $_SERVER['HTTP_X_FORWARDED_FOR']
          : $_SERVER['REMOTE_ADDR']);

      if($this->numberIp($ip) > 2){
        return new JsonResponse(array('reason' => "maxGame", 'success' => false));
      }
      $identifiant = $ip;

      $file = $request->files->get('file');
      if(!preg_match('/audio/i',$file->getClientMimeType())){
        return $this->redirect($this->generateUrl('jeu', array('id' => $id)));
      }

      $langue = $request->request->get('langue');
      $dir = __DIR__.'/../../data/';
      $nameFile = uniqid($identifiant.'_', true);
      $completePath = $dir.$nameFile.'.wav';
      if(rename($file,$completePath) !== false){
        $openaikey = $this->resolveAppConfigValue('app.openaikey', 'APP_OPENAIKEY');
        $googleapifile = $this->resolveAppConfigValue('app.googleapifile', 'APP_GOOGLEAPIFILE');
        $cmd = "python3 ../bin/identify.py \"".$openaikey."\" \"".$googleapifile."\" \"".$nameFile."\" \"".$completePath."\" \"".$langue."\" 2>> /tmp/metaCasquette.err ";
        $result = shell_exec($cmd);

        return new JsonResponse(array('result' => json_decode($result), 'success' => true));
      }
      return $this->redirect($this->generateUrl('jeu', array('id' => $id)));
    }

    public function uploadTemporaryRecording($id, Request $request): Response
    {
      try {
        if (!$request->isMethod('POST')) {
          return new JsonResponse(array('reason' => 'methodNotAllowed', 'success' => false), 405);
        }

        if ($this->resolveGameTemplate((string) $id) === null) {
          return new JsonResponse(array('reason' => 'unknownGame', 'success' => false), 404);
        }

        $file = $this->resolveTemporaryUploadedFile($request->files->get('file'));

        if ($file === null) {
          $file = $this->resolveTemporaryUploadedFile($request->files->get('recording'));
        }

        if ($file === null) {
          $file = $this->resolveFirstTemporaryUploadedFile($request->files->all());
        }

        $language = (string) $request->request->get('language', $request->request->get('langue', $request->headers->get('X-MetaCasquette-Language', 'fr')));

        if (!in_array($language, array('fr', 'en'), true)) {
          $language = 'fr';
        }

        $targetDirectory = $this->getTemporaryRecordingDirectory();

        if (!is_dir($targetDirectory) && !mkdir($targetDirectory, 0775, true) && !is_dir($targetDirectory)) {
          return new JsonResponse(array('reason' => 'storageUnavailable', 'directory' => $targetDirectory, 'success' => false), 500);
        }

        $recordingId = sprintf(
          '%s_%s_%s',
          date('YmdHis'),
          preg_replace('/[^A-Za-z0-9_-]/', '-', (string) $id),
          bin2hex(random_bytes(4))
        );

        if ($file instanceof UploadedFile) {
          $mimeType = (string) $file->getClientMimeType();

          if ($mimeType === '') {
            $mimeType = (string) $file->getMimeType();
          }

          if (strpos($mimeType, 'audio/') !== 0) {
            return new JsonResponse(array('reason' => 'invalidMimeType', 'mimeType' => $mimeType, 'success' => false), 400);
          }

          $extension = $this->guessTemporaryRecordingExtension($mimeType, $file->guessExtension());
          $fileName = $recordingId.'.'.$extension;
          $storedFile = $file->move($targetDirectory, $fileName);
          $storedFileSize = (int) $storedFile->getSize();
          $originalName = (string) $file->getClientOriginalName();
        } else {
          $rawContent = (string) $request->getContent();
          $mimeType = (string) $request->headers->get('Content-Type', '');
          $mimeType = trim(explode(';', $mimeType)[0]);

          if ($rawContent === '') {
            return new JsonResponse(array(
              'reason' => 'missingFile',
              'detail' => sprintf(
                'available file keys: [%s], content-type: "%s", content-length: "%s"',
                implode(', ', array_keys($request->files->all())),
                (string) $request->headers->get('Content-Type', ''),
                (string) $request->headers->get('Content-Length', '')
              ),
              'success' => false,
            ), 400);
          }

          if (strpos($mimeType, 'audio/') !== 0) {
            return new JsonResponse(array('reason' => 'invalidMimeType', 'mimeType' => $mimeType, 'success' => false), 400);
          }

          $extension = $this->guessTemporaryRecordingExtension($mimeType, '');
          $fileName = $recordingId.'.'.$extension;
          $storedPath = $targetDirectory.'/'.$fileName;
          $storedFileSize = @file_put_contents($storedPath, $rawContent, LOCK_EX);

          if ($storedFileSize === false) {
            return new JsonResponse(array('reason' => 'storageFailure', 'success' => false), 500);
          }

          $originalName = (string) $request->headers->get('X-MetaCasquette-File-Name', $fileName);
        }

        $metadata = array(
          'recordingId' => $recordingId,
          'gameId' => (string) $id,
          'language' => $language,
          'mimeType' => $mimeType,
          'originalName' => $originalName,
          'storedFileName' => $fileName,
          'size' => $storedFileSize,
          'storedAt' => date(DATE_ATOM),
        );

        file_put_contents(
          $targetDirectory.'/'.$recordingId.'.json',
          json_encode($metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        return new JsonResponse(array(
          'success' => true,
          'recordingId' => $recordingId,
          'fileName' => $fileName,
          'storedAt' => $metadata['storedAt'],
        ));
      } catch (\Throwable $exception) {
        error_log(sprintf(
          'MetaCasquette uploadTemporaryRecording failed for game "%s": %s in %s:%d',
          (string) $id,
          $exception->getMessage(),
          $exception->getFile(),
          $exception->getLine()
        ));

        return new JsonResponse(array(
          'reason' => 'unexpectedUploadFailure',
          'detail' => $exception->getMessage(),
          'success' => false,
        ), 500);
      }
    }

    public function processTemporaryRecording($id, $recordingId, Request $request): Response
    {
      try {
        if (!$request->isMethod('POST')) {
          return new JsonResponse(array('reason' => 'methodNotAllowed', 'success' => false), 405);
        }

        if ($this->resolveGameTemplate((string) $id) === null) {
          return new JsonResponse(array('reason' => 'unknownGame', 'success' => false), 404);
        }

        $targetDirectory = $this->getTemporaryRecordingDirectory();
        $metadataPath = $targetDirectory.'/'.$recordingId.'.json';

        if (!is_file($metadataPath)) {
          return new JsonResponse(array('reason' => 'recordingNotFound', 'success' => false), 404);
        }

        $metadata = json_decode((string) file_get_contents($metadataPath), true);

        if (!is_array($metadata) || !isset($metadata['storedFileName'])) {
          return new JsonResponse(array('reason' => 'invalidRecordingMetadata', 'success' => false), 500);
        }

        if ((string) ($metadata['gameId'] ?? '') !== (string) $id) {
          return new JsonResponse(array('reason' => 'recordingGameMismatch', 'success' => false), 400);
        }

        $storedAudioPath = $targetDirectory.'/'.$metadata['storedFileName'];

        if (!is_file($storedAudioPath)) {
          return new JsonResponse(array('reason' => 'recordingFileMissing', 'success' => false), 404);
        }

        if ($limited = $this->checkCreationRateLimit($request)) {
          return $limited;
        }

        $pipelineResult = $this->runAudioProcessingPipeline(
          $storedAudioPath,
          (string) ($metadata['language'] ?? 'fr'),
          (string) $recordingId
        );

        if (!is_array($pipelineResult) || empty($pipelineResult['success'])) {
          return new JsonResponse(array(
            'reason' => 'audioProcessingFailed',
            'detail' => $pipelineResult,
            'success' => false,
          ), 500);
        }

        $identifyResult = isset($pipelineResult['identify']) && is_array($pipelineResult['identify']) ? $pipelineResult['identify'] : array();
        $assetsResult = isset($pipelineResult['assets']) && is_array($pipelineResult['assets']) ? $pipelineResult['assets'] : array();

        $result = $this->buildGeneratedRecordingResult(
          (string) $id,
          (string) $recordingId,
          $identifyResult,
          $assetsResult,
          (string) ($pipelineResult['recordingMp3'] ?? ''),
          !empty($pipelineResult['assetsPending'])
        );

        return new JsonResponse(array('result' => $result, 'success' => true));
      } catch (\Throwable $exception) {
        error_log(sprintf(
          'MetaCasquette processTemporaryRecording failed for game "%s" and recording "%s": %s in %s:%d',
          (string) $id,
          (string) $recordingId,
          $exception->getMessage(),
          $exception->getFile(),
          $exception->getLine()
        ));

        return new JsonResponse(array(
          'reason' => 'unexpectedProcessingFailure',
          'detail' => $exception->getMessage(),
          'success' => false,
        ), 500);
      }
    }

    public function recordingGenerationStatus($id, $recordingId, Request $request): Response
    {
      if (!$request->isMethod('POST')) {
        return new JsonResponse(array('reason' => 'methodNotAllowed', 'success' => false), 405);
      }

      if ($this->resolveGameTemplate((string) $id) === null) {
        return new JsonResponse(array('reason' => 'unknownGame', 'success' => false), 404);
      }

      if (!is_string($recordingId) || preg_match('/^[A-Za-z0-9_-]+$/', $recordingId) !== 1) {
        return new JsonResponse(array('reason' => 'invalidRecordingId', 'success' => false), 400);
      }

      $temporaryMetadataPath = $this->getTemporaryRecordingDirectory().'/'.$recordingId.'.json';
      $temporaryMetadata = is_file($temporaryMetadataPath)
        ? json_decode((string) file_get_contents($temporaryMetadataPath), true)
        : null;

      if (!is_array($temporaryMetadata) || (string) ($temporaryMetadata['gameId'] ?? '') !== (string) $id) {
        return new JsonResponse(array('reason' => 'recordingNotFound', 'success' => false), 404);
      }

      $identifyPath = $this->getGameDataPath($recordingId.'_identify.json');
      $assetsJobPath = $this->getGameDataPath($recordingId.'_assets_job.json');
      $identifyResult = is_file($identifyPath)
        ? json_decode((string) file_get_contents($identifyPath), true)
        : null;
      $assetsResult = is_file($assetsJobPath) && filesize($assetsJobPath) > 0
        ? json_decode((string) file_get_contents($assetsJobPath), true)
        : null;

      if (!is_array($identifyResult)) {
        return new JsonResponse(array('ready' => false, 'status' => 'identifying', 'success' => true));
      }

      if (!is_array($assetsResult)) {
        return new JsonResponse(array('ready' => false, 'status' => 'generating', 'success' => true));
      }

      if (empty($assetsResult['success']) || empty($assetsResult['filename'])) {
        return new JsonResponse(array(
          'reason' => 'assetGenerationFailed',
          'detail' => $assetsResult,
          'ready' => false,
          'success' => false,
        ), 500);
      }

      $result = $this->buildGeneratedRecordingResult(
        (string) $id,
        (string) $recordingId,
        $identifyResult,
        $assetsResult,
        $this->getGameDataPath($recordingId.'_recording.mp3'),
        false
      );

      return new JsonResponse(array('ready' => true, 'status' => 'ready', 'result' => $result, 'success' => true));
    }

    public function createmetacasquette($id, Request $request): Response
    {
      if (!$request->isMethod('POST')) {
          return $this->redirect($this->generateUrl('jeu', array('id' => $id)));
      }

      if ($limited = $this->checkCreationRateLimit($request)) {
        return $limited;
      }

      $openaikey = $this->resolveAppConfigValue('app.openaikey', 'APP_OPENAIKEY');
      $googleapifile = $this->resolveAppConfigValue('app.googleapifile', 'APP_GOOGLEAPIFILE');
      $idUser = $request->request->get('idUser');
      $name = $request->request->get('name');
      $whatilove = $request->request->get('whatilove');
      $langue = $request->request->get('language', $request->request->get('langue', 'fr'));
      $pipelineScript = realpath(__DIR__.'/../../bin/createMetacasquetteAssets.py');
      $videoScript = realpath(__DIR__.'/../../bin/createVideoForInsta.sh');

      $cmd = sprintf(
        '%s %s %s %s %s %s %s %s %s 2>> /tmp/metaCasquette.err',
        escapeshellarg($this->resolveAiPythonBinary()),
        escapeshellarg($pipelineScript ?: __DIR__.'/../../bin/createMetacasquetteAssets.py'),
        escapeshellarg($openaikey),
        escapeshellarg($googleapifile),
        escapeshellarg($idUser),
        escapeshellarg($name),
        escapeshellarg($whatilove),
        escapeshellarg($langue),
        escapeshellarg($videoScript ?: '')
      );
      $exitCode = 0;
      $result = $this->executeExternalCommand($cmd, $exitCode);
      $json = json_decode($result);

      if (!$json) {
        return new JsonResponse(array('reason' => 'assetPipelineFailed', 'rawResult' => $result, 'exitCode' => $exitCode, 'success' => false));
      }

      return new JsonResponse(array('result' => $json, 'success' => $json->success));

    }

    public function createVideoForInsta($id, Request $request): Response
    {
      if (!$request->isMethod('POST')) {
          return $this->redirect($this->generateUrl('jeu', array('id' => $id)));
      }

      $ip = isset($_SERVER['HTTP_CLIENT_IP'])
        ? $_SERVER['HTTP_CLIENT_IP']
        : (isset($_SERVER['HTTP_X_FORWARDED_FOR'])
          ? $_SERVER['HTTP_X_FORWARDED_FOR']
          : $_SERVER['REMOTE_ADDR']);

      if($this->numberIp($ip) > 3){
        return new JsonResponse(array('reason' => "maxGame", 'success' => false));
      }

      $idUser = $request->request->get('idUser');

      if(!file_exists($this->getGameDataPath($idUser."_layer.png"))) {
         return new JsonResponse(array('reason' => "noPostInstaFileNotExists", 'success' => false));
      }

      if(file_exists($this->getGameDataPath($idUser."_insta.mp4"))) {
        return new JsonResponse(array('link' => $this->generateUrl('jeuGeneratedAsset', array('id' => $id, 'fileName' => $idUser.'_insta.mp4')), 'success' => 1, 'type' => 'localVideo'));
      }

      if(file_exists($pathFile = $this->getGameDataPath($idUser."_insta.mp4.txt"))){
        return new JsonResponse(array('link' => file_get_contents($pathFile), 'success' => 1));
      }
      $videoScript = realpath(__DIR__.'/../../bin/createVideoForInsta.sh');
      $cmd = sprintf(
        'bash %s %s >> /tmp/metaCasquette.err',
        escapeshellarg($videoScript ?: __DIR__.'/../../bin/createVideoForInsta.sh'),
        escapeshellarg($idUser)
      );
      $exitCode = 0;
      $result = $this->executeExternalCommand($cmd, $exitCode);
      if(file_exists($pathFile = $this->getGameDataPath($idUser."_insta.mp4.txt"))){
        return new JsonResponse(array('link' => file_get_contents($pathFile), 'success' => 1));
      }
      if ($exitCode !== 0) {
        return new JsonResponse(array('reason' => "noPostInsta", 'exitCode' => $exitCode, 'success' => false));
      }
      return new JsonResponse(array('reason' => "noPostInsta", 'success' => false));

    }

    public function notifyLinkForInsta($id, Request $request): Response
    {
      if (!$request->isMethod('POST')) {
          return new JsonResponse(array('reason' => "noPostInsta", 'success' => false));
      }
      $idUser = $request->request->get('idUser');
      if(file_exists($pathFile = $this->getGameDataPath($idUser."_insta.mp4.txt"))){
        return new JsonResponse(array('link' => file_get_contents($pathFile), 'pathFile' => $pathFile, 'success' => "presentBefore"));
      }

      $linkInsta = $request->request->get('linkInsta');
      $result = file_put_contents($pathFile,$linkInsta);
      return new JsonResponse(array('link' => $linkInsta, 'pathFile' => $pathFile,'fpc_result' => $result, 'success' => 1));

    }

    public function randomgenerated($id, Request $request): Response
    {
      if (!$request->isMethod('POST')) {
          return $this->redirect($this->generateUrl('jeu', array('id' => $id)));
      }

      $ip = isset($_SERVER['HTTP_CLIENT_IP'])
        ? $_SERVER['HTTP_CLIENT_IP']
        : (isset($_SERVER['HTTP_X_FORWARDED_FOR'])
          ? $_SERVER['HTTP_X_FORWARDED_FOR']
          : $_SERVER['REMOTE_ADDR']);

      if($this->numberIp($ip) > 2){
        return new JsonResponse(array('reason' => "maxGame", 'success' => false));
      }

      $layers = array();
      foreach ($this->scanGameDataDirectory() as $fileName) {
        if(strpos($fileName, "_layer.png") !== false){
          $layers[] = $fileName;
        }
      }
      if (count($layers) === 0) {
        return new JsonResponse(array('reason' => "noGeneratedContent", 'success' => false));
      }

      $excludedImage = basename((string) $request->query->get('exclude', ''));
      $alternativeLayers = array_values(array_filter($layers, static function ($layer) use ($excludedImage) {
        return $layer !== $excludedImage;
      }));

      if (count($alternativeLayers) > 0) {
        $layers = $alternativeLayers;
      }

      shuffle($layers);
      $imagePath = $layers[0];
      $generatedId = substr($imagePath, 0, -strlen('_layer.png'));
      $soundPath = $generatedId."_smallDescription.mp3";
      $textPath = $generatedId.".txt";
      $text = "";
      if(!file_exists($this->getGameDataPath($soundPath))){
        $soundPath = "";
      }
      if(file_exists($this->getGameDataPath($textPath))){
        $text = file_get_contents($this->getGameDataPath($textPath));
      }

      $result = array();
      $result['imagePath'] = $imagePath;
      $result['soundPath'] = $soundPath;
      $result['text'] = $text;
      return new JsonResponse(array('result' => $result, 'success' => true));

    }

    public function generatedAsset($id, $fileName): Response
    {
      if ($this->resolveGameTemplate((string) $id) === null) {
        throw $this->createNotFoundException();
      }

      if (!is_string($fileName) || preg_match('/^[A-Za-z0-9._-]+$/', $fileName) !== 1) {
        throw $this->createNotFoundException();
      }

      $absolutePath = realpath($this->getGameDataPath($fileName));
      $gameDataDirectory = realpath($this->getGameDataDirectory());

      if ($absolutePath === false || $gameDataDirectory === false || strpos($absolutePath, $gameDataDirectory.DIRECTORY_SEPARATOR) !== 0 || !is_file($absolutePath)) {
        throw $this->createNotFoundException();
      }

      $response = new BinaryFileResponse($absolutePath);
      $mimeType = function_exists('mime_content_type') ? mime_content_type($absolutePath) : false;

      if (is_string($mimeType) && $mimeType !== '') {
        $response->headers->set('Content-Type', $mimeType);
      }

      $response->headers->set('Content-Disposition', 'inline; filename="'.$fileName.'"');

      return $response;
    }

    public function isMobile(){
    if (!$this->has('mobile_detect.mobile_detector')) {
      return false;
    }

    $device = $this->get('mobile_detect.mobile_detector');

    return $device->isMobile() || $device->isTablet();
  }

  private function checkCreationRateLimit(Request $request)
  {
    try {
      // Apache receives connections directly; client-supplied forwarding headers are not trusted.
      $retryAfter = $this->creationRateLimiter->consume((string) $request->server->get('REMOTE_ADDR', ''));
    } catch (\RuntimeException $exception) {
      error_log($exception->getMessage());
      return new JsonResponse(array('success' => false, 'reason' => 'creationLimitUnavailable'), 503);
    }
    if ($retryAfter === 0) {
      return null;
    }
    return new JsonResponse(
      array('success' => false, 'reason' => 'creationRateLimited', 'retryAfter' => $retryAfter),
      429,
      array('Retry-After' => (string) $retryAfter, 'Cache-Control' => 'no-store')
    );
  }

  private function numberIp($ip){

    $ctpLayerIp = 0;
    foreach ($this->scanGameDataDirectory() as $fileName) {
      if(preg_match("/^".$ip."_(.+)_layer.png$/", $fileName)){
        $ctpLayerIp++;
      }
    }

    return $ctpLayerIp;

  }

  private function scanGameDataDirectory()
  {
    $gameDataDirectory = $this->getGameDataDirectory();

    if (!is_dir($gameDataDirectory)) {
      return array();
    }

    $files = scandir($gameDataDirectory);

    return $files === false ? array() : $files;
  }

  private function getGameDataDirectory()
  {
    return rtrim((string) $this->getParameter('kernel.project_dir'), DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'jeudatas';
  }

  private function getGameDataPath($fileName)
  {
    return $this->getGameDataDirectory().DIRECTORY_SEPARATOR.ltrim((string) $fileName, DIRECTORY_SEPARATOR);
  }

  private function getTemporaryRecordingDirectory()
  {
    return rtrim(sys_get_temp_dir(), '/').'/metacasquette-recordings';
  }

  private function resolveAiPythonBinary()
  {
    $venvPython = realpath(__DIR__.'/../../.venv-metacasquette-ai/bin/python3');

    return $venvPython ?: 'python3';
  }

  private function resolveAppConfigValue($parameterName, $envName)
  {
    $value = '';

    try {
      $value = (string) $this->getParameter($parameterName);
    } catch (\Throwable $exception) {
      $value = '';
    }

    if ($value !== '') {
      return $value;
    }

    if (isset($_ENV[$envName]) && (string) $_ENV[$envName] !== '') {
      return (string) $_ENV[$envName];
    }

    if (isset($_SERVER[$envName]) && (string) $_SERVER[$envName] !== '') {
      return (string) $_SERVER[$envName];
    }

    $fallback = getenv($envName);

    return $fallback === false ? '' : (string) $fallback;
  }

  private function convertAudioInputToWav($sourcePath, $targetPath, &$details = array())
  {
    $details = array();

    if (!is_file($sourcePath)) {
      error_log(sprintf('MetaCasquette convertAudioInputToWav missing source: %s', $sourcePath));
      return false;
    }

    $extension = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));

    if ($extension === 'wav') {
      return copy($sourcePath, $targetPath);
    }

    $command = sprintf(
      '%s -y -i %s -ar 44100 -ac 2 %s 2>&1',
      escapeshellarg($this->resolveFfmpegBinary()),
      escapeshellarg($sourcePath),
      escapeshellarg($targetPath)
    );

    $exitCode = 0;
    $commandOutput = $this->executeExternalCommand($command, $exitCode);
    $details['exitCode'] = $exitCode;
    $details['stderr'] = (string) $commandOutput;

    if ($commandOutput !== '') {
      @file_put_contents('/tmp/metaCasquette.err', trim($commandOutput).PHP_EOL, FILE_APPEND);
    }

    $conversionSucceeded = $exitCode === 0 && is_file($targetPath) && filesize($targetPath) > 0;

    if (!$conversionSucceeded) {
      error_log(sprintf(
        'MetaCasquette convertAudioInputToWav failed: source=%s target=%s ffmpeg=%s exit=%s stderr=%s',
        $sourcePath,
        $targetPath,
        $this->resolveFfmpegBinary(),
        $exitCode,
        preg_replace('/\s+/', ' ', trim((string) $commandOutput))
      ));
    }

    return $conversionSucceeded;
  }

  private function runAudioProcessingPipeline($audioPath, $language, $recordingId)
  {
    $openaikey = $this->resolveAppConfigValue('app.openaikey', 'APP_OPENAIKEY');
    $googleapifile = $this->resolveAppConfigValue('app.googleapifile', 'APP_GOOGLEAPIFILE');
    $wrapperScript = realpath(__DIR__.'/../../bin/process_metacasquette_audio.sh');
    $videoScript = realpath(__DIR__.'/../../bin/createVideoForInsta.sh');

    $command = sprintf(
      '/bin/bash %s %s %s %s %s %s %s %s 2>&1',
      escapeshellarg($wrapperScript ?: __DIR__.'/../../bin/process_metacasquette_audio.sh'),
      escapeshellarg($audioPath),
      escapeshellarg($language),
      escapeshellarg($recordingId),
      escapeshellarg($openaikey),
      escapeshellarg($googleapifile),
      escapeshellarg($videoScript ?: ''),
      escapeshellarg('async')
    );

    $exitCode = 0;
    $result = $this->executeExternalCommand($command, $exitCode);
    if ($result !== '') {
      @file_put_contents('/tmp/metaCasquette.err', trim((string) $result).PHP_EOL, FILE_APPEND);
    }
    $json = json_decode((string) $result, true);

    if (is_array($json)) {
      $json['_wrapperExitCode'] = $exitCode;
      return $json;
    }

    return array(
      'success' => false,
      'stage' => 'wrapper-json',
      'exitCode' => $exitCode,
      'rawResult' => $result,
    );
  }

  private function resolveFfmpegBinary()
  {
    if (is_file('/usr/bin/ffmpeg')) {
      return '/usr/bin/ffmpeg';
    }

    return 'ffmpeg';
  }

  private function runIdentifyPipeline($recordingId, $wavPath, $language)
  {
    $openaikey = $this->resolveAppConfigValue('app.openaikey', 'APP_OPENAIKEY');
    $googleapifile = $this->resolveAppConfigValue('app.googleapifile', 'APP_GOOGLEAPIFILE');
    $identifyScript = realpath(__DIR__.'/../../bin/identify.py');

    $command = sprintf(
      '%s %s %s %s %s %s %s 2>> /tmp/metaCasquette.err',
      escapeshellarg($this->resolveAiPythonBinary()),
      escapeshellarg($identifyScript ?: __DIR__.'/../../bin/identify.py'),
      escapeshellarg($openaikey),
      escapeshellarg($googleapifile),
      escapeshellarg($recordingId),
      escapeshellarg($wavPath),
      escapeshellarg($language)
    );

    $exitCode = 0;
    $result = $this->executeExternalCommand($command, $exitCode);
    $json = json_decode((string) $result, true);

    return is_array($json) ? $json : array('rawResult' => $result, 'exitCode' => $exitCode);
  }

  private function runMetacasquetteAssetPipeline($recordingId, $name, $whatilove, $language)
  {
    $openaikey = $this->resolveAppConfigValue('app.openaikey', 'APP_OPENAIKEY');
    $googleapifile = $this->resolveAppConfigValue('app.googleapifile', 'APP_GOOGLEAPIFILE');
    $pipelineScript = realpath(__DIR__.'/../../bin/createMetacasquetteAssets.py');
    $videoScript = realpath(__DIR__.'/../../bin/createVideoForInsta.sh');

    $command = sprintf(
      '%s %s %s %s %s %s %s %s %s 2>> /tmp/metaCasquette.err',
      escapeshellarg($this->resolveAiPythonBinary()),
      escapeshellarg($pipelineScript ?: __DIR__.'/../../bin/createMetacasquetteAssets.py'),
      escapeshellarg($openaikey),
      escapeshellarg($googleapifile),
      escapeshellarg($recordingId),
      escapeshellarg($name),
      escapeshellarg($whatilove),
      escapeshellarg($language),
      escapeshellarg($videoScript ?: '')
    );

    $exitCode = 0;
    $result = $this->executeExternalCommand($command, $exitCode);
    $json = json_decode((string) $result, true);

    return is_array($json) ? $json : array('rawResult' => $result, 'exitCode' => $exitCode);
  }

  private function executeExternalCommand($command, &$exitCode = null)
  {
    $exitCode = 0;

    if (function_exists('exec')) {
      $output = array();
      exec($command, $output, $exitCode);

      return implode("\n", $output);
    }

    if (function_exists('shell_exec')) {
      $output = shell_exec($command);
      $exitCode = $output === null ? 1 : 0;

      return (string) $output;
    }

    $exitCode = 127;
    error_log(sprintf('MetaCasquette executeExternalCommand unavailable for command: %s', $command));

    return '';
  }

  private function buildGeneratedRecordingResult($gameId, $recordingId, array $identifyResult, array $assetsResult, $recordingMp3, $generationPending)
  {
    $videoLocalFileName = $recordingId.'_insta.mp4';
    $videoLocalPath = $this->getGameDataPath($videoLocalFileName);

    $publicationPath = $this->getParameter('kernel.project_dir').'/var/instagram/'.$recordingId.'.json';
    $publication = is_file($publicationPath) ? json_decode((string) file_get_contents($publicationPath), true) : array();
    $reelUrl = (string) ($publication['permalink'] ?? '');
    if (!preg_match('~^https://(?:www\.)?instagram\.com/reel/[A-Za-z0-9_-]+/?$~', $reelUrl)) {
      $reelUrl = '';
    }
    $instagramStatus = $reelUrl !== '' ? 'published' : (string) ($publication['status'] ?? 'pending');
    if ($reelUrl === '' && $this->resolveAppConfigValue('app.instagram_publish_enabled', 'INSTAGRAM_PUBLISH_ENABLED') !== '1') {
      $instagramStatus = 'unavailable';
    }
    $identifyPath = $this->getGameDataPath($recordingId.'_identify.json');
    if ($reelUrl === '' && is_file($identifyPath) && time() - filemtime($identifyPath) > 1800) {
      $instagramStatus = 'timeout';
    }

    return array(
      'recordingId' => $recordingId,
      'idUser' => $recordingId,
      'name' => (string) ($identifyResult['name'] ?? ''),
      'whatilove' => (string) ($identifyResult['whatilove'] ?? ''),
      'responseText' => (string) ($assetsResult['responseText'] ?? $identifyResult['textReponse'] ?? ''),
      'responseTextSections' => (string) ($identifyResult['textReponseSections'] ?? ''),
      'readyText' => (string) ($assetsResult['readyText'] ?? ''),
      'readyTextSections' => (string) ($identifyResult['textReadySections'] ?? ''),
      'smallDescriptionText' => (string) ($assetsResult['smallDescriptionText'] ?? ''),
      'recordingMp3Url' => $this->createGeneratedAssetUrl($gameId, (string) $recordingMp3),
      'recordingMp3Path' => basename((string) $recordingMp3),
      'imageUrl' => $this->createGeneratedAssetUrl($gameId, (string) ($assetsResult['filename'] ?? '')),
      'imagePath' => basename((string) ($assetsResult['filename'] ?? '')),
      'blackImageUrl' => $this->createGeneratedAssetUrl($gameId, (string) ($assetsResult['blackFilename'] ?? '')),
      'blackImagePath' => basename((string) ($assetsResult['blackFilename'] ?? '')),
      'responseMp3Url' => $this->createGeneratedAssetUrl($gameId, (string) ($assetsResult['responseMp3'] ?? $identifyResult['mp3Reponse'] ?? '')),
      'readyMp3Url' => $this->createGeneratedAssetUrl($gameId, (string) ($assetsResult['readyMp3'] ?? $identifyResult['mp3Ready'] ?? '')),
      'smallDescriptionMp3Url' => $this->createGeneratedAssetUrl($gameId, (string) ($assetsResult['smallDescriptionMp3'] ?? '')),
      'videoInstaMp3Url' => $this->createGeneratedAssetUrl($gameId, (string) ($assetsResult['videoInstaMp3'] ?? '')),
      'instagramReelUrl' => $reelUrl,
      'instagramStatus' => $instagramStatus,
      'generationPending' => (bool) $generationPending,
      'backgroundVideoStarted' => !empty($assetsResult['backgroundVideoStarted']),
      'videoLocalUrl' => file_exists($videoLocalPath) ? $this->generateUrl('jeuGeneratedAsset', array('id' => $gameId, 'fileName' => $videoLocalFileName)) : '',
      'warnings' => isset($assetsResult['warnings']) && is_array($assetsResult['warnings']) ? $assetsResult['warnings'] : array(),
    );
  }

  private function createGeneratedAssetUrl($gameId, $path)
  {
    if (!is_string($path) || $path === '') {
      return '';
    }

    return $this->generateUrl('jeuGeneratedAsset', array(
      'id' => $gameId,
      'fileName' => basename($path),
    ));
  }

  private function resolveTemporaryUploadedFile($uploadedFile)
  {
    if ($uploadedFile instanceof UploadedFile) {
      return $uploadedFile;
    }

    if (!is_array($uploadedFile)) {
      return null;
    }

    foreach ($uploadedFile as $candidate) {
      $resolvedCandidate = $this->resolveTemporaryUploadedFile($candidate);

      if ($resolvedCandidate instanceof UploadedFile) {
        return $resolvedCandidate;
      }
    }

    return null;
  }

  private function resolveFirstTemporaryUploadedFile(array $uploadedFiles)
  {
    foreach ($uploadedFiles as $uploadedFile) {
      $resolvedFile = $this->resolveTemporaryUploadedFile($uploadedFile);

      if ($resolvedFile instanceof UploadedFile) {
        return $resolvedFile;
      }
    }

    return null;
  }

  private function guessTemporaryRecordingExtension($mimeType, $guessedExtension)
  {
    $mimeTypeMap = array(
      'audio/mp4' => 'm4a',
      'audio/mpeg' => 'mp3',
      'audio/mp3' => 'mp3',
      'audio/ogg' => 'ogg',
      'audio/ogg;codecs=opus' => 'ogg',
      'audio/wav' => 'wav',
      'audio/wave' => 'wav',
      'audio/webm' => 'webm',
      'audio/webm;codecs=opus' => 'webm',
      'audio/x-m4a' => 'm4a',
      'audio/x-wav' => 'wav',
    );

    if (array_key_exists($mimeType, $mimeTypeMap)) {
      return $mimeTypeMap[$mimeType];
    }

    if (is_string($guessedExtension) && $guessedExtension !== '') {
      return $guessedExtension;
    }

    return 'audio';
  }

  private function resolveGameTemplate(string $id)
  {
    $legacyGameIds = array(
      '1',
      '01',
      '5e836e38-7896-443c-a6d8-962870994f8f',
    );

    if (in_array($id, $legacyGameIds, true)) {
      return 'default/jeu01.html.twig';
    }

    return null;
  }
}
