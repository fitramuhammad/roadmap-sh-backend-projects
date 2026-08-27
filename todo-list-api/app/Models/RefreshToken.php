<?php

namespace Todo\Models;

use DateTime;
use JsonSerializable;

class RefreshToken implements JsonSerializable
{
  public function __construct(
    private int $userId,
    private string $token,
    private string $expiresAt,
    private bool $isRevoked = false,
    private ?int $id = null,
    private ?string $createdAt = null,
    private ?string $updatedAt = null
  ) {}

  public function getId(): ?int
  {
    return $this->id;
  }
  public function setId(int $id)
  {
    $this->id = $id;
  }
  public function getUserId(): int
  {
    return $this->userId;
  }
  public function getToken(): string
  {
    return $this->token;
  }
  public function getExpiresAt(): string
  {
    return $this->expiresAt;
  }

  public function isRevoked(): bool
  {
    return $this->isRevoked;
  }
  public function setIsRevoked(bool $isRevoked)
  {
    $this->isRevoked = $isRevoked;
  }
  public function getCreatedAt(): ?string
  {
    return $this->createdAt;
  }

  public function setCreatedAt(string $createdAt): void
  {
    $this->createdAt = $createdAt;
  }

  public function getUpdatedAt(): ?string
  {
    return $this->updatedAt;
  }

  public function setUpdatedAt(string $updatedAt): void
  {
    $this->updatedAt = $updatedAt;
  }

  public function isExpired(): bool
  {
    return new DateTime() > new DateTime($this->expiresAt);
  }

  public function isValid(): bool
  {
    return !$this->isRevoked && !$this->isExpired();
  }

  public function revoke(): void
  {
    $this->isRevoked = true;
  }

  public function jsonSerialize(): array
  {
    return [
      'id' => $this->id,
      'user_id' => $this->userId,
      'token' => $this->token,
      'expires_at' => $this->expiresAt,
      'is_revoked' => $this->isRevoked,
    ];
  }
}
