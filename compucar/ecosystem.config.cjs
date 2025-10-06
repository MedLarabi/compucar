module.exports = {
  apps: [
    {
      name: 'compucar',
      script: 'node',
      args: '.next/standalone/server.js',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};


