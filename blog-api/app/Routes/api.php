<?php

use Blog\Routes\Router;
use Blog\Controllers\PostController;

$router = new Router();

$router->get("/posts", [PostController::class, "index"]);
$router->post("/posts", [PostController::class, "store"]);
$router->get("/posts/{id}", [PostController::class, "show"]);
$router->put("/posts/{id}", [PostController::class, "update"]);
$router->delete("/posts/{id}", [PostController::class, "destroy"]);

return $router;
