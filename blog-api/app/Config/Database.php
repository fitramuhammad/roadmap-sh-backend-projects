<?php

namespace Blog\Config;

use PDO;
use PDOException;

class Database
{
  private PDO $connection;
  public function __construct()
  {
    $dotenv = \Dotenv\Dotenv::createImmutable(dirname(__DIR__, 2));
    $dotenv->load();
  }

  public function connect()
  {
    if (isset($this->connection)) {
      return $this->connection;
    }

    try {
      $dsn = "pgsql:host={$_ENV["DB_HOST"]};port={$_ENV["DB_PORT"]};dbname={$_ENV["DB_NAME"]};";
      $this->connection = new PDO($dsn, $_ENV["DB_USER"], $_ENV["DB_PASSWORD"]);
      return $this->connection;
    } catch (PDOException $_error) {
      http_response_code(500);
      echo json_encode([
        "error" => [
          "message" => "Database connection failed."
        ]
      ]);
      exit();
    }
  }
}
