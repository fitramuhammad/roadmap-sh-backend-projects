<?php

namespace Todo\Middleware;

use Todo\Utils\RateLimiter;

class RateLimitMiddleware
{
  public function __construct(public int $ttl = 60, public int $maxRequest = 10) {}

  public function handle()
  {
    $rateLimiter = new RateLimiter($this->ttl, $this->maxRequest);
    $clientId = $rateLimiter->generateKey();

    if ($rateLimiter->hasExceededLimit($clientId)) {
      header("Content-Type: application/json");
      header("Retry-After: {$rateLimiter->availableIn($clientId)}");
      header("X-RateLimit-Limit: $rateLimiter->maxRequest");
      http_response_code(429);
      echo json_encode([
        "errors" => [
          "message" => "Rate limit exceeded. Try again later."
        ]
      ]);
      exit();
    }

    $rateLimiter->hit($clientId);
    $reset = time() + $rateLimiter->availableIn($clientId);
    header("X-RateLimit-Limit: $rateLimiter->maxRequest");
    header("X-RateLimit-Remaining: {$rateLimiter->remainingRequest($clientId)}");
    header("X-RateLimit-Reset: $reset");
    return;
  }
}
