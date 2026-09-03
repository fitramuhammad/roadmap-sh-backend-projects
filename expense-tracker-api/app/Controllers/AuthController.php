<?php

namespace App\Controllers;

use App\Models\User;
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

    $user = User::findByEmail($email);

    if (!$user || !$user->verifyPassword($password)) {
      return $this->json($response, ["errors" => ["message" => "Invalid Email or Password."]], 401);
    }

    $token = JwtUtil::generateKey($user->getId());

    return $this->json($response, ["token" => $token]);
  }

  public function register(Request $request, Response $response): Response
  {
    $body = (array) $request->getParsedBody();
    $name = trim($body["name"] ?? "");
    $email = trim($body["email"] ?? "");
    $password = $body["password"] ?? "";

    if ($name === "" || $email === "" || $password === "") {
      return $this->json($response, ["errors" => ["message" => "Missing credentials."]], 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
      return $this->json($response, ["errors" => ["message" => "Invalid email address."]], 422);
    }

    try {
      $user = User::create($name, $email, $password);
    } catch (\PDOException $e) {
      $code = $e->getCode();
      if ($code === '23000' || $code === '23505') {
        return $this->json($response, ["errors" => ["message" => "Email already in use."]], 409);
      }
      throw $e;
    }

    $token = JwtUtil::generateKey($user->getId());

    return $this->json($response, ["token" => $token]);
  }

  private function json(Response $response, array $data, int $status = 200): Response
  {
    $response->getBody()->write(json_encode($data, JSON_THROW_ON_ERROR));
    return $response->withStatus($status)->withHeader("Content-Type", "application/json");
  }
}
