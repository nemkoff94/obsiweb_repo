<?php
declare(strict_types=1);

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, string $message): void
{
    http_response_code($status);
    echo json_encode(['message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, 'Метод не поддерживается.');
}

$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') {
    respond(415, 'Ожидается JSON.');
}

$body = file_get_contents('php://input', false, null, 0, 32769);
if ($body === false || strlen($body) > 32768) {
    respond(413, 'Запрос слишком большой.');
}

$data = json_decode($body, true);
if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) {
    respond(400, 'Некорректный запрос.');
}

function validText($value, int $maxLength, bool $multiline = false): bool
{
    if (!is_string($value) || trim($value) === '' || !preg_match('//u', $value)) {
        return false;
    }

    $forbidden = $multiline ? '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/' : '/[\x00-\x1F\x7F]/';
    return !preg_match($forbidden, $value) && preg_match_all('/./us', $value) <= $maxLength;
}

$projectTypes = [
    'landing' => 'Лендинг',
    'corporate' => 'Корпоративный сайт',
    'store' => 'Интернет-магазин',
    'design' => 'Дизайн сайта',
    'development' => 'Разработка сайта',
    'other' => 'Другая задача',
];

if (!validText($data['name'] ?? null, 100)
    || !validText($data['contact'] ?? null, 200)
    || !is_string($data['projectType'] ?? null)
    || !isset($projectTypes[$data['projectType']])
    || !validText($data['message'] ?? null, 5000, true)
    || ($data['consent'] ?? null) !== true) {
    respond(422, 'Проверьте заполнение формы.');
}

$message = "Новая заявка с сайта\n\n"
    . "Имя: " . trim($data['name']) . "\n"
    . "Контакт: " . trim($data['contact']) . "\n"
    . "Тип проекта: " . $projectTypes[$data['projectType']] . "\n\n"
    . "Задача:\n" . trim($data['message']) . "\n\n"
    . "Согласие на обработку данных: получено.";

$headers = [
    'From: notify@obsiweb.ru',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
];
$subject = '=?UTF-8?B?' . base64_encode('Новая заявка с сайта Обсидиан') . '?=';

if (!function_exists('mail') || !mail(
    'ceo@obsidianweb.ru, vn210494@ya.ru',
    $subject,
    chunk_split(base64_encode($message)),
    implode("\r\n", $headers),
    '-fnotify@obsiweb.ru'
)) {
    error_log('Project form: mail transport rejected the message.');
    respond(500, 'Не удалось отправить заявку.');
}

respond(200, 'Заявка принята к отправке.');
