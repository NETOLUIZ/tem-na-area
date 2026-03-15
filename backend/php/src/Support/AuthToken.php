<?php

declare(strict_types=1);

namespace App\Support;

final class AuthToken
{
    public function __construct(private readonly string $secret)
    {
    }

    public function encode(array $payload): string
    {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $segments = [
            $this->base64UrlEncode(Json::encode($header)),
            $this->base64UrlEncode(Json::encode($payload)),
        ];

        $signature = hash_hmac('sha256', implode('.', $segments), $this->secret, true);
        $segments[] = $this->base64UrlEncode($signature);

        return implode('.', $segments);
    }

    public function decode(string $token): array
    {
        $segments = explode('.', $token);
        if (count($segments) !== 3) {
            throw new ApiException('Token invalido.', 401);
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $segments;
        $signature = $this->base64UrlDecode($encodedSignature);
        $expected = hash_hmac('sha256', $encodedHeader . '.' . $encodedPayload, $this->secret, true);

        if (!hash_equals($expected, $signature)) {
            throw new ApiException('Assinatura do token invalida.', 401);
        }

        $payload = Json::decode($this->base64UrlDecode($encodedPayload));
        if (($payload['exp'] ?? 0) < time()) {
            throw new ApiException('Token expirado.', 401);
        }

        return $payload;
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        $padding = strlen($value) % 4;
        if ($padding > 0) {
            $value .= str_repeat('=', 4 - $padding);
        }

        return (string) base64_decode(strtr($value, '-_', '+/'), true);
    }
}
