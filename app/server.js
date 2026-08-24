const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { metrics, trace } = require('@opentelemetry/api');

const serviceName = process.env.OTEL_SERVICE_NAME || 'demo-api';
const logDir = '/var/log/app';
const logFile = path.join(logDir, 'app.log');
fs.mkdirSync(logDir, { recursive: true });

function log(level, fields = {}) {
  const entry = { timestamp: new Date().toISOString(), level, service: serviceName, ...fields };
  fs.appendFileSync(logFile, `${JSON.stringify(entry)}\n`);
  console.log(JSON.stringify(entry));
}

const tracer = trace.getTracer(serviceName);
const meter = metrics.getMeter(serviceName);
const requests = meter.createCounter('http_server_requests_total', { description: 'HTTP requests handled' });
const latency = meter.createHistogram('http_server_duration_ms', { description: 'HTTP request duration in milliseconds', unit: 'ms' });

const server = http.createServer((req, res) => {
  const start = process.hrtime.bigint();
  const route = req.url || '/';
  const span = tracer.startSpan('http.request');
  span.setAttribute('http.request.method', req.method);
  span.setAttribute('url.path', route);

  function finish(status) {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    requests.add(1, { method: req.method, route, status: String(status), service_name: serviceName });
    latency.record(durationMs, { method: req.method, route, service_name: serviceName });
    span.setAttribute('http.response.status_code', status);
    span.end();
    log(status >= 500 ? 'error' : 'info', { event: 'http_request', method: req.method, route, status, duration_ms: Number(durationMs.toFixed(2)) });
  }

  if (route === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: serviceName }));
    finish(200); return;
  }

  if (route === '/fail') {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'simulated failure' }));
    finish(500); return;
  }

  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ service: serviceName, message: 'hello from observable service' }));
  finish(200);
});

const port = Number(process.env.PORT || 8080);
server.listen(port, '0.0.0.0', () => log('info', { event: 'started', port }));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
