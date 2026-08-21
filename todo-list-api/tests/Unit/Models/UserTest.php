<?php

namespace Todo\Tests\Unit\Models;

use PHPUnit\Framework\TestCase;
use Todo\Models\User;

class UserTest extends TestCase
{
  public function testCanInstantiateUserAndAccessProperties(): void
  {
    $user = new User("John", "john@example.com", "hashed_password", 1, "2026-08-20 10:00:00", "2026-08-20 10:00:00");

    $this->assertEquals(1, $user->getId());
    $this->assertEquals("John", $user->getName());
    $this->assertEquals("john@example.com", $user->getEmail());
    $this->assertEquals("hashed_password", $user->getPassword());
    $this->assertEquals("2026-08-20 10:00:00", $user->getCreatedAt());
    $this->assertEquals("2026-08-20 10:00:00", $user->getUpdatedAt());
  }

  public function testSettersUpdateUserPropertiesCorrectly(): void
  {
    $user = new User("John", "john@example.com", "secret123");

    $user->setId(50);
    $user->setCreatedAt("2026-08-21 00:00:00");
    $user->setUpdatedAt("2026-08-21 01:00:00");

    $this->assertEquals(50, $user->getId());
    $this->assertEquals("2026-08-21 00:00:00", $user->getCreatedAt());
    $this->assertEquals("2026-08-21 01:00:00", $user->getUpdatedAt());
  }
}
