<?php

namespace Blog\Repositories;

use Blog\Models\Post;

class PostRepository
{
    public function getAll()
    {
        return Post::collection();
    }

    public function getById(int $id)
    {
        return Post::getById($id);
    }

    public function store(array $payload)
    {
        return Post::store($payload);
    }

    public function update(array $payload, int $id)
    {
        return Post::update(json_encode($payload), $id);
    }

    public function destroy(int $id)
    {
        return Post::destroy($id);
    }
}
