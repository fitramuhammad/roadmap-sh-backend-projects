<?php

use Todo\Controllers\AuthController;
use Todo\Controllers\TodoController;
use Todo\Controllers\UserController;
use Todo\Routes\Router;
use Todo\Middleware\AuthMiddleware;


$router = new Router();

$router->post("/", [UserController::class, "register"]);
$router->post("/login", [AuthController::class, "login"]);

$router->post("/todos", [TodoController::class, "create"], [AuthMiddleware::class]);
$router->put("/todos/{id}", [TodoController::class, "update"], [AuthMiddleware::class]);
$router->delete("/todos/{id}", [TodoController::class, "delete"], [AuthMiddleware::class]);
$router->get("/todos", [TodoController::class, "getAll"], [AuthMiddleware::class]);

return $router;
