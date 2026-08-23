<?php

namespace Todo\Tests\Unit\Middleware;

use PHPUnit\Framework\TestCase;
use Todo\Middleware\RateLimitMiddleware;
use Todo\Utils\RateLimiter;

class RateLimitMiddlewareTest extends TestCase
{
  protected function setUp(): void
  {
    parent::setUp();
    if (function_exists("apcu_clear_cache")) {
      apcu_clear_cache();
    }
  }

  protected function tearDown(): void
  {
    if (function_exists("apcu_clear_cache")) {
      apcu_clear_cache();
    }
    parent::tearDown();
  }

  public function testMiddlewareConstructsWithDefaultOrCustomParameters(): void
  {
    $defaultMiddleware = new RateLimitMiddleware();
    $this->assertEquals(60, $defaultMiddleware->ttl);
    $this->assertEquals(10, $defaultMiddleware->maxRequest);

    $customMiddleware = new RateLimitMiddleware(ttl: 30, maxRequest: 5);
    $this->assertEquals(30, $customMiddleware->ttl);
    $this->assertEquals(5, $customMiddleware->maxRequest);
  }

  public function testMiddlewareAllowsRequestUnderLimitAndIncrementsHits(): void
  {
    $_SERVER["REMOTE_ADDR"] = "192.168.1.50";
    $_SERVER["REQUEST_URI"] = "/test-rate-limit";

    $middleware = new RateLimitMiddleware(ttl: 60, maxRequest: 3);
    $limiter = new RateLimiter(ttl: 60, maxRequest: 3);
    $key = $limiter->generateKey();

    $this->assertEquals(3, $limiter->remainingRequest($key));

    $middleware->handle();

    $this->assertEquals(2, $limiter->remainingRequest($key));

    $middleware->handle();

    $this->assertEquals(1, $limiter->remainingRequest($key));
  }
}
