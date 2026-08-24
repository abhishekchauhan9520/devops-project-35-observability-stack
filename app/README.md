# Demo API

The service exposes `/health`, `/`, and `/fail` on port 8080. It emits structured JSON logs to `/var/log/app/app.log` for the OpenTelemetry Collector `filelog` receiver and exports metrics/traces over OTLP.
