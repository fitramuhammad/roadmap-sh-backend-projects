<?php

namespace Blog\Routes;

class Router
{
  private $routes = [];

  public function get(string $uri, array $controllerAction)
  {
    $this->routes["GET"][$uri] = $controllerAction;
  }

  public function post(string $uri, array $controllerAction)
  {
    $this->routes["POST"][$uri] = $controllerAction;
  }

  public function put(string $uri, array $controllerAction)
  {
    $this->routes["PUT"][$uri] = $controllerAction;
  }

  public function delete(string $uri, array $controllerAction)
  {
    $this->routes["DELETE"][$uri] = $controllerAction;
  }

  public function run()
  {
    $uri = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
    $method = $_SERVER["REQUEST_METHOD"];

    // CORS Headers
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");

    if ($method === 'OPTIONS') {
      http_response_code(200);
      return;
    }

    if (isset($this->routes[$method])) {
      foreach ($this->routes[$method] as $routeUri => $controllerAction) {
        $pattern = preg_replace('/\{id\}/', '([0-9]+)', $routeUri);
        $pattern = preg_replace('/\{[a-zA-Z0-9_]+\}/', '([a-zA-Z0-9_-]+)', $pattern);
        $pattern = '#^' . $pattern . '$#';

        if (preg_match($pattern, $uri, $variables)) {
          array_shift($variables);

          list($controllerClass, $actionName) = $controllerAction;

          if (class_exists($controllerClass) && method_exists($controllerClass, $actionName)) {
            $controller = new $controllerClass();
            $controller->$actionName(...$variables);
            return;
          } else {
            $this->notFound("Class {$controllerClass} or method {$actionName} not found.");
            return;
          }
        }
      }
    }

    $this->notFound("Page Not Found");
  }

  public function notFound(string $message)
  {
    http_response_code(404);
    header("Content-Type: application/json");
    echo json_encode([
      "error" => [
        "message" => $message
      ]
    ]);
    return;
  }
}
