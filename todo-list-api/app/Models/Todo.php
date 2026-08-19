<?php

namespace Todo\Models;

use JsonSerializable;

class Todo implements JsonSerializable
{
  public function __construct(
    private int $userId,
    private string $title,
    private string $description,
    private ?int $id = null,
    private ?string $createdAt = null,
    private ?string $updatedAt = null
  ) {}

  public function jsonSerialize(): array
  {
    return [
      "id" => $this->id,
      "title" => $this->title,
      "description" => $this->description
    ];
  }

  public function getId(): ?int
  {
    return $this->id;
  }
  public function setId(int $id): void
  {
    $this->id = $id;
  }
  public function getUserId(): int
  {
    return $this->userId;
  }
  public function getTitle(): string
  {
    return $this->title;
  }
  public function getDescription(): ?string
  {
    return $this->description;
  }
  public function getCreatedAt(): ?string
  {
    return $this->createdAt;
  }
  public function setCreatedAt(string $date): void
  {
    $this->createdAt = $date;
  }
  public function getUpdatedAt(): ?string
  {
    return $this->updatedAt;
  }
  public function setUpdatedAt(string $date): void
  {
    $this->updatedAt = $date;
  }
}
