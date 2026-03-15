<?php

return [
    'db_host' => getenv('TEM_NA_AREA_DB_HOST') ?: '127.0.0.1',
    'db_port' => getenv('TEM_NA_AREA_DB_PORT') ?: '3306',
    'db_name' => getenv('TEM_NA_AREA_DB_NAME') ?: 'tem_na_area',
    'db_user' => getenv('TEM_NA_AREA_DB_USER') ?: 'root',
    'db_pass' => getenv('TEM_NA_AREA_DB_PASS') ?: '',
    'app_env' => getenv('TEM_NA_AREA_APP_ENV') ?: 'local',
    'app_url' => getenv('TEM_NA_AREA_APP_URL') ?: 'http://localhost:8000',
    'app_key' => getenv('TEM_NA_AREA_APP_KEY') ?: 'tem-na-area-local-key-change-me',
];
