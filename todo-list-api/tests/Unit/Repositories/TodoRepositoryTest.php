<?php

namespace Todo\Tests\Unit\Repositories;

use PDO;
use PDOStatement;
use PHPUnit\Framework\TestCase;
use Todo\Models\Todo;
use Todo\Repositories\TodoRepository;

class TodoRepositoryTest extends TestCase
{
  private $pdoMock;
  private TodoRepository $repository;

  protected function setUp(): void
  {
    parent::setUp();
    $this->pdoMock = $this->createMock(PDO::class);
    $this->repository = new TodoRepository($this->pdoMock);
  }

  public function testSaveInsertsTodoAndSetsId(): void
  {
    $todo = new Todo(1, "Test Title", "Test Description");
    $stmtMock = $this->createMock(PDOStatement::class);

    $this->pdoMock->expects($this->once())
      ->method("prepare")
      ->with($this->stringContains("INSERT into todos"))
      ->willReturn($stmtMock);

    $stmtMock->expects($this->once())
      ->method("execute")
      ->willReturn(true);

    $stmtMock->expects($this->once())
      ->method("fetchColumn")
      ->willReturn("15");

    $savedTodo = $this->repository->save($todo);

    $this->assertEquals(15, $savedTodo->getId());
    $this->assertNotNull($savedTodo->getCreatedAt());
    $this->assertNotNull($savedTodo->getUpdatedAt());
  }

  public function testUpdateReturnsUpdatedTodoWhenFound(): void
  {
    $todo = new Todo(1, "Updated Title", "Updated Description", 5);

    $selectStmtMock = $this->createMock(PDOStatement::class);
    $selectStmtMock->expects($this->once())
      ->method("execute")
      ->with([5, 1])
      ->willReturn(true);
    $selectStmtMock->expects($this->once())
      ->method("fetch")
      ->with(PDO::FETCH_ASSOC)
      ->willReturn([
        "id" => 5,
        "user_id" => 1,
        "title" => "Old Title",
        "description" => "Old Description",
        "created_at" => "2026-08-20 10:00:00",
        "updated_at" => "2026-08-20 10:00:00"
      ]);

    $updateStmtMock = $this->createMock(PDOStatement::class);
    $updateStmtMock->expects($this->once())
      ->method("execute")
      ->willReturn(true);

    $this->pdoMock->expects($this->exactly(2))
      ->method("prepare")
      ->willReturnOnConsecutiveCalls($selectStmtMock, $updateStmtMock);

    $result = $this->repository->update($todo);

    $this->assertNotNull($result);
    $this->assertEquals("Updated Title", $result->getTitle());
    $this->assertEquals("Updated Description", $result->getDescription());
    $this->assertEquals(5, $result->getId());
  }

  public function testUpdateReturnsNullWhenNotFound(): void
  {
    $todo = new Todo(1, "Title", "Desc", 999);
    $stmtMock = $this->createMock(PDOStatement::class);

    $this->pdoMock->expects($this->once())
      ->method("prepare")
      ->willReturn($stmtMock);

    $stmtMock->expects($this->once())
      ->method("execute")
      ->willReturn(true);

    $stmtMock->expects($this->once())
      ->method("fetch")
      ->willReturn(false);

    $result = $this->repository->update($todo);

    $this->assertNull($result);
  }

  public function testDeleteReturnsTrueWhenRowDeleted(): void
  {
    $stmtMock = $this->createMock(PDOStatement::class);

    $this->pdoMock->expects($this->once())
      ->method("prepare")
      ->with($this->stringContains("DELETE FROM todos"))
      ->willReturn($stmtMock);

    $stmtMock->expects($this->once())
      ->method("execute")
      ->with([10, 1])
      ->willReturn(true);

    $stmtMock->expects($this->once())
      ->method("rowCount")
      ->willReturn(1);

    $result = $this->repository->delete(10, 1);

    $this->assertTrue($result);
  }

  public function testFetchAllReturnsMappedTodos(): void
  {
    $stmtMock = $this->createMock(PDOStatement::class);

    $this->pdoMock->expects($this->once())
      ->method("prepare")
      ->with($this->callback(function ($sql) {
        return str_contains($sql, "SELECT * FROM todos WHERE user_id = ?")
          && str_contains($sql, "LIKE ?")
          && str_contains($sql, "ORDER BY created_at DESC")
          && str_contains($sql, "LIMIT ? OFFSET ?");
      }))
      ->willReturn($stmtMock);

    $stmtMock->expects($this->once())
      ->method("execute")
      ->with([1, "%meeting%", "%meeting%", 10, 0])
      ->willReturn(true);

    $stmtMock->expects($this->once())
      ->method("fetchAll")
      ->with(PDO::FETCH_ASSOC)
      ->willReturn([
        [
          "id" => 1,
          "title" => "Team meeting",
          "description" => "Weekly sync meeting",
          "created_at" => "2026-08-20 10:00:00",
          "updated_at" => "2026-08-20 10:00:00"
        ]
      ]);

    $todos = $this->repository->fetchAll(1, "meeting", "DESC", 10, 0);

    $this->assertCount(1, $todos);
    $this->assertInstanceOf(Todo::class, $todos[0]);
    $this->assertEquals("Team meeting", $todos[0]->getTitle());
    $this->assertEquals(1, $todos[0]->getId());
  }

  public function testCountReturnsFilteredTotal(): void
  {
    $stmtMock = $this->createMock(PDOStatement::class);

    $this->pdoMock->expects($this->once())
      ->method("prepare")
      ->with($this->callback(function ($sql) {
        return str_contains($sql, "SELECT COUNT(*)")
          && str_contains($sql, "LIKE ?");
      }))
      ->willReturn($stmtMock);

    $stmtMock->expects($this->once())
      ->method("execute")
      ->with([1, "%php%", "%php%"])
      ->willReturn(true);

    $stmtMock->expects($this->once())
      ->method("fetchColumn")
      ->willReturn("5");

    $count = $this->repository->count(1, "php");

    $this->assertEquals(5, $count);
  }
}
