<?php

namespace Todo\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JwtUtil
{
  private static function getSecretKey(): string
  {
    return $_ENV["JWT_SECRET"];
  }

  public static function generateToken(int $userId): string
  {
    $secretKey = self::getSecretKey();

    $issuedAt = time();

    // Token expires in 1 hour
    $expirationTime = $issuedAt + 3600;

    $payload = [
      'iat' => $issuedAt,
      'exp' => $expirationTime,
      'sub' => $userId
    ];

    return JWT::encode($payload, $secretKey, 'HS256');
  }

  public static function validateToken(string $token)
  {
    try {
      $secretKey = self::getSecretKey();
      $decoded = JWT::decode($token, new Key($secretKey, 'HS256'));
      return $decoded;
    } catch (Exception $_e) {
      return false;
    }
  }
}
