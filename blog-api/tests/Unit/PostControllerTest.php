<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use Blog\Controllers\PostController;
use Blog\Repositories\PostRepository;
use Blog\Models\Post;

class PostControllerTest extends TestCase
{
    private $repositoryMock;
    private $controller;

    protected function setUp(): void
    {
        http_response_code(200);
        $this->repositoryMock = $this->createMock(PostRepository::class);
        $this->controller = new PostController($this->repositoryMock);
    }

    private function createControllerWithPayload(string $payload)
    {
        // Mock getPayload to simulate php://input
        $controller = $this->getMockBuilder(PostController::class)
            ->setConstructorArgs([$this->repositoryMock])
            ->onlyMethods(['getPayload'])
            ->getMock();
        
        $controller->expects($this->once())->method('getPayload')->willReturn($payload);
        
        return $controller;
    }

    public function testIndexReturnsPosts()
    {
        $mockPostData = [
            "id" => 1,
            "title" => "Test Title",
            "content" => "Test Content",
            "category" => "Tech",
            "tags" => ["test"],
            "created_at" => "2024-01-01 10:00:00",
            "updated_at" => "2024-01-01 10:00:00",
            "data" => json_encode([
                "title" => "Test Title",
                "content" => "Test Content",
                "category" => "Tech",
                "tags" => ["test"]
            ])
        ];
        
        $mockPost = new Post($mockPostData);
        $this->repositoryMock->expects($this->once())->method('getAll')->willReturn([$mockPost]);

        ob_start();
        $this->controller->index();
        $output = ob_get_clean();

        $expected = json_encode([$mockPost]) . PHP_EOL;
        $this->assertEquals($expected, $output);
    }

    public function testShowReturnsPostWhenFound()
    {
        $mockPostData = [
            "id" => 1,
            "created_at" => "2024-01-01 10:00:00",
            "updated_at" => "2024-01-01 10:00:00",
            "data" => json_encode([
                "title" => "Test Title",
                "content" => "Test Content",
                "category" => "Tech",
                "tags" => ["test"]
            ])
        ];
        
        $mockPost = new Post($mockPostData);
        $this->repositoryMock->expects($this->once())->method('getById')->with(1)->willReturn($mockPost);

        ob_start();
        $this->controller->show(1);
        $output = ob_get_clean();

        $expected = json_encode($mockPost) . PHP_EOL;
        $this->assertEquals($expected, $output);
    }

    public function testShowReturns404WhenNotFound()
    {
        $this->repositoryMock->expects($this->once())->method('getById')->with(99)->willReturn(null);

        ob_start();
        $this->controller->show(99);
        $output = ob_get_clean();

        $this->assertStringContainsString("Post with id 99 not found", $output);
        $this->assertEquals(404, http_response_code());
    }

    public function testStoreSuccessfully()
    {
        $payload = json_encode([
            "title" => "New Post",
            "content" => "Content",
            "category" => "Tech",
            "tags" => ["tag1"]
        ]);

        $controller = $this->createControllerWithPayload($payload);
        
        $this->repositoryMock->expects($this->once())->method('store')->willReturn(["id" => 2, "data" => $payload]);

        ob_start();
        $controller->store();
        $output = ob_get_clean();

        $this->assertEquals(201, http_response_code());
        $this->assertStringContainsString('"id":2', $output);
    }

    public function testStoreFailsWithMissingFields()
    {
        $payload = json_encode([
            "title" => "New Post" // Missing content, category, tags
        ]);

        $controller = $this->createControllerWithPayload($payload);
        
        // Assert that the repository is never called if validation fails
        $this->repositoryMock->expects($this->never())->method('store');

        ob_start();
        $controller->store();
        $output = ob_get_clean();

        $this->assertEquals(400, http_response_code());
        $this->assertStringContainsString("blog post should have title, content, category, and tags fields", $output);
    }

    public function testUpdateSuccessfully()
    {
        $payload = json_encode([
            "title" => "Updated Post",
            "content" => "Updated Content",
            "category" => "Tech",
            "tags" => ["tag2"]
        ]);

        $controller = $this->createControllerWithPayload($payload);
        
        $this->repositoryMock->expects($this->once())->method('update')->with(json_decode($payload, true), 1)->willReturn(["id" => 1, "data" => $payload]);

        ob_start();
        $controller->update(1);
        $output = ob_get_clean();

        $this->assertEquals(200, http_response_code());
        $this->assertStringContainsString("Updated Post", $output);
    }

    public function testUpdateReturns404WhenNotFound()
    {
        $payload = json_encode([
            "title" => "Updated Post",
            "content" => "Updated Content",
            "category" => "Tech",
            "tags" => ["tag2"]
        ]);

        $controller = $this->createControllerWithPayload($payload);
        
        $this->repositoryMock->expects($this->once())->method('update')->with(json_decode($payload, true), 99)->willReturn(null);

        ob_start();
        $controller->update(99);
        $output = ob_get_clean();

        $this->assertEquals(404, http_response_code());
        $this->assertStringContainsString("Post with id 99 not found", $output);
    }

    public function testDestroySuccessfully()
    {
        $this->repositoryMock->expects($this->once())->method('destroy')->with(1)->willReturn(true);

        ob_start();
        $this->controller->destroy(1);
        $output = ob_get_clean();

        $this->assertEquals(204, http_response_code());
    }

    public function testDestroyReturns404WhenNotFound()
    {
        $this->repositoryMock->expects($this->once())->method('destroy')->with(99)->willReturn(false);

        ob_start();
        $this->controller->destroy(99);
        $output = ob_get_clean();

        $this->assertEquals(404, http_response_code());
        $this->assertStringContainsString("Post with id 99 not found", $output);
    }
}
