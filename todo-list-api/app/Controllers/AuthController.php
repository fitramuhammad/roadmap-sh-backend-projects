<?php

namespace Todo\Controllers;

use Exception;
use Todo\Config\Database;
use Todo\Repositories\UserRepository;
use Todo\Utils\JwtUtil;

class AuthController
{
  public function register()
  {
    // TODO: Implementation for registration
  }

  public function login()
  {
    header("Content-Type: application/json");
    $data = json_decode(file_get_contents("php://input"), true);

    $request = new LoginRequest();

    try {
      $request->validate($data);
      $user = new UserRepository(new Database()->connect())->findByEmail($request->email);

      if ($user && password_verify($request->password, $user->getPassword())) {
        echo json_encode([
          "token" => JwtUtil::generateToken($user->getId())
        ]);
        return;
      } else {
        http_response_code(401);
        echo json_encode([
          "errors" => [
            "message" => "Invalid email or password."
          ]
        ]);
        return;
      }
    } catch (Exception $e) {
      http_response_code(400);
      echo json_encode([
        "errors" => [
          "message" => $e->getMessage()
        ]
      ]);
      return;
    }
  }
}

class LoginRequest
{
  public string $email;
  public string $password;

  public function validate(?array $data): bool
  {
    if (empty($data["email"]) || empty($data["password"])) {
      throw new Exception("Missing field");
    }

    $this->email = trim($data["email"]);
    $this->password = $data["password"];

    return true;
  }
}
