<?php

namespace Todo\Models;

class User
{
  public function __construct(private string $name, private string $email, private string $password, private ?int $id = null, private ?string $createdAt = null, private ?string $updatedAt = null) {}

  public function getName(): string
  {
    return $this->name;
  }
  public function getEmail(): string
  {
    return $this->email;
  }
  public function getPassword(): string
  {
    return $this->password;
  }
  public function getId(): ?int
  {
    return $this->id;
  }
  public function setId(int $id)
  {
    $this->id = $id;
  }
  public function getCreatedAt(): ?string
  {
    return $this->createdAt;
  }
  public function setCreatedAt(string $date)
  {
    $this->createdAt = $date;
  }
  public function getUpdatedAt(): ?string
  {
    return $this->updatedAt;
  }
  public function setUpdatedAt(string $date)
  {
    $this->updatedAt = $date;
  }
}
