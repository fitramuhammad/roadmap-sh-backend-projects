<?php

namespace App\Config;

use PDO;
use PDOException;

class Database
{
  private static ?PDO $connection = null;

  public static function connect(): PDO
  {
    if (self::$connection == null) {
      $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', $_ENV["DB_HOST"], $_ENV["DB_PORT"], $_ENV["DB_NAME"]);

      try {
        self::$connection = new PDO($dsn, $_ENV["DB_USER"], $_ENV["DB_PASSWORD"], [
          PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
          PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
          PDO::ATTR_EMULATE_PREPARES => false
        ]);
      } catch (PDOException $e) {
        throw new PDOException("Database connection failed: " . $e->getMessage(), (int) $e->getCode());
      }
    }

    return self::$connection;
  }
}
