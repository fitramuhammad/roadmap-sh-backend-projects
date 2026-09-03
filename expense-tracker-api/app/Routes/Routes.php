<?php

use App\Controllers\AuthController;
use App\Controllers\ExpenseController;
use App\Utils\JwtUtil;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\App;

return function (App $app) {
  $authMiddleware = function (Request $request, RequestHandler $handler) {
    $authHeader = $request->getHeaderLine("Authorization");

    if (empty($authHeader) || !str_starts_with($authHeader, "Bearer ")) {
      $response = new \Slim\Psr7\Response();
      $response->getBody()->write(json_encode(
        ["errors" => ["message" => "Unauthorized"]],
        JSON_THROW_ON_ERROR
      ));
      return $response
        ->withHeader("Content-Type", "application/json")
        ->withStatus(401);
    }

    $token = substr($authHeader, 7);

    try {
      $decoded = JwtUtil::verifyToken($token);
      $request = $request->withAttribute("userId", (int) $decoded->sub);
    } catch (\Exception $_e) {
      $response = new \Slim\Psr7\Response();
      $response->getBody()->write(json_encode(
        ["errors" => ["message" => "Invalid or expired token"]],
        JSON_THROW_ON_ERROR
      ));
      return $response
        ->withHeader("Content-Type", "application/json")
        ->withStatus(401);
    }

    return $handler->handle($request);
  };

  // Public routes
  $app->post("/login", [AuthController::class, "login"]);
  $app->post("/register", [AuthController::class, "register"]);

  // Protected routes
  $app->group('', function ($group) {
    $group->get('/expenses',         [ExpenseController::class, 'index']);
    $group->post('/expenses',        [ExpenseController::class, 'store']);
    $group->put('/expenses/{id}',    [ExpenseController::class, 'update']);
    $group->delete('/expenses/{id}', [ExpenseController::class, 'destroy']);
  })->add($authMiddleware);
};
