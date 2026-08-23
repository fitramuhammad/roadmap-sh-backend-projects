<?php

use Todo\Controllers\AuthController;
use Todo\Controllers\TodoController;
use Todo\Controllers\UserController;
use Todo\Routes\Router;
use Todo\Middleware\AuthMiddleware;
use Todo\Middleware\RateLimitMiddleware;

$router = new Router();

$router->post("/", [UserController::class, "register"]);
$router->post("/login", [AuthController::class, "login"], [new RateLimitMiddleware(60, 5)]);

$router->post("/todos", [TodoController::class, "create"], [AuthMiddleware::class, new RateLimitMiddleware(60, 10)]);
$router->put("/todos/{id}", [TodoController::class, "update"], [AuthMiddleware::class, new RateLimitMiddleware(60, 10)]);
$router->delete("/todos/{id}", [TodoController::class, "delete"], [AuthMiddleware::class, new RateLimitMiddleware(60, 10)]);
$router->get("/todos", [TodoController::class, "getAll"], [AuthMiddleware::class, new RateLimitMiddleware(60, 60)]);

return $router;
