<?php

namespace App\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

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

  public static function verifyToken(string $token): \stdClass
  {
    return JWT::decode($token, new Key(self::getSecretKey(), "HS256"));
  }
}
