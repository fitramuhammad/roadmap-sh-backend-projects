<?php

namespace Todo\Config;

use PDO;
use PDOException;

class Database
{
  private static ?PDO $connection = null;

  public static function connect()
  {

    if (self::$connection == null) {
      try {
        $dsn = "pgsql:host={$_ENV["DB_HOST"]};port={$_ENV["DB_PORT"]};dbname={$_ENV["DB_NAME"]};";
        self::$connection = new PDO($dsn, $_ENV["DB_USER"], $_ENV["DB_PASSWORD"]);
        return self::$connection;
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

    return self::$connection;
  }
}
