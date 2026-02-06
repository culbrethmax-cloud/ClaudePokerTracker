module.exports = {
  apps: [{
    name: 'maxvariance-api',
    script: 'index.js',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      FIREBASE_SERVICE_ACCOUNT_PATH: '/Users/maxculbreth/.config/firebase/service-account.json',
      FIREBASE_USER_ID: 'OGWpKcVDomaH1s60QeRrxyspD723',
      API_KEY: '9c5326df8d312ec42a12dc4b6d42253164f038a2cf0fa84b123b139da142c969'
    },
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    watch: false,
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_memory_restart: '200M'
  }]
};
