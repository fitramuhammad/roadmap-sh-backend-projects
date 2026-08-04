<?php

namespace Blog\Controllers;

use Blog\Repositories\PostRepository;

class PostController
// TODO: implement filter
{
  private PostRepository $repository;

  public function __construct(?PostRepository $repository = null)
  {
    $this->repository = $repository ?? new PostRepository();
  }

  public function index()
  {
    header('Content-Type: application/json');
    $blogs = $this->repository->getAll();
    echo json_encode($blogs) . PHP_EOL;
  }

  public function show(int $id)
  {
    header('Content-Type: application/json');
    $post = $this->repository->getById($id);

    if ($post) {
      echo json_encode($post) . PHP_EOL;
      return;
    }

    http_response_code(404);
    echo json_encode([
      "error" => [
        "message" => "Post with id $id not found."
      ]
    ]) . PHP_EOL;
    return;
  }

  protected function getPayload(): string
  {
    return file_get_contents("php://input") ?: '';
  }

  protected function validateAndSanitizePayload(array $payload): ?array
  {
    if (!isset($payload['title']) || !is_string($payload['title'])) return null;
    if (!isset($payload['content']) || !is_string($payload['content'])) return null;
    if (!isset($payload['category']) || !is_string($payload['category'])) return null;
    if (!isset($payload['tags']) || !is_array($payload['tags'])) return null;

    $tags = array_filter($payload['tags'], 'is_string');

    return [
      'title' => htmlspecialchars(trim($payload['title']), ENT_QUOTES, 'UTF-8'),
      'content' => htmlspecialchars(trim($payload['content']), ENT_QUOTES, 'UTF-8'),
      'category' => htmlspecialchars(trim($payload['category']), ENT_QUOTES, 'UTF-8'),
      'tags' => array_values(array_map(function ($tag) {
        return htmlspecialchars(trim($tag), ENT_QUOTES, 'UTF-8');
      }, $tags))
    ];
  }

  public function store()
  {
    header('Content-Type: application/json');
    $payload = (array) json_decode($this->getPayload(), true);
    $sanitized = $this->validateAndSanitizePayload($payload);

    if ($sanitized !== null) {
      $res = $this->repository->store($sanitized);

      if (!$res) {
        http_response_code(500);
        echo json_encode([
          "error" => [
            "message" => "Internal server error."
          ]
        ]) . PHP_EOL;
        return;
      }

      http_response_code(201);
      echo json_encode($res) . PHP_EOL;
      return;
    }

    http_response_code(400);
    echo json_encode([
      "error" => [
        "message" =>  "blog post should have title, content, category, and tags fields"
      ]
    ]) . PHP_EOL;
    return;
  }

  public function update(int $id)
  {
    header('Content-Type: application/json');
    $payload = (array) json_decode($this->getPayload(), true);
    $sanitized = $this->validateAndSanitizePayload($payload);

    if ($sanitized !== null) {
      $res = $this->repository->update($sanitized, $id);

      if (!$res) {
        http_response_code(404);
        echo json_encode([
          "error" => [
            "message" => "Post with id $id not found."
          ]
        ]) . PHP_EOL;
        return;
      }

      echo json_encode($res) . PHP_EOL;
      return;
    }

    http_response_code(400);
    echo json_encode([
      "error" => [
        "message" =>  "blog post should have title, content, category, and tags fields"
      ]
    ]) . PHP_EOL;
    return;
  }

  public function destroy(int $id)
  {
    header('Content-Type: application/json');
    $res = $this->repository->destroy($id);

    if (!$res) {
      http_response_code(404);
      echo json_encode([
        "error" => [
          "message" => "Post with id $id not found."
        ]
      ]) . PHP_EOL;
      return;
    }

    http_response_code(204);
    return;
  }
}
