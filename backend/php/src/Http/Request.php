<?php

declare(strict_types=1);

namespace App\Http;

use App\Support\Json;

final class Request
{
    private ?array $json = null;

    public function __construct(
        private readonly string $method,
        private readonly string $path,
        private readonly array $query,
        private readonly array $headers,
        private readonly string $body
    ) {
    }

    public static function capture(): self
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        $headers = function_exists('getallheaders') ? (getallheaders() ?: []) : [];

        return new self(
            $method,
            $path,
            $_GET,
            array_change_key_case($headers, CASE_LOWER),
            (string) file_get_contents('php://input')
        );
    }

    public function method(): string
    {
        return $this->method;
    }

    public function path(): string
    {
        return $this->path;
    }

    public function query(string $key, mixed $default = null): mixed
    {
        return $this->query[$key] ?? $default;
    }

    public function input(): array
    {
        if ($this->json === null) {
            $this->json = Json::decode($this->body);
        }

        return $this->json;
    }

    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }
}
