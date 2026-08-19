<?php

namespace Todo\Repositories;

use Todo\Models\User;

interface UserRepositoryInterface {
    public function save(User $user): User;
    public function findByEmail(string $email): ?User;
    public function findById(int $id): ?User;
}
