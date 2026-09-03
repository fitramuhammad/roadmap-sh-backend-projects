<?php

namespace App\Models;

use App\Config\Database;
use DateTimeImmutable;

class Expense
{
    public const VALID_CATEGORIES = ['Groceries', 'Leisure', 'Electronics', 'Utilities', 'Clothing', 'Health', 'Others'];

    private function __construct(
        private readonly int $id,
        private readonly int $userId,
        private readonly string $title,
        private readonly float $amount,
        private readonly string $category,
        private readonly string $date,
        private readonly DateTimeImmutable $createdAt,
        private readonly DateTimeImmutable $updatedAt
    ) {}

    public static function allForUser(
        int $userId,
        ?string $filter = null,
        ?string $startDate = null,
        ?string $endDate = null
    ): array {
        $params = [$userId];
        $dateCondition = '';

        switch ($filter) {
            case 'past_week':
                $dateCondition = "AND date >= CURRENT_DATE - INTERVAL '7 days'";
                break;
            case 'past_month':
                $dateCondition = "AND date >= CURRENT_DATE - INTERVAL '1 month'";
                break;
            case 'last_3_months':
                $dateCondition = "AND date >= CURRENT_DATE - INTERVAL '3 months'";
                break;
            case 'custom':
                $dateCondition = "AND date BETWEEN ? AND ?";
                $params[] = $startDate;
                $params[] = $endDate;
                break;
        }

        $stmt = Database::connect()->prepare(
            "SELECT id, user_id, title, amount, category, date, created_at, updated_at
             FROM expenses WHERE user_id = ? $dateCondition ORDER BY date DESC"
        );
        $stmt->execute($params);

        return array_map(fn(array $row) => self::fromRow($row)->toArray(), $stmt->fetchAll());
    }

    public static function findById(int $id, int $userId): ?self
    {
        $stmt = Database::connect()->prepare(
            'SELECT id, user_id, title, amount, category, date, created_at, updated_at
             FROM expenses WHERE id = ? AND user_id = ? LIMIT 1'
        );
        $stmt->execute([$id, $userId]);
        $row = $stmt->fetch();

        return $row ? self::fromRow($row) : null;
    }

    public static function create(int $userId, string $title, float $amount, string $category, string $date): self
    {
        $pdo = Database::connect();
        $now = new DateTimeImmutable();

        $stmt = $pdo->prepare(
            'INSERT INTO expenses(user_id, title, amount, category, date, created_at, updated_at)
             VALUES(?, ?, ?, ?, ?, ?, ?) RETURNING id'
        );
        $stmt->execute([
            $userId,
            $title,
            $amount,
            $category,
            $date,
            $now->format('Y-m-d H:i:s'),
            $now->format('Y-m-d H:i:s'),
        ]);

        $row = $stmt->fetch();
        return new self((int) $row['id'], $userId, $title, $amount, $category, $date, $now, $now);
    }

    public static function update(int $id, int $userId, array $data): ?self
    {
        $expense = self::findById($id, $userId);
        if (!$expense) {
            return null;
        }

        $now      = new DateTimeImmutable();
        $title    = $data['title']    ?? $expense->title;
        $amount   = isset($data['amount']) ? (float) $data['amount'] : $expense->amount;
        $category = $data['category'] ?? $expense->category;
        $date     = $data['date']     ?? $expense->date;

        Database::connect()->prepare(
            'UPDATE expenses SET title = ?, amount = ?, category = ?, date = ?, updated_at = ?
             WHERE id = ? AND user_id = ?'
        )->execute([
            $title,
            $amount,
            $category,
            $date,
            $now->format('Y-m-d H:i:s'),
            $id,
            $userId,
        ]);

        return new self($id, $userId, $title, $amount, $category, $date, $expense->createdAt, $now);
    }

    public static function delete(int $id, int $userId): bool
    {
        $stmt = Database::connect()->prepare(
            'DELETE FROM expenses WHERE id = ? AND user_id = ?'
        );
        $stmt->execute([$id, $userId]);

        return $stmt->rowCount() > 0;
    }

    public function toArray(): array
    {
        return [
            'id'         => $this->id,
            'user_id'    => $this->userId,
            'title'      => $this->title,
            'amount'     => $this->amount,
            'category'   => $this->category,
            'date'       => $this->date,
            'created_at' => $this->createdAt->format(DATE_ATOM),
            'updated_at' => $this->updatedAt->format(DATE_ATOM),
        ];
    }

    private static function fromRow(array $row): self
    {
        return new self(
            (int) $row['id'],
            (int) $row['user_id'],
            $row['title'],
            (float) $row['amount'],
            $row['category'],
            $row['date'],
            new DateTimeImmutable($row['created_at'] ?? 'now'),
            new DateTimeImmutable($row['updated_at'] ?? 'now')
        );
    }
}
