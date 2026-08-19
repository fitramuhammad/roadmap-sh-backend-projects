<?php

namespace Todo\Repositories;

use PDO;
use Todo\Models\User;

class UserRepository implements UserRepositoryInterface
{
  private PDO $connection;

  public function __construct(PDO $connection)
  {
    $this->connection = $connection;
  }

  public function save(User $user): User
  {
    $currentTime = date("Y-m-d H:i:s");

    $user->setCreatedAt($currentTime);
    $user->setUpdatedAt($currentTime);

    $stmt = $this->connection->prepare("INSERT into users(name, email, password, created_at, updated_at) VALUES(?, ?, ?, ?, ?) RETURNING id");

    $stmt->execute([
      $user->getName(),
      $user->getEmail(),
      $user->getPassword(),
      $user->getCreatedAt(),
      $user->getUpdatedAt()
    ]);

    $lastInsertId = (int) $stmt->fetchColumn();
    $user->setId($lastInsertId);

    return $user;
  }

  public function findByEmail(string $email): ?User
  {
    $stmt = $this->connection->prepare("SELECT * FROM users WHERE email = ?");

    $stmt->execute([
      $email
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
      return null;
    }

    return new User($user["name"], $user["email"], $user["password"], $user["id"], $user["created_at"], $user["updated_at"]);
  }

  public function findById(int $id): ?User
  {
    $stmt = $this->connection->prepare("SELECT * FROM users WHERE id = ?");

    $stmt->execute([
      $id
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
      return null;
    }

    return new User($user["name"], $user["email"], $user["password"], $user["id"], $user["created_at"], $user["updated_at"]);
  }
}
