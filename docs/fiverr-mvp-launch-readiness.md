# Contractual MVP Launch Readiness (Security, Performance, SLA)

## 1) Security Requirements Checklist

## Authentication and Session Security
- [ ] Passwords hashed with bcrypt/argon2 (cost tuned for server capacity).
- [ ] Access token short TTL, refresh token rotation and revocation enabled.
- [ ] Session invalidation supported on password reset and forced logout.
- [ ] Login/register/reset endpoints rate-limited and abuse monitored.
- [ ] Account lockout strategy with safe recovery path.

## Authorization and Access Control
- [ ] RBAC implemented for buyer/seller/admin.
- [ ] Ownership checks enforced on order, gig, conversation, and payout endpoints.
- [ ] Admin endpoints locked behind explicit role checks and audit logging.
- [ ] IDOR tests included for all resource-by-id endpoints.

## Input/Output Protection
- [ ] Server-side schema validation on all writes.
- [ ] Output encoding/sanitization for user-generated text.
- [ ] File upload validation (size, mime, magic bytes).
- [ ] Signed URL pattern or protected file proxy for sensitive assets.

## API Security and Hardening
- [ ] HTTPS-only in production.
- [ ] Secure headers configured (`helmet`, CSP, HSTS, Referrer-Policy).
- [ ] CORS allowlist set to production frontends only.
- [ ] Error responses do not leak stack traces or secrets.
- [ ] Request logging redacts auth tokens and PII.

## Data and Secret Management
- [ ] Secrets stored in platform secret manager, not repository.
- [ ] DB credentials rotated before launch and quarterly afterward.
- [ ] Principle of least privilege for DB user and third-party keys.
- [ ] Backup encryption and retention policy documented.

## Payments and Fraud
- [ ] Webhook signatures verified.
- [ ] Event deduplication and idempotent payment handlers.
- [ ] Amount integrity checks between order and payment intent.
- [ ] Risk flags for unusual order velocity or suspicious account behavior.

## Compliance and Privacy
- [ ] Privacy policy and Terms links live in app.
- [ ] Data retention/deletion process documented.
- [ ] User export/deletion support path defined for support team.

## 2) Performance and Capacity Requirements

## SLO Targets
- Read endpoint p95 < 300 ms.
- Write endpoint p95 < 500 ms (excluding upstream payment latency).
- Error rate < 1% (5xx) over rolling 1 hour.
- Availability target: 99.9% monthly.

## Load Targets (MVP Baseline)
- Concurrent active users: 200-300.
- Registered users: up to 20,000.
- Peak order creation burst: 20 requests/minute.
- Peak messaging throughput: 100 messages/minute platform-wide.

## Backend Performance Controls
- [ ] PostgreSQL indexes aligned to list/search/order/message queries.
- [ ] Query timeout and statement timeout configured.
- [ ] Connection pool bounds tuned for instance size.
- [ ] Compression enabled for JSON responses.
- [ ] Cursor pagination used for large list endpoints.
- [ ] N+1 query checks completed on order/gig/profile pages.

## Frontend Performance Controls
- [ ] Route-based code splitting.
- [ ] Request waterfall elimination in key pages.
- [ ] API caching strategy for frequent reads.
- [ ] Image optimization and lazy loading.
- [ ] Duplicate API call suppression in auth and order flows.

## 3) Reliability and Operations

## Deployment and Release
- [ ] CI pipeline runs lint, unit tests, integration tests, build.
- [ ] Migrations run automatically in controlled pre-start hook.
- [ ] Blue/green or rolling deployment with health checks.
- [ ] Rollback procedure documented and tested.

## Backups and Disaster Recovery
- [ ] Daily full backups and PITR configured.
- [ ] Backup restore drill completed in staging.
- [ ] Recovery Point Objective (RPO): <= 15 minutes.
- [ ] Recovery Time Objective (RTO): <= 1 hour.

## Monitoring and Alerting
- [ ] API latency dashboards by route and status code.
- [ ] DB dashboards: connections, locks, slow queries, CPU, memory.
- [ ] Alerts for 5xx spikes, webhook failures, payment failure rate.
- [ ] On-call escalation tree and incident severity matrix defined.

## 4) Quality Gates Before Production

## Functional
- [ ] Complete buyer journey test pass (signup -> order -> review).
- [ ] Complete seller journey test pass (signup -> gig -> deliver -> complete).
- [ ] Complete admin dispute journey pass.

## Security
- [ ] OWASP top risks reviewed and mitigated for MVP routes.
- [ ] Dependency vulnerability scan clean for critical/high issues.
- [ ] Pen-test style checklist executed for auth/order/payment endpoints.

## Data Integrity
- [ ] FK/check constraints validated by migration test.
- [ ] Idempotency conflict scenarios tested.
- [ ] Payment webhook replay tests passed.

## Performance
- [ ] Load test confirms SLO at expected concurrency.
- [ ] No critical slow queries (>1s) in baseline workload.
- [ ] Hot endpoints verified with caching/index strategy.

## 5) Incident Response Playbooks

## Incident A: Login Failure Spike
1. Check auth endpoint error rates and logs by code.
2. Validate token secret/config and DB connectivity.
3. Inspect rate-limiter misconfiguration or abuse pattern.
4. Rollback to last known stable release if regression confirmed.

## Incident B: Payment Capture Failing
1. Verify payment provider status and webhook delivery health.
2. Confirm signature validation and event processor state.
3. Queue retries for transient failures.
4. Trigger support workflow for impacted orders.

## Incident C: High DB Latency
1. Inspect active queries and lock waits.
2. Identify regressions from recent deployments.
3. Apply fallback throttling on expensive endpoints.
4. Scale DB/service tier if sustained saturation observed.

## 6) SLA/SLO Communication Template

Service commitments (example)
- API uptime: 99.9% monthly.
- Priority incident response:
  - P1: acknowledge <= 15 min
  - P2: acknowledge <= 1 hour
- Planned maintenance notices: >= 24 hours in advance.

## 7) Launch Approval Sign-off Matrix

- Product Owner: scope and acceptance criteria approved.
- Engineering Lead: architecture, code quality, and release safety approved.
- Security Owner: controls and risk acceptance approved.
- Ops Owner: monitoring, backups, and incident readiness approved.
- Support Owner: macros/runbooks and escalation paths approved.

