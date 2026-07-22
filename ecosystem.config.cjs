module.exports = {
  apps: [
    {
      name: "gdg-backend",
      script: "src/server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 8000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8000,
      },
      max_memory_restart: "300M",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 5000,
      max_restarts: 10,
      watch: false,
    },
  ],
};
