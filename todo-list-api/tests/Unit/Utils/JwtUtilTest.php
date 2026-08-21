<?php

namespace Todo\Tests\Unit\Utils;

use PHPUnit\Framework\TestCase;
use Todo\Utils\JwtUtil;

class JwtUtilTest extends TestCase
{
  protected function setUp(): void
  {
    parent::setUp();
    $_ENV["JWT_SECRET"] = "test_jwt_secret_key_for_testing_purposes_1234567890";
  }

  public function testCanGenerateAndValidateValidToken(): void
  {
    $userId = 42;
    $token = JwtUtil::generateToken($userId);

    $this->assertIsString($token);
    $this->assertNotEmpty($token);

    $payload = JwtUtil::validateToken($token);

    $this->assertNotFalse($payload);
    $this->assertIsObject($payload);
    $this->assertEquals($userId, $payload->sub);
    $this->assertObjectHasProperty("iat", $payload);
    $this->assertObjectHasProperty("exp", $payload);
    $this->assertGreaterThan($payload->iat, $payload->exp);
  }

  public function testValidateTokenReturnsFalseForInvalidToken(): void
  {
    $invalidToken = "invalid.jwt.token.string";
    $result = JwtUtil::validateToken($invalidToken);

    $this->assertFalse($result);
  }

  public function testValidateTokenReturnsFalseForTamperedToken(): void
  {
    $token = JwtUtil::generateToken(100);
    $tamperedToken = $token . "corrupted";

    $result = JwtUtil::validateToken($tamperedToken);

    $this->assertFalse($result);
  }
}
