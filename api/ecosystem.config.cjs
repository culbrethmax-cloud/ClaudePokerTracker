// pm2 ecosystem config for MaxVariance API
// Usage:
//   pm2 start ecosystem.config.cjs
//   pm2 stop maxvariance-api
//   pm2 restart maxvariance-api
//   pm2 logs maxvariance-api
//   pm2 save  (persist across reboots)
//   pm2 startup  (auto-start on boot)

module.exports = {
  apps: [{
    name: 'maxvariance-api',
    script: 'index.js',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    // Restart on crash
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    // Watch for changes (disable in production if preferred)
    watch: false,
    // Log files
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    // Memory limit — restart if exceeded
    max_memory_restart: '200M'
  }]
};
