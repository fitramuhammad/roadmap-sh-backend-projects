<?php

namespace Todo\Tests\Unit\Repositories;

use PDO;
use PDOStatement;
use PHPUnit\Framework\TestCase;
use Todo\Models\User;
use Todo\Repositories\UserRepository;

class UserRepositoryTest extends TestCase
{
  private $pdoMock;
  private UserRepository $repository;

  protected function setUp(): void
  {
    parent::setUp();
    $this->pdoMock = $this->createMock(PDO::class);
    $this->repository = new UserRepository($this->pdoMock);
  }

  public function testSaveInsertsUserAndSetsId(): void
  {
    $user = new User("John", "john@example.com", "secret_hash");
    $stmtMock = $this->createMock(PDOStatement::class);

    $this->pdoMock->expects($this->once())
      ->method("prepare")
      ->with($this->stringContains("INSERT into users"))
      ->willReturn($stmtMock);

    $stmtMock->expects($this->once())
      ->method("execute")
      ->willReturn(true);

    $stmtMock->expects($this->once())
      ->method("fetchColumn")
      ->willReturn("7");

    $savedUser = $this->repository->save($user);

    $this->assertEquals(7, $savedUser->getId());
    $this->assertEquals("John", $savedUser->getName());
    $this->assertEquals("john@example.com", $savedUser->getEmail());
  }

  public function testFindByEmailReturnsUserWhenFound(): void
  {
    $stmtMock = $this->createMock(PDOStatement::class);

    $this->pdoMock->expects($this->once())
      ->method("prepare")
      ->with($this->stringContains("SELECT * FROM users WHERE email = ?"))
      ->willReturn($stmtMock);

    $stmtMock->expects($this->once())
      ->method("execute")
      ->with(["john@example.com"])
      ->willReturn(true);

    $stmtMock->expects($this->once())
      ->method("fetch")
      ->with(PDO::FETCH_ASSOC)
      ->willReturn([
        "id" => 1,
        "name" => "john",
        "email" => "john@example.com",
        "password" => "hashed_pass",
        "created_at" => "2026-08-20 10:00:00",
        "updated_at" => "2026-08-20 10:00:00"
      ]);

    $user = $this->repository->findByEmail("john@example.com");

    $this->assertNotNull($user);
    $this->assertEquals(1, $user->getId());
    $this->assertEquals("john@example.com", $user->getEmail());
  }

  public function testFindByEmailReturnsNullWhenNotFound(): void
  {
    $stmtMock = $this->createMock(PDOStatement::class);

    $this->pdoMock->expects($this->once())
      ->method("prepare")
      ->willReturn($stmtMock);

    $stmtMock->expects($this->once())
      ->method("execute")
      ->with(["unknown@example.com"])
      ->willReturn(true);

    $stmtMock->expects($this->once())
      ->method("fetch")
      ->willReturn(false);

    $user = $this->repository->findByEmail("unknown@example.com");

    $this->assertNull($user);
  }

  public function testFindByIdReturnsUserWhenFound(): void
  {
    $stmtMock = $this->createMock(PDOStatement::class);

    $this->pdoMock->expects($this->once())
      ->method("prepare")
      ->with($this->stringContains("SELECT * FROM users WHERE id = ?"))
      ->willReturn($stmtMock);

    $stmtMock->expects($this->once())
      ->method("execute")
      ->with([1])
      ->willReturn(true);

    $stmtMock->expects($this->once())
      ->method("fetch")
      ->with(PDO::FETCH_ASSOC)
      ->willReturn([
        "id" => 1,
        "name" => "John",
        "email" => "john@example.com",
        "password" => "hashed_pass",
        "created_at" => "2026-08-20 10:00:00",
        "updated_at" => "2026-08-20 10:00:00"
      ]);

    $user = $this->repository->findById(1);

    $this->assertNotNull($user);
    $this->assertEquals(1, $user->getId());
  }

  public function testFindByIdReturnsNullWhenNotFound(): void
  {
    $stmtMock = $this->createMock(PDOStatement::class);

    $this->pdoMock->expects($this->once())
      ->method("prepare")
      ->willReturn($stmtMock);

    $stmtMock->expects($this->once())
      ->method("execute")
      ->with([999])
      ->willReturn(true);

    $stmtMock->expects($this->once())
      ->method("fetch")
      ->willReturn(false);

    $user = $this->repository->findById(999);

    $this->assertNull($user);
  }
}
