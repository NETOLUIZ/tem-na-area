<?php

declare(strict_types=1);

namespace App\Support;

final class Str
{
    public static function slug(string $value): string
    {
        $normalized = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;
        $normalized = strtolower($normalized);
        $normalized = preg_replace('/[^a-z0-9]+/', '-', $normalized) ?? '';

        return trim($normalized, '-');
    }

    public static function uuid(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);

        $hex = bin2hex($bytes);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split($hex, 4));
    }

    public static function protocol(string $prefix = 'SOL'): string
    {
        return sprintf('%s-%s-%04d', $prefix, date('YmdHis'), random_int(1, 9999));
    }

    public static function orderCode(int $storeSequence): string
    {
        return sprintf('PED-%s-%04d', date('YmdHis'), $storeSequence);
    }
}
