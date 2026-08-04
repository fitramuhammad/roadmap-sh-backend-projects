<?php

namespace Blog\Models;

use Blog\Config\Database;
use PDO;

class Post
{
  public int $id;
  public string $title;
  public string $content;
  public string $category;
  public array $tags;
  public string $created_at;
  public string $updated_at;

  public function __construct(array $post)
  {
    $data = json_decode($post["data"]);

    $this->id = $post["id"];
    $this->title = $data->title;
    $this->content = $data->content;
    $this->category = $data->category;
    $this->tags = $data->tags;
    $this->created_at = $post["created_at"];
    $this->updated_at = $post["updated_at"];
  }

  public static function collection()
  {
    $posts = self::query("SELECT * FROM blog")->fetchAll(PDO::FETCH_ASSOC);

    if ($posts) {
      return array_map(fn($item) => new Post($item), $posts);
    }
  }

  private static function query(string $query, $params = null)
  {
    $db = new Database()->connect();
    $stmt = $db->prepare($query);
    $stmt->execute($params);

    return $stmt;
  }

  public static function getById(int $id)
  {
    $post = self::query("SELECT * FROM blog WHERE id = :id", ["id" => $id])->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
      return null;
    }

    return new Post($post);
  }

  public static function update(string $data, int $id)
  {
    $post = self::getById($id);

    if (!$post) {
      return null;
    }

    $post = self::query("UPDATE blog SET data = :data, updated_at = CURRENT_TIMESTAMP WHERE id = :id RETURNING *", [
      "data" => $data,
      "id" => $id
    ])->fetch(PDO::FETCH_ASSOC);

    return $post;
  }

  public static function store(array $post)
  {
    $res = self::query("INSERT INTO blog(data) VALUES(:post) RETURNING *", ["post" => json_encode($post)])->fetch(PDO::FETCH_ASSOC);

    if (!$res) {
      return null;
    }

    return $res;
  }

  public static function destroy(int $id)
  {
    $post = self::getById($id);

    if (!$post) {
      return false;
    }

    self::query("DELETE FROM blog WHERE id = :id", ["id" => $id]);
    return true;
  }
}
