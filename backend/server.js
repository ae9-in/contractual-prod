const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { initRealtime } = require('./services/realtimeService');

const server = http.createServer(app);

initRealtime(server);

// Reuse TCP connections to reduce request handshake overhead on Render.
server.keepAliveTimeout = Number(process.env.KEEP_ALIVE_TIMEOUT_MS || 65000);
server.headersTimeout = Number(process.env.HEADERS_TIMEOUT_MS || 66000);

server.listen(env.port, () => {
  if (env.nodeEnv !== 'production') {
    console.log(`API running on port ${env.port}`);
  } else {
    console.log('Server started');
  }
});
