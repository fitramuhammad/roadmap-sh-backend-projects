<?php

namespace Todo\Repositories;

use Todo\Models\RefreshToken;

interface RefreshTokenRepositoryInterface
{
  public function save(RefreshToken $token): RefreshToken;
  public function findByTokenHash(string $tokenHash): ?RefreshToken;
  public function revoke(string $tokenHash): void;
  public function deleteExpired(): void;
}
