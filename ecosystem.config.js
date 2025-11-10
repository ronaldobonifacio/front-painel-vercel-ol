module.exports = {
  apps: [
    {
      name: 'frontend-painel-de-ol-vercel',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 9004 -H 192.168.0.181',
      cwd: './',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
