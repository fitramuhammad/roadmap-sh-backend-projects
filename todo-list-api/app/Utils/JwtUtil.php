<?php

namespace Todo\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JwtUtil
{
  // Token expires in 15 minutes
  public const ACCESS_TOKEN_TTL = 900;

  // Token expires in 7 days
  public const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

  private static function getSecretKey(): string
  {
    return $_ENV["JWT_SECRET"];
  }

  private static function getRefreshSecretKey(): string
  {
    return $_ENV["JWT_REFRESH_SECRET"];
  }

  public static function generateToken(int $userId): string
  {
    $secretKey = self::getSecretKey();
    $issuedAt = time();
    $expirationTime = $issuedAt + self::ACCESS_TOKEN_TTL;

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

  public static function generateRefreshToken(): string
  {
    return bin2hex(random_bytes(32));
  }

  public static function hashToken(string $token): string
  {
    return hash_hmac("sha256", $token, self::getRefreshSecretKey());
  }

  public static function getRefreshTokenExpiresAt(): string
  {
    return date("Y-m-d H:i:s", time() + self::REFRESH_TOKEN_TTL);
  }
}
