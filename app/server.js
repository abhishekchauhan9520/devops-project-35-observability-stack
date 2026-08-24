const http = require('node:http');
const { metrics, trace } = require('@opentelemetry/api');

const serviceName = process.env.OTEL_SERVICE_NAME || 'demo-api';
const tracer = trace.getTracer(serviceName);
const meter = metrics.getMeter(serviceName);
const requests = meter.createCounter('http.server.requests', { description: 'HTTP requests handled by the demo service' });
const latency = meter.createHistogram('http.server.duration', { description: 'HTTP request duration in milliseconds', unit: 'ms' });

const server = http.createServer((req, res) => {
  const start = process.hrtime.bigint();
  const span = tracer.startSpan('http.request');
  span.setAttribute('http.request.method', req.method);
  span.setAttribute('url.path', req.url || '/');

  const finish = (status) => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    requests.add(1, { method: req.method, route: req.url || '/', status });
    latency.record(durationMs, { method: req.method, route: req.url || '/' });
    span.setAttribute('http.response.status_code', status);
    span.end();
  };

  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: serviceName }));
    finish(200);
    return;
  }

  if (req.url === '/fail') {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'simulated failure' }));
    finish(500);
    return;
  }

  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ service: serviceName, message: 'hello from observable service' }));
  finish(200);
});

const port = Number(process.env.PORT || 8080);
server.listen(port, '0.0.0.0', () => {
  console.log(JSON.stringify({ level: 'info', service: serviceName, event: 'started', port }));
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
