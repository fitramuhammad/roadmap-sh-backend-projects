<?php

namespace Todo\Controllers;

use Todo\Config\Database;
use Todo\Middleware\AuthMiddleware;
use Todo\Repositories\TodoRepository;
use Todo\Models\Todo;

class TodoController
{
  public function create()
  {
    header("Content-Type: application/json");
    $request = json_decode(file_get_contents("php://input"));
    $userId = AuthMiddleware::userId();

    if (empty($request->title) || empty($request->description)) {
      http_response_code(400);
      echo json_encode([
        "errors" => [
          "message" => "Missing title or description"
        ]
      ]);
      return;
    }

    $todo = new Todo($userId, $request->title, $request->description);
    $conn = Database::connect();
    $response = new TodoRepository($conn)->save($todo);

    http_response_code(201);
    echo json_encode($response);
    return;
  }

  public function update(int $id)
  {
    header("Content-Type: application/json");
    $request = json_decode(file_get_contents("php://input"));
    $userId = AuthMiddleware::userId();
    $conn = Database::connect();

    $newTodo = new TodoRepository($conn)->update(new Todo($userId, $request->title, $request->description, $id));

    if (!$newTodo) {
      http_response_code(404);
      echo json_encode([
        "errors" => [
          "message" => "Id not found."
        ]
      ]);
      return;
    }

    echo json_encode($newTodo);
    return;
  }

  public function delete(int $id)
  {
    header("Content-Type: application/json");
    $conn = Database::connect();
    $userId = AuthMiddleware::userId();

    $todoToDelete = new TodoRepository($conn)->delete($id, $userId);

    if (!$todoToDelete) {
      http_response_code(404);
      echo json_encode([
        "errors" => [
          "message" => "Todo with id {$id} doesn't exist"
        ]
      ]);
      return;
    }

    http_response_code(204);
  }

  public function getAll()
  {
    header("Content-Type: application/json");
    $conn = Database::connect();

    $page = filter_input(INPUT_GET, "page", FILTER_VALIDATE_INT) ?: 1;
    $limit = filter_input(INPUT_GET, "limit", FILTER_VALIDATE_INT) ?: 10;
    $offset = ($page - 1) * $limit;

    $userId = AuthMiddleware::userId();

    $res = new TodoRepository($conn)->fetchAll($userId, $limit, $offset);

    if ($res && $limit && $page) {
      echo json_encode([
        "data" => $res,
        "page" => $page,
        "limit" => $limit,
        "total" => count($res)
      ]);
      return;
    } else {
      echo json_encode([
        "data" => $res,
        "total" => count($res)
      ]);
    }
  }
}
