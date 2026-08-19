<?php

namespace Todo\Repositories;

use PDO;
use Todo\Models\Todo;

class TodoRepository implements TodoRepositoryInterface
{
  private PDO $connection;

  public function __construct(PDO $connection)
  {
    $this->connection = $connection;
  }

  public function save(Todo $todo): Todo
  {
    $currentTime = date("Y-m-d H:i:s");

    $todo->setCreatedAt($currentTime);
    $todo->setUpdatedAt($currentTime);

    $stmt = $this->connection->prepare("INSERT into todos(user_id, title, description, created_at, updated_at) VALUES(?, ?, ?, ?, ?) RETURNING id");

    $stmt->execute([
      $todo->getUserId(),
      $todo->getTitle(),
      $todo->getDescription(),
      $todo->getCreatedAt(),
      $todo->getUpdatedAt()
    ]);

    $lastInsertId = (int) $stmt->fetchColumn();
    $todo->setId($lastInsertId);

    return $todo;
  }

  public function update(Todo $todo): ?Todo
  {
    $currentTime = date("Y-m-d H:i:s");
    $stmt = $this->connection->prepare("SELECT * FROM todos WHERE id = ? AND user_id = ?");
    $stmt->execute([
      $todo->getId(),
      $todo->getUserId()
    ]);

    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($data) {
      $stmt = $this->connection->prepare("UPDATE todos SET title = ?, description = ?, updated_at = ? WHERE id = ?");
      $stmt->execute([
        $todo->getTitle(),
        $todo->getDescription(),
        $currentTime,
        $data["id"]
      ]);

      return new Todo($data["user_id"], $todo->getTitle(), $todo->getDescription(), $data["id"], $data["created_at"], $currentTime);
    }

    return null;
  }

  public function delete(int $id, int $userId): bool
  {
    $stmt = $this->connection->prepare("DELETE FROM todos WHERE id = ? AND user_id = ?");

    $stmt->execute([
      $id,
      $userId
    ]);

    return $stmt->rowCount() > 0;
  }

  public function fetchAll(int $userId, ?int $limit = 0, ?int $offset = 0)
  {
    $stmt = $this->connection;

    if ($limit != 0) {
      $stmt = $stmt->prepare("SELECT * FROM todos WHERE user_id = ? LIMIT ? OFFSET ?");
      $stmt->execute([
        $userId,
        $limit,
        $offset
      ]);

      $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
      return array_map(fn($todo) => new Todo($userId, $todo["title"], $todo["description"], $todo["id"], $todo["created_at"], $todo["updated_at"]), $res);
    }

    $stmt = $this->connection->prepare("SELECT * FROM todos WHERE user_id = ? OFFSET ?");
    $stmt->execute([
      $userId,
      $offset
    ]);

    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return array_map(fn($todo) => new Todo($userId, $todo["title"], $todo["description"], $todo["id"], $todo["created_at"], $todo["updated_at"]), $res);
  }
}
