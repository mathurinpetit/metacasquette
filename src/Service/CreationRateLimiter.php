<?php
namespace App\Service;

/** Shared, atomic sliding window for this single-server installation. */
class CreationRateLimiter
{
    private $directory;

    public function __construct(string $directory)
    {
        $this->directory = $directory;
    }

    /** Reserve a generation before any paid API call; 0 means allowed. */
    public function consume(string $ip, ?int $now = null): int
    {
        $now = $now ?? time();
        $packed = @inet_pton($ip);
        if ($packed !== false && strlen($packed) === 16 && substr($packed, 0, 12) === str_repeat("\0", 10)."\xff\xff") {
            $packed = substr($packed, 12);
        }
        $key = hash('sha256', $packed === false ? 'unknown-client' : $packed);
        if (!is_dir($this->directory) && !@mkdir($this->directory, 0770, true) && !is_dir($this->directory)) {
            throw new \RuntimeException('Rate limit storage unavailable');
        }
        $handle = @fopen($this->directory.'/'.$key.'.json', 'c+');
        if ($handle === false) {
            throw new \RuntimeException('Rate limit storage unavailable');
        }
        try {
            if (!flock($handle, LOCK_EX)) {
                throw new \RuntimeException('Rate limit lock unavailable');
            }
            $raw = stream_get_contents($handle);
            $timestamps = $raw === '' ? array() : json_decode($raw, true);
            if (!is_array($timestamps)) {
                throw new \RuntimeException('Invalid rate limit state');
            }
            $timestamps = array_values(array_filter($timestamps, static function ($timestamp) use ($now) {
                return is_int($timestamp) && $timestamp > $now - 3600;
            }));
            sort($timestamps);
            if (count($timestamps) >= 3) {
                return max(1, $timestamps[0] + 3600 - $now);
            }
            $timestamps[] = $now;
            $json = json_encode($timestamps);
            rewind($handle);
            if (!ftruncate($handle, 0) || fwrite($handle, $json) !== strlen($json) || !fflush($handle)) {
                throw new \RuntimeException('Rate limit storage failure');
            }
            return 0;
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }
}
