<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$name    = $input['name'] ?? 'No Name';
$email   = $input['email'] ?? 'noemail@example.com';
$phone   = $input['phone'] ?? '0000000000';
$message = $input['message'] ?? 'No message provided.';
$source  = strtolower($input['source'] ?? '');

$srdMapping = [
    'google'   => '681f3b702f31c6cab4052781',
    'meta'     => '681f3ba658f1e7d0d3b60c51',
    'whatsapp' => '681f3c225d8defeb562657a6',
    'facebook' => '681f3c3fe11487f4e213b76f'
];

$srd = $srdMapping[$source] ?? '';

$apiKey = '76905a73cecd61beb26eea52197bdb67';

// 1️⃣ Trigger API Lead
function trigger_selldo_lead($name, $email, $phone, $message, $srd, $apiKey, $source) {
    $leaddata = [
        "sell_do" => [
            "analytics" => [
                "utm_content" => '',
                "utm_term" => '',
                "utm_source" => $source
            ],
            "campaign" => [
                "srd" => $srd,
                "sub_source" => "Proton3"
            ],
            "form" => [
                "requirement" => [
                    "property_type" => "flat"
                ],
                "custom" => [],
                "note" => [
                    "content" => $message
                ],
                "lead" => [
                    "name" => $name,
                    "phone" => $phone,
                    "email" => $email,
                    "tag" => "organic, shalimar marbella landing page, Proton3"
                ]
            ]
        ],
        "api_key" => $apiKey
    ];

    $ch = curl_init('https://app.sell.do/api/leads/create.json');
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($leaddata));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $response = curl_exec($ch);
    curl_close($ch);

    file_put_contents('selldo_log.txt', date('Y-m-d H:i:s') . " - " . $response . PHP_EOL, FILE_APPEND);

    return $response;
}

// 2️⃣ Send Email Notification
function send_lead_email($name, $email, $phone, $message, $source) {
    $to      = "marketing@proton3.com";  // ← Your Gmail address
    $subject = "New Lead from Your Website";

    $body    = "
    <h2>New Lead Submission</h2>
    <p><strong>Name:</strong> {$name}</p>
    <p><strong>Email:</strong> {$email}</p>
    <p><strong>Phone:</strong> {$phone}</p>
    <p><strong>Source:</strong> {$source}</p>
    <p><strong>Message:</strong><br>{$message}</p>
    ";

    $headers = "From: no-reply@proton3.com\r\n";
    $headers .= "Reply-To: {$email}\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

    mail($to, $subject, $body, $headers);
}

// Trigger both API and Email
$api_response = trigger_selldo_lead($name, $email, $phone, $message, $srd, $apiKey, $source);
send_lead_email($name, $email, $phone, $message, $source);

echo $api_response;
?>
