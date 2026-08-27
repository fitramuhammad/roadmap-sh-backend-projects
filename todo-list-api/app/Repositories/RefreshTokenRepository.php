<?php

namespace Todo\Repositories;

use PDO;
use Todo\Models\RefreshToken;

class RefreshTokenRepository implements RefreshTokenRepositoryInterface
{
  private PDO $connection;

  public function __construct(PDO $connection)
  {
    $this->connection = $connection;
  }

  public function save(RefreshToken $token): RefreshToken
  {
    $currentTime = date("Y-m-d H:i:s");

    $token->setCreatedAt($currentTime);
    $token->setUpdatedAt($currentTime);

    $stmt = $this->connection->prepare("INSERT INTO refresh_tokens(user_id, token_hash, expires_at, revoked, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?) RETURNING id");

    $stmt->execute([
      $token->getUserId(),
      $token->getToken(),
      $token->getExpiresAt(),
      $token->isRevoked(),
      $token->getCreatedAt(),
      $token->getUpdatedAt()
    ]);

    $lastInsertId = (int) $stmt->fetchColumn();
    $token->setId($lastInsertId);

    return $token;
  }

  public function findByTokenHash(string $tokenHash): ?RefreshToken
  {
    $stmt = $this->connection->prepare("SELECT * FROM refresh_tokens WHERE token_hash = ?");

    $stmt->execute([
      $tokenHash
    ]);

    $token = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$token) {
      return null;
    }

    return new RefreshToken((int) $token["user_id"], $token["token_hash"], $token["expires_at"], (bool) $token["revoked"], (int) $token["id"], $token["created_at"], $token["updated_at"]);
  }

  public function revoke(string $tokenHash): void
  {
    $currentTime = date("Y-m-d H:i:s");

    $stmt = $this->connection->prepare("UPDATE refresh_tokens SET revoked = true, updated_at = ? WHERE token_hash = ?");
    $stmt->execute([
      $tokenHash,
      $currentTime
    ]);
  }

  public function deleteExpired(): void
  {
    $stmt = $this->connection->prepare("DELETE FROM refresh_tokens WHERE expires_at <= NOW()");
    $stmt->execute();
  }
}
