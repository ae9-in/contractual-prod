# Contractual Marketplace MVP API Contract

## 1) API Conventions

### Base URL
- Production: `https://api.contractual.pro/v1`
- Staging: `https://staging-api.contractual.pro/v1`

### Transport
- JSON over HTTPS only.
- UTF-8 encoded payloads.

### Authentication
- Access token: JWT, short-lived (15 min recommended).
- Refresh token: opaque or JWT, long-lived (7-30 days), revocable.
- Header format: `Authorization: Bearer <token>`.

### Standard Headers
- `Content-Type: application/json`
- `X-Request-Id: <uuid>` (optional client-provided, generated if absent)
- `Idempotency-Key: <uuid>` (required for selected write endpoints)

### Time Format
- All timestamps are ISO 8601 UTC (`2026-03-27T07:35:00.000Z`).

### Money Format
- Decimal strings in JSON (example: `"125.00"`), currency as ISO 4217.

### Pagination
- Cursor pagination preferred for large lists:
  - Request: `?limit=20&cursor=<opaque>`
  - Response includes `pageInfo.nextCursor`.

### Error Envelope
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "One or more fields are invalid.",
    "details": {
      "email": "Invalid email format"
    }
  },
  "requestId": "8aa2696e-5f5b-4416-b5ad-12c3ff0f4199"
}
```

### Common Error Codes
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `VALIDATION_FAILED`
- `RATE_LIMITED`
- `PAYMENT_FAILED`
- `PRECONDITION_FAILED`
- `INTERNAL_ERROR`

## 2) Authorization Matrix

- `buyer`:
  - Can browse gigs, create orders, chat in own orders, review completed own orders.
- `seller`:
  - Can publish/manage own gigs, chat in own orders, deliver work, reply to reviews.
- `admin`:
  - Can moderate users/gigs and manage disputes.

Ownership Principle
- Any resource with `buyerId`/`sellerId`/`userId` must verify actor ownership unless admin.

## 3) Auth and Identity Endpoints

## POST `/auth/register`
Register account.

Request
```json
{
  "email": "alex@example.com",
  "password": "Test@1234",
  "role": "buyer"
}
```

Response `201`
```json
{
  "user": {
    "id": 101,
    "email": "alex@example.com",
    "role": "buyer",
    "status": "active",
    "emailVerified": false
  }
}
```

Validation
- Email unique, normalized lowercase.
- Password strength policy.
- Role one of buyer/seller.

Errors
- `409 CONFLICT` if account exists and idempotency policy is strict.
- `200/201` with existing account if idempotent register mode enabled.

## POST `/auth/login`
Authenticate and issue tokens.

Request
```json
{
  "email": "alex@example.com",
  "password": "Test@1234"
}
```

Response `200`
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<token>",
  "expiresIn": 900,
  "user": {
    "id": 101,
    "email": "alex@example.com",
    "role": "buyer"
  }
}
```

Errors
- `401 UNAUTHORIZED` invalid credentials.
- `429 RATE_LIMITED` too many attempts.

## POST `/auth/refresh`
Rotate access token using refresh token.

Request
```json
{
  "refreshToken": "<token>"
}
```

Response `200`
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<new-token>",
  "expiresIn": 900
}
```

## POST `/auth/logout`
Revoke current refresh token/session.

Request
```json
{
  "refreshToken": "<token>"
}
```

Response `204`

## POST `/auth/password/forgot`
Send reset OTP/token to email (generic response).

Request
```json
{
  "email": "alex@example.com"
}
```

Response `200`
```json
{
  "message": "If the account exists, reset instructions have been sent."
}
```

## POST `/auth/password/verify-otp`
Verify OTP and return reset token.

Request
```json
{
  "email": "alex@example.com",
  "otp": "317920"
}
```

Response `200`
```json
{
  "resetToken": "<single-use-token>",
  "expiresAt": "2026-03-27T08:10:00.000Z"
}
```

## POST `/auth/password/reset`
Reset password using verified reset token.

Request
```json
{
  "resetToken": "<single-use-token>",
  "newPassword": "N3w@Password123"
}
```

Response `200`
```json
{
  "message": "Password updated successfully."
}
```

## GET `/auth/me`
Current authenticated user.

Response `200`
```json
{
  "user": {
    "id": 101,
    "email": "alex@example.com",
    "role": "buyer",
    "status": "active"
  }
}
```

## 4) User and Seller Profile Endpoints

## PATCH `/users/me/profile`
Update profile fields.

Request
```json
{
  "displayName": "Alex M",
  "headline": "Startup founder",
  "bio": "Building products",
  "countryCode": "US",
  "timezone": "America/Los_Angeles",
  "languages": ["en"]
}
```

Response `200`
```json
{
  "profile": {
    "displayName": "Alex M",
    "headline": "Startup founder"
  }
}
```

## GET `/users/:userId/profile`
Public profile read.

Response `200`
```json
{
  "user": {
    "id": 212,
    "role": "seller"
  },
  "profile": {
    "displayName": "Sam Design",
    "headline": "Brand identity specialist"
  },
  "seller": {
    "level": "level_1",
    "ratingAvg": "4.80",
    "ratingCount": 129
  }
}
```

## PUT `/seller/me`
Create/update seller profile.

Request
```json
{
  "experienceYears": 5,
  "skills": ["logo", "branding"],
  "portfolioLinks": ["https://portfolio.example.com"],
  "responseTimeHours": 12,
  "isAvailable": true
}
```

Response `200`
```json
{
  "sellerProfile": {
    "userId": 212,
    "level": "new",
    "isAvailable": true
  }
}
```

## 5) Category and Gig Endpoints

## GET `/categories`
Return category tree.

Response `200`
```json
{
  "items": [
    {
      "id": 1,
      "slug": "graphics-design",
      "name": "Graphics & Design",
      "children": [
        { "id": 2, "slug": "logo-design", "name": "Logo Design" }
      ]
    }
  ]
}
```

## POST `/gigs`
Create gig (seller only).

Request
```json
{
  "categoryId": 2,
  "title": "I will design a modern brand logo",
  "description": "Professional logo design service...",
  "tags": ["logo", "brand", "identity"],
  "packages": [
    {
      "tier": "basic",
      "name": "Basic",
      "description": "1 logo concept",
      "price": "50.00",
      "deliveryDays": 3,
      "revisionsIncluded": 1,
      "features": ["PNG", "JPG"]
    },
    {
      "tier": "standard",
      "name": "Standard",
      "description": "2 concepts + source file",
      "price": "120.00",
      "deliveryDays": 4,
      "revisionsIncluded": 2,
      "features": ["PNG", "JPG", "AI"]
    }
  ],
  "faqs": [
    { "question": "What do you need?", "answer": "Brand name and style.", "sortOrder": 0 }
  ],
  "requirements": [
    { "prompt": "Brand name", "requirementType": "text", "isRequired": true, "sortOrder": 0 }
  ],
  "media": [
    { "mediaType": "image", "mediaUrl": "https://cdn.example.com/gigs/cover.jpg", "sortOrder": 0 }
  ],
  "status": "published"
}
```

Response `201`
```json
{
  "gig": {
    "id": 501,
    "sellerId": 212,
    "title": "I will design a modern brand logo",
    "status": "published",
    "minPrice": "50.00"
  }
}
```

## PATCH `/gigs/:gigId`
Update gig and nested package/faq/requirements/media arrays with server-side ownership checks.

## GET `/gigs/:gigId`
Gig detail (public if published, owner/admin can view draft/paused).

Response `200`
```json
{
  "gig": {
    "id": 501,
    "sellerId": 212,
    "categoryId": 2,
    "title": "I will design a modern brand logo",
    "description": "Professional logo design service...",
    "tags": ["logo", "brand"],
    "status": "published",
    "ratingAvg": "4.70",
    "ratingCount": 90,
    "completedOrdersCount": 230,
    "minPrice": "50.00"
  },
  "packages": [],
  "faqs": [],
  "requirements": [],
  "media": []
}
```

## GET `/gigs`
Search + list endpoint.

Query Params
- `q`, `categoryId`, `minPrice`, `maxPrice`, `deliveryDaysMax`, `sellerLevel`, `ratingMin`, `sort`, `limit`, `cursor`.

Response `200`
```json
{
  "items": [
    {
      "id": 501,
      "title": "I will design a modern brand logo",
      "minPrice": "50.00",
      "ratingAvg": "4.70",
      "ratingCount": 90,
      "seller": {
        "id": 212,
        "displayName": "Sam Design",
        "level": "level_1"
      }
    }
  ],
  "pageInfo": {
    "nextCursor": "eyJpZCI6NTAxfQ==",
    "hasMore": true
  }
}
```

## DELETE `/gigs/:gigId`
Archive gig (soft delete/archived status).

## 6) Order Lifecycle Endpoints

## POST `/orders`
Create order and payment intent (buyer only).  
Requires `Idempotency-Key`.

Request
```json
{
  "gigId": 501,
  "packageId": 8001,
  "currency": "USD",
  "requirements": [
    { "requirementId": 9901, "responseText": "Brand name is Acme Labs" }
  ]
}
```

Response `201`
```json
{
  "order": {
    "id": 30001,
    "orderNumber": "ORD-20260327-0001",
    "status": "pending_payment",
    "paymentStatus": "unpaid",
    "subtotalAmount": "50.00",
    "platformFeeAmount": "5.00",
    "taxAmount": "0.00",
    "totalAmount": "55.00"
  },
  "payment": {
    "provider": "stripe",
    "providerIntentId": "pi_123",
    "clientSecret": "pi_123_secret"
  }
}
```

## GET `/orders`
List own orders for buyer/seller.

Query Params
- `role=buyer|seller`, `status`, `limit`, `cursor`.

## GET `/orders/:orderId`
Order detail with requirements, deliveries, revisions summary.

## POST `/orders/:orderId/requirements`
Submit or update requirements (buyer, before in-progress cutoff).

## POST `/orders/:orderId/start`
Seller starts order when payment captured and requirements available.

## POST `/orders/:orderId/deliveries`
Seller submits delivery.

Request
```json
{
  "message": "Here is the final logo pack.",
  "deliveryFiles": [
    { "name": "logo.ai", "url": "https://cdn.example.com/orders/30001/logo.ai" }
  ]
}
```

Response `201`
```json
{
  "delivery": {
    "id": 70001,
    "deliveryNumber": 1,
    "deliveredAt": "2026-03-27T09:10:00.000Z"
  },
  "order": {
    "id": 30001,
    "status": "delivered"
  }
}
```

## POST `/orders/:orderId/revisions`
Buyer requests revision.

Request
```json
{
  "reason": "Please adjust typography and spacing."
}
```

## POST `/orders/:orderId/accept`
Buyer accepts delivery and completes order.

## POST `/orders/:orderId/cancel`
Cancel eligible order.

Request
```json
{
  "reason": "Requirements changed before work started."
}
```

## POST `/orders/:orderId/disputes`
Open dispute by buyer/seller.

Request
```json
{
  "reason": "Delivery quality issue",
  "details": "Output does not match package scope."
}
```

## 7) Messaging Endpoints

## GET `/conversations`
List conversations for current user with unread counts.

## GET `/conversations/:conversationId/messages`
List messages with cursor pagination.

## POST `/conversations/:conversationId/messages`
Send message in conversation.

Request
```json
{
  "body": "Thanks, I have shared updated references.",
  "attachments": [
    { "name": "brief.pdf", "url": "https://cdn.example.com/messages/brief.pdf" }
  ]
}
```

Response `201`
```json
{
  "message": {
    "id": 88001,
    "conversationId": 41000,
    "senderId": 101,
    "body": "Thanks, I have shared updated references.",
    "createdAt": "2026-03-27T10:00:00.000Z"
  }
}
```

## 8) Notification Endpoints

## GET `/notifications`
List notifications.

Query Params
- `limit`, `cursor`, `unreadOnly`.

## POST `/notifications/:id/read`
Mark single notification as read.

## POST `/notifications/read-all`
Mark all notifications as read.

## 9) Review Endpoints

## POST `/orders/:orderId/review`
Buyer submits review for completed order.

Request
```json
{
  "rating": 5,
  "comment": "Great communication and quality."
}
```

Response `201`
```json
{
  "review": {
    "id": 99001,
    "orderId": 30001,
    "rating": 5
  }
}
```

## POST `/reviews/:reviewId/reply`
Seller posts one reply.

## GET `/users/:userId/reviews`
List public reviews for seller profile page.

## 10) Payments and Wallet Endpoints

## GET `/payments/:orderId`
Get payment intent/payment status for order.

## POST `/payments/:orderId/retry`
Retry payment for failed payment states (buyer only).

## GET `/wallet/me/ledger`
Seller wallet ledger list.

## POST `/wallet/me/withdrawals`
Request payout withdrawal.

Request
```json
{
  "amount": "150.00",
  "currency": "USD",
  "destinationToken": "acct_ref_123"
}
```

## GET `/wallet/me/withdrawals`
List withdrawal requests and statuses.

## 11) Webhook Endpoint Contract

## POST `/webhooks/payments/:provider`
Receive provider events (`stripe`, `razorpay`).

Requirements
- Verify signature header.
- Store dedup key (`provider_event_id`) before processing.
- Idempotent processing based on unique event ID.
- Return `200` quickly after durable event persistence.

Event Handling Mapping
- `payment_intent.succeeded` -> mark order payment captured.
- `payment_intent.payment_failed` -> mark payment failed.
- `charge.refunded` -> update refund/payment/order state.

## 12) Admin Endpoints

## GET `/admin/users`
Filter users by role/status/search.

## POST `/admin/users/:userId/suspend`
Suspend user with reason.

## POST `/admin/users/:userId/activate`
Re-activate suspended user.

## GET `/admin/gigs`
Moderation view of gigs with flags.

## POST `/admin/gigs/:gigId/unpublish`
Unpublish violating gig.

## GET `/admin/disputes`
List disputes by status and age.

## POST `/admin/disputes/:disputeId/resolve`
Resolve dispute with controlled resolution types.

Request
```json
{
  "resolutionType": "refund_partial",
  "resolutionAmount": "20.00",
  "reason": "Partial mismatch in deliverables."
}
```

## GET `/admin/audit-logs`
Read paginated action logs.

## 13) Validation Rules (Selected)

- Email: RFC-compliant format, lowercase normalization.
- Password: minimum length + complexity.
- Currency: uppercase 3-char code.
- Price/amount: positive decimal with max precision 2.
- Rating: integer 1-5.
- `deliveryDays`: integer > 0.
- `revisionsIncluded`: integer >= 0.

## 14) State Transition Rules

Order status transitions
- `pending_payment` -> `in_progress` (after payment capture + requirements ready)
- `in_progress` -> `delivered` (seller delivery)
- `delivered` -> `revision_requested` (buyer revision)
- `revision_requested` -> `in_progress` (seller continues)
- `delivered` -> `completed` (buyer accepts)
- `pending_payment` or `in_progress` -> `cancelled` (eligible policy)
- `in_progress` or `delivered` -> `disputed` (allowed by role/policy)

Rules
- Illegal transition returns `409 CONFLICT`.
- Transition actor role and ownership must match policy.

## 15) Rate Limits (Recommended)

- `/auth/login`: 5 requests / 15 min per IP+email key.
- `/auth/register`: 5 requests / hour per IP.
- `/auth/password/*`: 5 requests / hour per identifier.
- `/orders` write endpoints: 30 requests / minute per user.
- `/messages` post: 60 requests / minute per conversation participant.

## 16) Observability Contract

Each response should include:
- `requestId`
- `durationMs` (server-side processing)

Structured log fields:
- `requestId`, `userId`, `route`, `statusCode`, `latencyMs`, `errorCode`.

Audit events required for:
- auth actions, password reset actions, order/payment/dispute/admin state changes.

## 17) Idempotency Policy

Endpoints requiring `Idempotency-Key`
- `POST /orders`
- `POST /payments/:orderId/retry`
- `POST /wallet/me/withdrawals`

Behavior
- Same key + same payload -> same successful response.
- Same key + different payload -> `409 CONFLICT` with mismatch error.
- Key retention: minimum 24 hours.

## 18) Versioning and Deprecation

- Version prefix in URL (`/v1`).
- Breaking changes require `/v2`.
- Deprecation notice window: 90 days minimum.

