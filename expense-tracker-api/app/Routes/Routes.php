<?php

use App\Controllers\AuthController;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\App;

return function (App $app) {
  $authMiddleware = function (Request $request, RequestHandler $handler) {
    $token = $request->getHeaderLine("Authorization");

    if (empty($token)) {
      $response = new Slim\psr7\Response();
      $response->getBody()->write(json_encode([
        "errors" => [
          "message" => "Unauthorized"
        ]
      ]));
      return $response
        ->withHeader("Content-Type", "application/json")
        ->withStatus(401);
    }
  };

  $authController = new AuthController();
  $app->post("/login", [$authController, "login"]);
};
