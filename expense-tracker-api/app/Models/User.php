<?php

namespace App\Models;

use App\Config\Database;
use DateTimeImmutable;

class User
{
  private function __construct(private readonly int $id, private readonly string $name, private readonly string $email, private readonly string $password, private readonly DateTimeImmutable $createdAt, private readonly DateTimeImmutable $updatedAt) {}

  public static function findByEmail(string $email): ?self
  {
    $stmt = Database::connect()->prepare(
      'SELECT id, name, email, password, created_at, updated_at
             FROM users WHERE email = ?'
    );
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    return $row ? self::fromRow($row) : null;
  }

  public static function findById(int $id): ?self
  {
    $stmt = Database::connect()->prepare(
      'SELECT id, name, email, password, created_at, updated_at
             FROM users WHERE id = ?'
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    return $row ? self::fromRow($row) : null;
  }

  public static function create(string $name, string $email, string $password): self
  {
    $pdo = Database::connect();
    $now = new DateTimeImmutable();
    $hashed = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare("INSERT INTO users(name, email, password, created_at, updated_at) VALUES(?, ?, ?, ?, ?) RETURNING id");
    $stmt->execute([
      $name,
      $email,
      $hashed,
      $now->format("Y-m-d H:i:s"),
      $now->format("Y-m-d H:i:s"),
    ]);

    $row = $stmt->fetch();
    return new self((int) $row['id'], $name, $email, $hashed, $now, $now);
  }

  public function verifyPassword(string $password): bool
  {
    return password_verify($password, $this->password);
  }

  public function toArray(): array
  {
    return [
      "id" => $this->id,
      "name" => $this->name,
      "email" => $this->email,
      "created_at" => $this->createdAt->format(DATE_ATOM),
      "updated_at" => $this->updatedAt->format(DATE_ATOM),
    ];
  }

  private static function fromRow(array $row): self
  {
    return new self((int) $row["id"], $row["name"], $row["email"], $row["password"] ?? "", new DateTimeImmutable($row["created_at"] ?? 'now'), new DateTimeImmutable($row["updated_at"] ?? 'now'));
  }

  public function getId(): int
  {
    return $this->id;
  }
}
