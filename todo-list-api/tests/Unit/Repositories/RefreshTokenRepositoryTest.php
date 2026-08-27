<?php

namespace Todo\Tests\Unit\Repositories;

use PDO;
use PDOStatement;
use PHPUnit\Framework\TestCase;
use Todo\Models\RefreshToken;
use Todo\Repositories\RefreshTokenRepository;

class RefreshTokenRepositoryTest extends TestCase
{
  private $pdoMock;
  private RefreshTokenRepository $repository;

  protected function setUp(): void
  {
    parent::setUp();
    $this->pdoMock = $this->createMock(PDO::class);
    $this->repository = new RefreshTokenRepository($this->pdoMock);
  }

  public function testSaveInsertsRefreshTokenAndSetsId(): void
  {
    $token = new RefreshToken(1, "hashed_token_abc", "2026-09-01 00:00:00");
    $stmtMock = $this->createMock(PDOStatement::class);

    $this->pdoMock->expects($this->once())
      ->method("prepare")
      ->with($this->stringContains("INSERT INTO refresh_tokens"))
      ->willReturn($stmtMock);

    $stmtMock->expects($this->once())
      ->method("execute")
      ->willReturn(true);

    $stmtMock->expects($this->once())
      ->method("fetchColumn")
      ->willReturn("25");

    $savedToken = $this->repository->save($token);

    $this->assertEquals(25, $savedToken->getId());
    $this->assertNotNull($savedToken->getCreatedAt());
    $this->assertNotNull($savedToken->getUpdatedAt());
  }

  public function testFindByTokenHashReturnsRefreshTokenWhenFound(): void
  {
    $stmtMock = $this->createMock(PDOStatement::class);

    $this->pdoMock->expects($this->once())
      ->method("prepare")
      ->with($this->stringContains("SELECT * FROM refresh_tokens WHERE token_hash = ?"))
      ->willReturn($stmtMock);

    $stmtMock->expects($this->once())
      ->method("execute")
      ->with(["hashed_token_abc"])
      ->willReturn(true);

    $stmtMock->expects($this->once())
      ->method("fetch")
      ->with(PDO::FETCH_ASSOC)
      ->willReturn([
        "id" => 1,
        "user_id" => 2,
        "token_hash" => "hashed_token_abc",
        "expires_at" => "2026-09-01 00:00:00",
        "revoked" => false,
        "created_at" => "2026-08-20 10:00:00",
        "updated_at" => "2026-08-20 10:00:00"
      ]);

    $token = $this->repository->findByTokenHash("hashed_token_abc");

    $this->assertNotNull($token);
    $this->assertEquals(1, $token->getId());
    $this->assertEquals(2, $token->getUserId());
    $this->assertEquals("hashed_token_abc", $token->getToken());
  }

  public function testFindByTokenHashReturnsNullWhenNotFound(): void
  {
    $stmtMock = $this->createMock(PDOStatement::class);

    $this->pdoMock->expects($this->once())
      ->method("prepare")
      ->willReturn($stmtMock);

    $stmtMock->expects($this->once())
      ->method("execute")
      ->with(["unknown_hash"])
      ->willReturn(true);

    $stmtMock->expects($this->once())
      ->method("fetch")
      ->willReturn(false);

    $token = $this->repository->findByTokenHash("unknown_hash");

    $this->assertNull($token);
  }

  public function testRevokeExecutesUpdateQuery(): void
  {
    $stmtMock = $this->createMock(PDOStatement::class);

    $this->pdoMock->expects($this->once())
      ->method("prepare")
      ->with($this->stringContains("UPDATE refresh_tokens SET revoked = true"))
      ->willReturn($stmtMock);

    $stmtMock->expects($this->once())
      ->method("execute")
      ->willReturn(true);

    $this->repository->revoke("hashed_token_abc");
  }

  public function testDeleteExpiredExecutesDeleteQuery(): void
  {
    $stmtMock = $this->createMock(PDOStatement::class);

    $this->pdoMock->expects($this->once())
      ->method("prepare")
      ->with($this->stringContains("DELETE FROM refresh_tokens WHERE expires_at <= NOW()"))
      ->willReturn($stmtMock);

    $stmtMock->expects($this->once())
      ->method("execute")
      ->willReturn(true);

    $this->repository->deleteExpired();
  }
}
