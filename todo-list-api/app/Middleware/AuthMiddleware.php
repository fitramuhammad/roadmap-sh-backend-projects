<?php

namespace Todo\Middleware;

use Todo\Utils\JwtUtil;

class AuthMiddleware
{
  private static ?object $authenticateUser = null;
  public static function handle(): void
  {
    $authHeader = trim($_SERVER["HTTP_AUTHORIZATION"] ?? "");

    if (empty($authHeader) && function_exists("apache_request_headers")) {
      $headers = apache_request_headers();
      $authHeader = $headers["Authorization"] ?? $headers["authorization"] ?? "";
    }

    if (!preg_match('/^Bearer\s+(\S+)$/i', $authHeader, $matches)) {
      self::unauthorized();
    }

    $token = JwtUtil::validateToken($matches[1]);
    if (!$token) {
      self::unauthorized();
    }

    self::$authenticateUser = $token;
  }

  private static function unauthorized(): void
  {
    http_response_code(401);
    header("Content-Type: application/json");
    echo json_encode([
      "errors" => [
        "message" => "Unauthorized"
      ]
    ]);
    exit();
  }

  public static function userId(): ?int
  {
    return self::$authenticateUser ? self::$authenticateUser->sub : null;
  }
}
