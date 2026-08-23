<?php

namespace Todo\Tests\Unit\Utils;

use PHPUnit\Framework\TestCase;
use Todo\Utils\RateLimiter;

class RateLimiterTest extends TestCase
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

  public function testGenerateKeyCreatesFormattedKey(): void
  {
    $_SERVER["REMOTE_ADDR"] = "192.168.1.100";
    $_SERVER["REQUEST_URI"] = "/todos?page=2&limit=5";

    $limiter = new RateLimiter(ttl: 60, maxRequest: 10);
    $key = $limiter->generateKey();

    $this->assertEquals("192.168.1.100:/todos", $key);
  }

  public function testGenerateKeyUsesFallbackWhenServerVariablesNotSet(): void
  {
    unset($_SERVER["REMOTE_ADDR"]);
    unset($_SERVER["REQUEST_URI"]);

    $limiter = new RateLimiter(ttl: 60, maxRequest: 10);
    $key = $limiter->generateKey();

    $this->assertEquals("127.0.0.1:/", $key);
  }

  public function testHitIncrementsAttemptsAndEnforcesMaxLimit(): void
  {
    $limiter = new RateLimiter(ttl: 60, maxRequest: 3);
    $key = "test_rate_limit_key_" . uniqid();

    $this->assertTrue($limiter->hit($key)); // Hit 1
    $this->assertTrue($limiter->hit($key)); // Hit 2
    $this->assertTrue($limiter->hit($key)); // Hit 3

    $this->assertTrue($limiter->hasExceededLimit($key));
    $this->assertFalse($limiter->hit($key)); // Hit 4 -> blocked
  }

  public function testHasExceededLimitReturnsFalseInitially(): void
  {
    $limiter = new RateLimiter(ttl: 60, maxRequest: 5);
    $key = "test_fresh_key_" . uniqid();

    $this->assertFalse($limiter->hasExceededLimit($key));
  }

  public function testRemainingRequestCalculatesAccurately(): void
  {
    $limiter = new RateLimiter(ttl: 60, maxRequest: 5);
    $key = "test_remaining_key_" . uniqid();

    $this->assertEquals(5, $limiter->remainingRequest($key));

    $limiter->hit($key);
    $this->assertEquals(4, $limiter->remainingRequest($key));

    $limiter->hit($key);
    $this->assertEquals(3, $limiter->remainingRequest($key));
  }

  public function testAvailableInReturnsValidSeconds(): void
  {
    $limiter = new RateLimiter(ttl: 30, maxRequest: 5);
    $key = "test_available_in_key_" . uniqid();

    $this->assertEquals(30, $limiter->availableIn($key));

    $limiter->hit($key);
    $availableIn = $limiter->availableIn($key);

    $this->assertGreaterThanOrEqual(0, $availableIn);
    $this->assertLessThanOrEqual(30, $availableIn);
  }
}
