<?php

namespace App\Controllers;

use App\Models\Expense;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ExpenseController
{
  public function index(Request $request, Response $response): Response
  {
    $userId = (int) $request->getAttribute('userId');
    $params = $request->getQueryParams();

    $filter    = $params['filter']     ?? null;
    $startDate = $params['start_date'] ?? null;
    $endDate   = $params['end_date']   ?? null;

    $validFilters = ['past_week', 'past_month', 'last_3_months', 'custom'];

    if ($filter !== null && !in_array($filter, $validFilters, true)) {
      return $this->json($response, [
        'errors' => ['message' => 'Invalid filter. Valid options: ' . implode(', ', $validFilters) . '.']
      ], 422);
    }

    if ($filter === 'custom' && (!$startDate || !$endDate)) {
      return $this->json($response, [
        'errors' => ['message' => 'start_date and end_date are required for the custom filter.']
      ], 422);
    }

    $expenses = Expense::allForUser($userId, $filter, $startDate, $endDate);

    return $this->json($response, ['data' => $expenses]);
  }

  public function store(Request $request, Response $response): Response
  {
    $userId = (int) $request->getAttribute('userId');
    $body   = (array) $request->getParsedBody();

    $title    = trim($body['title']    ?? '');
    $amount   = $body['amount']        ?? null;
    $category = $body['category']      ?? '';
    $date     = $body['date']          ?? '';

    if ($title === '' || $amount === null || $category === '' || $date === '') {
      return $this->json($response, [
        'errors' => ['message' => 'title, amount, category, and date are required.']
      ], 400);
    }

    if (!is_numeric($amount) || (float) $amount <= 0) {
      return $this->json($response, [
        'errors' => ['message' => 'amount must be a positive number.']
      ], 422);
    }

    if (!in_array($category, Expense::VALID_CATEGORIES, true)) {
      return $this->json($response, [
        'errors' => ['message' => 'Invalid category. Valid options: ' . implode(', ', Expense::VALID_CATEGORIES) . '.']
      ], 422);
    }

    if (!\DateTimeImmutable::createFromFormat('Y-m-d', $date)) {
      return $this->json($response, [
        'errors' => ['message' => 'Invalid date format. Use YYYY-MM-DD.']
      ], 422);
    }

    $expense = Expense::create($userId, $title, (float) $amount, $category, $date);

    return $this->json($response, ['data' => $expense->toArray()], 201);
  }

  public function update(Request $request, Response $response, array $args): Response
  {
    $userId = (int) $request->getAttribute('userId');
    $id     = (int) $args['id'];
    $body   = (array) $request->getParsedBody();

    if (isset($body['amount']) && (!is_numeric($body['amount']) || (float) $body['amount'] <= 0)) {
      return $this->json($response, [
        'errors' => ['message' => 'amount must be a positive number.']
      ], 422);
    }

    if (isset($body['category']) && !in_array($body['category'], Expense::VALID_CATEGORIES, true)) {
      return $this->json($response, [
        'errors' => ['message' => 'Invalid category. Valid options: ' . implode(', ', Expense::VALID_CATEGORIES) . '.']
      ], 422);
    }

    if (isset($body['date']) && !\DateTimeImmutable::createFromFormat('Y-m-d', $body['date'])) {
      return $this->json($response, [
        'errors' => ['message' => 'Invalid date format. Use YYYY-MM-DD.']
      ], 422);
    }

    $expense = Expense::update($id, $userId, $body);

    if (!$expense) {
      return $this->json($response, ['errors' => ['message' => 'Expense not found.']], 404);
    }

    return $this->json($response, ['data' => $expense->toArray()]);
  }

  public function destroy(Request $request, Response $response, array $args): Response
  {
    $userId = (int) $request->getAttribute('userId');
    $id     = (int) $args['id'];

    $deleted = Expense::delete($id, $userId);

    if (!$deleted) {
      return $this->json($response, ['errors' => ['message' => 'Expense not found.']], 404);
    }

    return $response->withStatus(204);
  }

  private function json(Response $response, array $data, int $status = 200): Response
  {
    $response->getBody()->write(json_encode($data, JSON_THROW_ON_ERROR));
    return $response->withStatus($status)->withHeader('Content-Type', 'application/json');
  }
}
