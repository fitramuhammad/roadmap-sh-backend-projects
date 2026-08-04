<?php

require_once dirname(__DIR__) . "/vendor/autoload.php";

$router = require_once dirname(__DIR__) . "/app/Routes/api.php";
$router->run();
