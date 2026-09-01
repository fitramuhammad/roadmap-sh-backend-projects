<?php

namespace App\Utils;

use Firebase\JWT\JWT;

class JwtUtil
{
  private static function getSecretKey(): string
  {
    return $_ENV["JWT_SECRET"];
  }

  public static function generateKey(int $userId): string
  {
    $secretKey = self::getSecretKey();
    $issuedAt = time();
    $expirationTime = $issuedAt + 3600;

    $payload = [
      "iat" => $issuedAt,
      "exp" => $expirationTime,
      "sub" => $userId
    ];

    return JWT::encode($payload, $secretKey, "HS256");
  }
}
