<?php

namespace Todo\Tests\Unit\Models;

use PHPUnit\Framework\TestCase;
use Todo\Models\Todo;

class TodoTest extends TestCase
{
  public function testCanInstantiateTodoAndAccessProperties(): void
  {
    $todo = new Todo(1, "Learn PHP", "Learn PHPUnit Testing", 10, "2026-08-20 10:00:00", "2026-08-20 12:00:00");

    $this->assertEquals(10, $todo->getId());
    $this->assertEquals(1, $todo->getUserId());
    $this->assertEquals("Learn PHP", $todo->getTitle());
    $this->assertEquals("Learn PHPUnit Testing", $todo->getDescription());
    $this->assertEquals("2026-08-20 10:00:00", $todo->getCreatedAt());
    $this->assertEquals("2026-08-20 12:00:00", $todo->getUpdatedAt());
  }

  public function testSettersUpdatePropertiesCorrectly(): void
  {
    $todo = new Todo(1, "Old Title", "Old Desc");

    $todo->setId(99);
    $todo->setCreatedAt("2026-08-21 00:00:00");
    $todo->setUpdatedAt("2026-08-21 01:00:00");

    $this->assertEquals(99, $todo->getId());
    $this->assertEquals("2026-08-21 00:00:00", $todo->getCreatedAt());
    $this->assertEquals("2026-08-21 01:00:00", $todo->getUpdatedAt());
  }

  public function testJsonSerializeReturnsExpectedStructure(): void
  {
    $todo = new Todo(2, "Test API", "Test Todo Serialization", 5);

    $serialized = $todo->jsonSerialize();

    $this->assertIsArray($serialized);
    $this->assertArrayHasKey("id", $serialized);
    $this->assertArrayHasKey("title", $serialized);
    $this->assertArrayHasKey("description", $serialized);
    $this->assertEquals(5, $serialized["id"]);
    $this->assertEquals("Test API", $serialized["title"]);
    $this->assertEquals("Test Todo Serialization", $serialized["description"]);
  }
}
