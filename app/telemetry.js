const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-proto');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318';
const metricsExporter = new OTLPMetricExporter({ url: `${endpoint}/v1/metrics` });
const traceExporter = new OTLPTraceExporter({ url: `${endpoint}/v1/traces` });

const sdk = new NodeSDK({
  metricReader: metricsExporter,
  traceExporter,
  instrumentations: [new HttpInstrumentation()],
});

sdk.start();

const shutdown = () => sdk.shutdown().catch((err) => {
  console.error(JSON.stringify({ level: 'error', event: 'otel-shutdown-failed', error: String(err) }));
});
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
