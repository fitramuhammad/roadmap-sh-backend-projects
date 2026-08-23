<?php

namespace Todo\Utils;

class RateLimiter
{
  public function __construct(public int $ttl = 60, public int $maxRequest = 10) {}

  public function generateKey()
  {
    $clientIp = $_SERVER["REMOTE_ADDR"] ?? "127.0.0.1";
    $key = $clientIp . ":" . (parse_url($_SERVER["REQUEST_URI"] ?? "/", PHP_URL_PATH));

    return $key;
  }

  public function hit(string $key): bool
  {
    if (apcu_exists($key)) {
      if ($this->hasExceededLimit($key)) {
        return false;
      } else {
        apcu_inc($key);
        return true;
      }
    } else {
      apcu_add($key, 1, $this->ttl);
      return true;
    }
  }

  public function hasExceededLimit(string $key): bool
  {
    return apcu_fetch($key) >= $this->maxRequest;
  }

  public function availableIn(string $key): int
  {
    $clientInfo = apcu_key_info($key);

    if (!$clientInfo) {
      return $this->ttl;
    }

    return max(0, $clientInfo["ttl"] - (time() - $clientInfo["creation_time"]));
  }

  public function remainingRequest(string $key)
  {
    $clientInfo = apcu_key_info($key);

    if (!$clientInfo) {
      return $this->maxRequest;
    }

    return max(0, $this->maxRequest - (int) apcu_fetch($key));
  }
}
