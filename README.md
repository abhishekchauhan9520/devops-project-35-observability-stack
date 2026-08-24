# Project 35 — Full Observability Stack

A reproducible local observability platform demonstrating the three pillars together: **metrics, logs, and traces**.

## Architecture

```text
Demo API
  ├─ OTLP metrics ─┐
  ├─ OTLP traces ──┼──> OpenTelemetry Collector ──> Prometheus ──> Grafana
  └─ structured log ┘                 ├───────────> Loki ───────> Grafana
                                      └───────────> Tempo ───────> Grafana
```

The Collector is the telemetry gateway. Application logs are written as JSON to a shared volume, tailed by the Collector, and exported to Loki. Metrics and traces use OTLP.

## Services

- Demo API: `http://localhost:8080`
- Grafana: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- Loki: `http://localhost:3100`
- Tempo: `http://localhost:3200`

Grafana is provisioned with Prometheus, Loki, and Tempo datasources plus a starter dashboard.

## Run

```bash
docker compose up -d --build
curl http://localhost:8080/health
curl http://localhost:8080/
curl -i http://localhost:8080/fail
```

Generate traffic for dashboards and alerts, then inspect the three signals in Grafana.

## Why this is production-relevant

The project demonstrates telemetry collection as infrastructure, persistent storage/retention, centralized routing through OpenTelemetry Collector, alerting rules, and cross-signal investigation rather than a standalone dashboard.

## Limitations

This repository is a lab. Authentication, multi-tenant isolation, external durable object storage, TLS, and HA are intentionally left as next-stage production hardening.
