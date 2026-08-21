<?php

namespace Todo\Repositories;

use Todo\Models\Todo;

interface TodoRepositoryInterface
{
  public function save(Todo $todo): Todo;
  public function update(Todo $todo): ?Todo;
  public function delete(int $id, int $userId): bool;
  public function fetchAll(int $userId, ?string $filter = "", ?string $sort = "ASC", ?int $limit = 0, ?int $offset = 0): array;
  public function count(int $userId, ?string $filter = ""): int;
}
