# Contractual Marketplace MVP PRD

## 1) Product Definition

### Product Name
Contractual

### Product Type
Two-sided service marketplace (buyer-seller platform) inspired by Fiverr.

### Product Vision
Enable businesses and individuals to discover, hire, collaborate with, and pay trusted freelancers end-to-end in a single secure platform.

### Problem Statement
Service hiring is fragmented across social apps, spreadsheets, and informal chats. This causes:
- poor trust and quality control,
- unclear scope and delivery expectations,
- payment disputes and delays,
- weak accountability and difficult dispute resolution.

Contractual solves this with structured gigs, transparent order workflows, escrow-like fund handling, messaging, delivery tracking, and reviews.

## 2) Goals, Non-Goals, and Scope

### Business Goals (MVP)
- GMV enablement through completed paid orders.
- Reliable onboarding of both buyers and sellers.
- High trust via identity, reviews, moderation, and dispute tooling.
- Fast iteration with clear KPI instrumentation.

### User Goals
- Buyer: quickly find the right freelancer and get quality delivery on time.
- Seller: consistently win work, deliver smoothly, and get paid predictably.
- Admin: maintain marketplace quality, safety, and policy compliance.

### Non-Goals (MVP)
- Real-time video calling.
- Native mobile apps (web-first only).
- Full multilingual localization.
- Advanced recommendation AI and dynamic pricing automation.

### MVP Scope
- Authentication and account management.
- Seller onboarding and gig publishing.
- Search, browse, and gig detail pages.
- Order lifecycle (create -> fund -> deliver -> accept/complete).
- Messaging per order.
- Revisions and delivery acceptance.
- Ratings and reviews.
- Notifications.
- Admin moderation and dispute workflow.

## 3) Personas and JTBD

### Persona A: Startup Buyer (Time-constrained Founder)
- Needs logo/design/content/dev tasks delivered quickly.
- Cares about trust signals, turnaround, price transparency, and low overhead.
- JTBD: "When launching a task, help me hire a vetted freelancer quickly and track delivery clearly."

### Persona B: Professional Seller (Freelancer)
- Needs steady order flow and low-friction delivery/payment.
- Cares about profile credibility, conversion, repeat clients, and payout reliability.
- JTBD: "When I publish a gig, help me get qualified leads and deliver without payment risk."

### Persona C: Marketplace Operations Admin
- Needs quality control and fraud prevention.
- Cares about abuse reporting, dispute handling, policy enforcement, and auditability.
- JTBD: "When incidents happen, help me investigate and resolve with full evidence trails."

## 4) Core User Journeys

### Buyer Journey
1. Sign up -> verify email -> create profile.
2. Search/browse gigs -> apply filters -> open gig details.
3. Choose package + requirements -> place order.
4. Fund order -> send files/details to seller.
5. Receive delivery -> request revision or accept.
6. Leave review -> optionally reorder.

### Seller Journey
1. Sign up -> complete seller profile.
2. Create gig with packages, FAQs, requirements, media.
3. Receive order and buyer requirements.
4. Communicate with buyer via order chat.
5. Submit delivery -> handle revision requests.
6. Mark complete after buyer acceptance -> payout initiated.

### Admin Journey
1. Monitor flagged content/orders/users.
2. Review abuse reports and evidence.
3. Take moderation action (warn, suspend, remove gig).
4. Resolve disputes (partial refund/full refund/order continuation).

## 5) Functional Requirements

## FR-1 Authentication and Identity
- Email/password registration and login.
- Refresh-token based session continuity.
- Password reset (OTP/email token).
- Role support: buyer, seller, admin.
- Secure logout for single session and all sessions.

Acceptance Criteria
- Invalid login attempts are rate-limited and logged.
- Password reset token is single-use and expires.
- Access tokens are short-lived; refresh workflow is validated server-side.

## FR-2 User Profile and Seller Onboarding
- Basic profile: name, avatar, headline, bio, country, languages.
- Seller profile: skills, portfolio links, hourly baseline, experience level.
- Verification flags (email verified now; identity verification as extensible field).

Acceptance Criteria
- Seller cannot publish gig without required seller profile fields.
- Profile updates are audited for critical changes (email, payout account reference).

## FR-3 Gig Publishing and Management
- Create/update/archive gig.
- Gig supports up to 3 packages (basic/standard/premium).
- Gig includes tags, category/subcategory, delivery time, revisions, FAQ, requirements.
- Media support (images; optional video field as URL placeholder in MVP).

Acceptance Criteria
- Package price and delivery constraints validated server-side.
- Archived gig cannot be newly ordered.
- Only owner seller can edit/manage gig.

## FR-4 Discovery and Search
- Browse categories and featured gigs.
- Search by keyword with filters (price range, delivery time, seller level, rating).
- Sort by relevance, newest, price, rating.

Acceptance Criteria
- Pagination/cursor support for high-volume listing.
- Filtered results return in p95 target under normal load.

## FR-5 Order Lifecycle
- Buyer chooses package and places order.
- Buyer submits required order brief.
- Payment authorization/capture via provider abstraction.
- Order statuses:
  - `pending_payment`
  - `in_progress`
  - `delivered`
  - `revision_requested`
  - `completed`
  - `cancelled`
  - `disputed`

Acceptance Criteria
- State transitions are validated with strict rules.
- Duplicate payment/order creation is idempotent.
- Buyer and seller can only access their own orders unless admin.

## FR-6 Messaging and Notifications
- Order-scoped conversation.
- Text + attachment metadata.
- Notification events for key transitions (new order, delivery, revision, message, dispute updates).

Acceptance Criteria
- Unauthorized user cannot read/send messages for unrelated orders.
- Unread counts and latest message previews are available efficiently.

## FR-7 Delivery, Revision, Completion, Reviews
- Seller submits delivery with notes + assets.
- Buyer can accept or request revision within policy window.
- After completion, buyer can rate/review seller.
- Seller can post review reply once.

Acceptance Criteria
- Review allowed only for completed orders and only once per order per buyer.
- Revision request count enforced against selected package limit.

## FR-8 Admin Moderation and Disputes
- Admin can suspend users, unpublish gigs, and resolve disputes.
- Dispute evidence timeline and action log retained.

Acceptance Criteria
- Every admin action stored in immutable audit log.
- Dispute state transitions are controlled and attributable to actor.

## 6) Detailed Acceptance Criteria (End-to-End)

### Auth
- Register -> verify email -> login -> refresh -> logout works across modern browsers.
- Brute force protection and lockout telemetry active.

### Seller Marketplace
- Seller publishes gig and gig becomes discoverable.
- Gig edits reflect in search index/listing within accepted freshness threshold.

### Buyer Ordering
- Buyer can complete checkout and see funded order.
- Seller sees order instantly and can communicate.
- Buyer accepts delivery and leaves review.

### Disputes
- Buyer or seller can open dispute when eligible.
- Admin can resolve and mark final settlement reason.

## 7) Edge Cases and Abuse Scenarios
- Duplicate account attempts using same email.
- Message spam / abusive content in chat.
- Seller attempts delivery without required files.
- Buyer requests revisions beyond package allowance.
- Payment webhook replay / duplicate callbacks.
- Account takeover attempts (credential stuffing).
- Fake review attempts (without completed order).

Mitigation
- Idempotency keys, strict authorization checks, rate limiting, audit logs, risk flags, and moderation queue.

## 8) Non-Functional Requirements

### Performance
- p95 read APIs < 300 ms (list/profile/detail under normal traffic).
- p95 write APIs < 500 ms (excluding external payment latency).
- DB query timeout and connection pool tuning enforced.

### Reliability
- Target uptime: 99.9% monthly.
- Graceful degradation when external providers fail (retry queue + alerts).
- Zero-downtime migrations for additive schema changes.

### Security
- OWASP-based controls:
  - Strong auth/session management.
  - Input validation and output encoding.
  - RBAC + ownership checks.
  - Secret management and rotation.
  - Rate limiting and abuse detection.
  - Audit trails for sensitive actions.

### Privacy and Compliance
- Data minimization for PII.
- User data export/deletion support (administrative process for MVP).
- Retention policy for logs/audit/events.

## 9) Analytics and KPI Framework

### North Star
Completed order value and completed orders/week.

### Funnel KPIs
- Visitor -> signup conversion.
- Buyer signup -> first order conversion.
- Seller signup -> first published gig conversion.
- Order success rate (completed / total created).
- Dispute rate.
- Repeat purchase rate.

### Operational KPIs
- p95 endpoint latency.
- Payment success/failure ratio.
- Moderation queue SLA compliance.

## 10) Launch Plan (MVP)

### Phase 1: Foundation
- Auth, profile, seller onboarding, gig CRUD, category system.

### Phase 2: Commerce Core
- Orders, payments abstraction, messaging, delivery/revision/completion.

### Phase 3: Trust and Control
- Reviews, notifications, dispute + admin tooling, observability hardening.

### Phase 4: Beta Rollout
- Closed beta with curated sellers and invited buyers.
- Monitor KPIs and incident metrics before general launch.

## 11) Risks and Mitigations
- Marketplace cold start -> curated supply seeding and category launch strategy.
- Payment/provider instability -> retries, idempotency, webhooks verification.
- Fraud/abuse growth -> moderation tooling + risk flags + stricter thresholds.
- Poor delivery quality -> review integrity + seller quality scoring.

## 12) Open Technical Extensions (Post-MVP)
- Recommendation ranking and personalized feeds.
- Subscription tiers and promoted gigs.
- Escrow milestone splitting for larger projects.
- Native mobile apps and push notification deep links.

