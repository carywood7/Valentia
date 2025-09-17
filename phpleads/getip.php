<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
function getUserIP() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $iplist = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($iplist[0]);
    } else {
        return $_SERVER['REMOTE_ADDR'];
    }
}
echo json_encode(['ip' => getUserIP()]);
exit;
?>
