<?php

namespace Todo\Controllers;

use Exception;
use Todo\Config\Database;
use Todo\Models\User;
use Todo\Repositories\UserRepository;
use Todo\Utils\JwtUtil;

class UserController
{
  public function register()
  {
    header("Content-Type: application/json");
    $data = json_decode(file_get_contents("php://input"), true);

    $request = new RegisterRequest();

    try {
      $request->validate($data);

      $hashedPassword = password_hash($request->password, PASSWORD_BCRYPT);
      $user = new User($request->name, $request->email, $hashedPassword);

      $userRepo = new UserRepository(new Database()->connect());

      if ($userRepo->findByEmail($request->email)) {
        http_response_code(409);
        echo json_encode([
          "errors" => [
            "message" => "Email is already registered."
          ]
        ]);
        return;
      }

      $id = $userRepo->save($user)->getId();

      http_response_code(201);
      echo json_encode([
        "token" => JwtUtil::generateToken($id)
      ]);
      return;
    } catch (Exception $e) {
      http_response_code(400);
      echo json_encode([
        "errors" => [
          "message" => $e->getMessage()
        ]
      ]);
    }
  }
}

class RegisterRequest
{
  public string $name;
  public string $email;
  public string $password;

  public function validate(?array $data): bool
  {
    if (empty($data["name"]) || empty($data["email"]) || empty($data["password"])) {
      throw new Exception("Missing field");
    }

    $this->name = $data["name"];
    $this->email = $data["email"];
    $this->password = $data["password"];

    return true;
  }
}
