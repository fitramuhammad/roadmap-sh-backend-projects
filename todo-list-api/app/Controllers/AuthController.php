<?php

namespace Todo\Controllers;

use Exception;
use Todo\Config\Database;
use Todo\Models\RefreshToken;
use Todo\Models\User;
use Todo\Repositories\RefreshTokenRepository;
use Todo\Repositories\UserRepository;
use Todo\Utils\JwtUtil;

class AuthController
{
  public function register()
  {
    header("Content-Type: application/json");
    $data = json_decode(file_get_contents("php://input"), true);

    $request = new AuthRegisterRequest();

    try {
      $request->validate($data);

      $userRepo = new UserRepository(Database::connect());

      if ($userRepo->findByEmail($request->email)) {
        http_response_code(409);
        echo json_encode([
          "errors" => [
            "message" => "Email is already registered."
          ]
        ]);
        return;
      }

      $hashedPassword = password_hash($request->password, PASSWORD_BCRYPT);
      $user = new User($request->name, $request->email, $hashedPassword);
      $savedUser = $userRepo->save($user);

      $refreshTokenRepo = new RefreshTokenRepository(Database::connect());
      $rawRefreshToken = JwtUtil::generateRefreshToken();
      $refreshTokenHash = JwtUtil::hashToken($rawRefreshToken);

      $accessToken = JwtUtil::generateToken($savedUser->getId());
      $refreshToken = new RefreshToken($savedUser->getId(), $refreshTokenHash, JwtUtil::getRefreshTokenExpiresAt());
      $refreshTokenRepo->save($refreshToken);

      http_response_code(201);
      echo json_encode([
        "message" => "User registered successfully",
        "data" => [
          "id" => $savedUser->getId(),
          "name" => $savedUser->getName(),
          "email" => $savedUser->getEmail()
        ],
        "access_token" => $accessToken,
        "refresh_token" => $rawRefreshToken
      ]);
      return;
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

  public function login()
  {
    header("Content-Type: application/json");
    $data = json_decode(file_get_contents("php://input"), true);

    $request = new LoginRequest();
    $refreshTokenRepo = new RefreshTokenRepository(Database::connect());
    $rawRefreshToken = JwtUtil::generateRefreshToken();
    $refreshTokenHash = JwtUtil::hashToken($rawRefreshToken);

    try {
      $request->validate($data);
      $user = new UserRepository(Database::connect())->findByEmail($request->email);

      if ($user && password_verify($request->password, $user->getPassword())) {
        $accessToken = JwtUtil::generateToken($user->getId());
        $refreshToken = new RefreshToken($user->getId(), $refreshTokenHash, JwtUtil::getRefreshTokenExpiresAt());
        $refreshTokenRepo->save($refreshToken);

        echo json_encode([
          "access_token" => $accessToken,
          "refresh_token" => $rawRefreshToken
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

  public function refresh()
  {
    header("Content-Type: application/json");
    $requestData = json_decode(file_get_contents("php://input"), true);

    if (empty($requestData["refresh_token"])) {
      http_response_code(400);
      echo json_encode([
        "errors" => [
          "message" => "Missing refresh_token"
        ]
      ]);
      return;
    }

    $refreshTokenRepo = new RefreshTokenRepository(Database::connect());

    $rawToken = trim($requestData["refresh_token"]);
    $tokenHash = JwtUtil::hashToken($rawToken);
    $tokenRecord = $refreshTokenRepo->findByTokenHash($tokenHash);

    if (!$tokenRecord || !$tokenRecord->isValid()) {
      http_response_code(401);
      echo json_encode([
        "errors" => [
          "message" => "Refresh token invalid."
        ]
      ]);
      return;
    }

    $newAccessToken = JwtUtil::generateToken($tokenRecord->getUserId());
    $rawNewRefreshToken = JwtUtil::generateRefreshToken();
    $newRefreshToken = new RefreshToken($tokenRecord->getUserId(), JwtUtil::hashToken($rawNewRefreshToken), JwtUtil::getRefreshTokenExpiresAt());

    $refreshTokenRepo->revoke($tokenHash);
    $refreshTokenRepo->save($newRefreshToken);

    echo json_encode([
      "access_token" => $newAccessToken,
      "refresh_token" => $rawNewRefreshToken
    ]);
    return;
  }

  public function logout()
  {
    header("Content-Type: application/json");
    $requestData = json_decode(file_get_contents("php://input"), true);

    if (empty($requestData["refresh_token"])) {
      http_response_code(400);
      echo json_encode([
        "errors" => [
          "message" => "Missing refresh_token"
        ]
      ]);
      return;
    }

    $refreshTokenRepo = new RefreshTokenRepository(Database::connect());

    $tokenHash = JwtUtil::hashToken(trim($requestData["refresh_token"]));
    $tokenRecord = $refreshTokenRepo->findByTokenHash($tokenHash);

    if ($tokenRecord !== null && $tokenRecord->isValid()) {
      $refreshTokenRepo->revoke($tokenHash);
    }

    echo json_encode([
      "message" => "Logged out successfully"
    ]);
    return;
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

class AuthRegisterRequest
{
  public string $name;
  public string $email;
  public string $password;

  public function validate(?array $data): bool
  {
    if (empty($data["name"]) || empty($data["email"]) || empty($data["password"])) {
      throw new Exception("Missing field");
    }

    if (!filter_var($data["email"], FILTER_VALIDATE_EMAIL)) {
      throw new Exception("Invalid email format");
    }

    if (strlen($data["password"]) < 6) {
      throw new Exception("Password must be at least 6 characters");
    }

    $this->name = trim($data["name"]);
    $this->email = trim($data["email"]);
    $this->password = $data["password"];

    return true;
  }
}
