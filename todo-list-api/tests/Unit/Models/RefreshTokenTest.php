<?php

namespace Todo\Tests\Unit\Models;

use PHPUnit\Framework\TestCase;
use Todo\Models\RefreshToken;

class RefreshTokenTest extends TestCase
{
  public function testCanInstantiateRefreshTokenAndAccessProperties(): void
  {
    $expiresAt = date("Y-m-d H:i:s", time() + 3600);
    $token = new RefreshToken(1, "sample_token_hash", $expiresAt, false, 10, "2026-08-20 10:00:00", "2026-08-20 10:00:00");

    $this->assertEquals(10, $token->getId());
    $this->assertEquals(1, $token->getUserId());
    $this->assertEquals("sample_token_hash", $token->getToken());
    $this->assertEquals($expiresAt, $token->getExpiresAt());
    $this->assertFalse($token->isRevoked());
    $this->assertEquals("2026-08-20 10:00:00", $token->getCreatedAt());
    $this->assertEquals("2026-08-20 10:00:00", $token->getUpdatedAt());
    $this->assertTrue($token->isValid());
  }

  public function testIsExpiredReturnsTrueForPastDate(): void
  {
    $pastDate = date("Y-m-d H:i:s", time() - 3600);
    $token = new RefreshToken(1, "token_hash", $pastDate);

    $this->assertTrue($token->isExpired());
    $this->assertFalse($token->isValid());
  }

  public function testRevokeSetsIsRevokedToTrue(): void
  {
    $futureDate = date("Y-m-d H:i:s", time() + 3600);
    $token = new RefreshToken(1, "token_hash", $futureDate);

    $this->assertTrue($token->isValid());
    $token->revoke();
    $this->assertTrue($token->isRevoked());
    $this->assertFalse($token->isValid());
  }

  public function testJsonSerializeReturnsExpectedArray(): void
  {
    $futureDate = date("Y-m-d H:i:s", time() + 3600);
    $token = new RefreshToken(2, "hash123", $futureDate, false, 5);

    $serialized = $token->jsonSerialize();

    $this->assertIsArray($serialized);
    $this->assertEquals(5, $serialized["id"]);
    $this->assertEquals(2, $serialized["user_id"]);
    $this->assertEquals("hash123", $serialized["token"]);
    $this->assertEquals($futureDate, $serialized["expires_at"]);
    $this->assertFalse($serialized["is_revoked"]);
  }
}
