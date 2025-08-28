// PM2 Configuration for Affiliate Boss
module.exports = {
  apps: [
    {
      name: 'affiliate-boss',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=affiliate-boss-production --local --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};