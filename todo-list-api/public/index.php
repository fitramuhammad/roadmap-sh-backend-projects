<?php

require_once dirname(__DIR__) . "/vendor/autoload.php";

$dotenv = \Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->load();

$router = require_once dirname(__DIR__) . "/app/Routes/api.php";
$router->run();
