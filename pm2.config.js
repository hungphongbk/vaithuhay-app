module.exports = {
  apps: [
    {
      name: 'vaithuhay',
      script: 'bin/www',

      // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
      // node_args: '--inspect=0.0.0.0:9229',
      node_args: '',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '700M',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8090
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8090
      }
    }
  ]
}
