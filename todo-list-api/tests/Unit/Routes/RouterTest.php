<?php

namespace Todo\Tests\Unit\Routes;

use PHPUnit\Framework\TestCase;
use Todo\Routes\Router;

class DummyTestController
{
  public static bool $called = false;
  public static ?int $receivedId = null;

  public function testAction(?int $id = null): void
  {
    self::$called = true;
    self::$receivedId = $id;
  }
}

class RouterTest extends TestCase
{
  protected function setUp(): void
  {
    parent::setUp();
    DummyTestController::$called = false;
    DummyTestController::$receivedId = null;
  }

  public function testRouterRegistersRoutesCorrectly(): void
  {
    $router = new Router();
    $router->get("/todos", [DummyTestController::class, "testAction"]);
    $router->post("/todos", [DummyTestController::class, "testAction"]);
    $router->put("/todos/{id}", [DummyTestController::class, "testAction"]);
    $router->delete("/todos/{id}", [DummyTestController::class, "testAction"]);

    $reflection = new \ReflectionClass($router);
    $routesProperty = $reflection->getProperty("routes");
    $routes = $routesProperty->getValue($router);

    $this->assertArrayHasKey("GET", $routes);
    $this->assertArrayHasKey("POST", $routes);
    $this->assertArrayHasKey("PUT", $routes);
    $this->assertArrayHasKey("DELETE", $routes);

    $this->assertArrayHasKey("/todos", $routes["GET"]);
    $this->assertArrayHasKey("/todos", $routes["POST"]);
    $this->assertArrayHasKey("/todos/{id}", $routes["PUT"]);
    $this->assertArrayHasKey("/todos/{id}", $routes["DELETE"]);
  }
}
