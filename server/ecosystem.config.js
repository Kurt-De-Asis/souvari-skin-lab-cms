module.exports = {
  apps: [
    {
      name: 'souvari-api',
      script: 'dist/server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '5s',
      time: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};