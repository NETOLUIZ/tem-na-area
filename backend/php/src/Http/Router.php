<?php

declare(strict_types=1);

namespace App\Http;

use App\Support\ApiException;
use Throwable;

final class Router
{
    /** @var array<int, array{method:string, pattern:string, handler:callable}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $pattern,
            'handler' => $handler,
        ];
    }

    public function dispatch(Request $request): void
    {
        try {
            foreach ($this->routes as $route) {
                if ($route['method'] !== $request->method()) {
                    continue;
                }

                $params = $this->match($route['pattern'], $request->path());
                if ($params === null) {
                    continue;
                }

                $result = $route['handler']($request, $params);
                if (is_array($result)) {
                    Response::ok($result);
                }

                return;
            }

            throw new ApiException('Rota nao encontrada.', 404);
        } catch (ApiException $e) {
            Response::error($e->getMessage(), $e->statusCode(), $e->details());
        } catch (Throwable $e) {
            Response::error('Erro interno no servidor.', 500, ['exception' => $e->getMessage()]);
        }
    }

    private function match(string $pattern, string $path): ?array
    {
        $regex = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '(?P<$1>[^/]+)', $pattern);
        $regex = '#^' . $regex . '$#';

        if (!preg_match($regex, $path, $matches)) {
            return null;
        }

        $params = [];
        foreach ($matches as $key => $value) {
            if (!is_int($key)) {
                $params[$key] = $value;
            }
        }

        return $params;
    }
}
