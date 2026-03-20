module.exports = {
  apps: [
    {
      name: "temnaarea-api",
      cwd: "/var/www/temnaarea/api/backend/node",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      },
      error_file: "/var/log/temnaarea/api-error.log",
      out_file: "/var/log/temnaarea/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      max_memory_restart: "300M",
      autorestart: true,
      watch: false
    }
  ]
};
