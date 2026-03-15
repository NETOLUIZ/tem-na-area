<?php

declare(strict_types=1);

function jsonInput(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function jsonResponse(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function required(array $data, array $fields): array
{
    $missing = [];

    foreach ($fields as $field) {
        if (!array_key_exists($field, $data) || $data[$field] === null || $data[$field] === '') {
            $missing[] = $field;
        }
    }

    return $missing;
}

function verifyPassword(string $plainPassword, string $storedHash): bool
{
    if ($storedHash === '') {
        return false;
    }

    if (strlen($storedHash) === 64 && ctype_xdigit($storedHash)) {
        return hash('sha256', $plainPassword) === strtolower($storedHash);
    }

    return password_verify($plainPassword, $storedHash);
}

function fetchStoreBySlug(PDO $pdo, string $slug): ?array
{
    $sql = "
        SELECT
            l.id,
            l.nome,
            l.slug,
            l.descricao_curta,
            l.whatsapp,
            l.categoria_principal,
            l.modo_operacao,
            l.status_loja,
            l.logo_url,
            l.capa_url,
            l.horario_funcionamento,
            c.taxa_entrega_padrao,
            c.pedido_minimo,
            c.tempo_medio_preparo_minutos
        FROM lojas l
        LEFT JOIN configuracoes_loja c ON c.loja_id = l.id
        WHERE l.slug = :slug
        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['slug' => $slug]);
    $store = $stmt->fetch();

    return $store ?: null;
}
