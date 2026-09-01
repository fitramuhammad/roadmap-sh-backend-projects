<?php

namespace App\Controllers;

use App\Config\Database;
use App\Utils\JwtUtil;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AuthController
{
  public function login(Request $request, Response $response): Response
  {
    $body = (array) $request->getParsedBody();
    $email = trim($body["email"] ?? "");
    $password = $body["password"] ?? "";

    if ($email === "" || $password === "") {
      return $this->json($response, ["errors" => ["message" => "Email and Password required."]], 400);
    }

    $pdo = Database::connect();
    $stmt = $pdo->prepare("SELECT id, email, password FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user["password"])) {
      return $this->json($response, ["errors" => ["message" => "Invalid Email or Password."]], 401);
    }

    $token = JwtUtil::generateKey($user["id"]);

    return $this->json($response, ["token" => $token]);
  }

  private function json(Response $response, array $data, int $status = 200): Response
  {
    $response->getBody()->write(json_encode($data));
    return $response->withStatus($status)->withHeader("Content-Type", "application/json");
  }
}
