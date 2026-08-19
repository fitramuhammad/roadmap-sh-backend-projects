<?php

namespace Todo\Repositories;

use Todo\Models\Todo;

interface TodoRepositoryInterface
{
  public function save(Todo $todo): Todo;
  public function update(Todo $todo): ?Todo;
  public function delete(int $id, int $userId): bool;
}
