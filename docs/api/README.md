# AB Data Hub — Public API Documentation

> **Version:** v1  
> **Last Updated:** September 2026  
> **Base URL:** `https://api.abdatahub.com/api/v1`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Networks](#networks)
5. [Data Plans](#data-plans)
   - [List All Plans](#list-all-plans)
   - [Filter Plans by Network](#filter-plans-by-network)
   - [Get a Single Plan](#get-a-single-plan)
   - [Plan ID Reference Guide](#plan-id-reference-guide)
6. [Purchase Data](#purchase-data)
7. [Transactions](#transactions)
   - [List Transactions](#list-transactions)
   - [Get Transaction by Reference](#get-transaction-by-reference)
8. [Webhooks](#webhooks)
   - [Register an Endpoint](#register-an-endpoint)
   - [List Endpoints](#list-endpoints)
   - [Delete an Endpoint](#delete-an-endpoint)
   - [Disable an Endpoint](#disable-an-endpoint)
   - [View Delivery History](#view-delivery-history)
   - [Send a Test Ping](#send-a-test-ping)
   - [Webhook Events](#webhook-events)
   - [Payload Structure](#payload-structure)
   - [Signature Verification](#signature-verification)
9. [Error Reference](#error-reference)
10. [Providers Reference](#providers-reference)
11. [Code Examples](#code-examples)
12. [Changelog](#changelog)

---

## Overview

The **AB Data Hub Public API** allows third-party applications — mobile apps, web platforms, and bots — to programmatically:

- Fetch available data plans for MTN, Airtel, Glo, and 9mobile
- Purchase data bundles on behalf of users using a pre-funded wallet
- Track transactions and their statuses in real time

All API responses follow a consistent envelope format:

```json
{
  "success": true | false,
  "data": { ... },
  "message": "Human readable message"
}
```

---

## Authentication

All API calls require an **API Key** to be sent in the request header.

> **Warning: Never expose your API key in client-side (browser) code. Always call from your server.**

### Header Format

```http
x-api-key: YOUR_API_KEY
```

### Getting Your API Key

Log in to your AB Data Hub dashboard → **Settings → API Keys → Generate Key**.

Two scopes are available:

| Scope | Description |
|-------|-------------|
| `read` | Fetch plans, networks, and transactions only |
| `full` | All of the above **+ purchase data** |

---

## Rate Limiting

| Plan | Limit |
|------|-------|
| Default | 60 requests / minute |
| Agent | 200 requests / minute |

When the limit is exceeded, you receive:

```http
HTTP 429 Too Many Requests
```

```json
{
  "success": false,
  "message": "Rate limit exceeded. Slow down and retry.",
  "data": null
}
```

**Response Headers:**

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Total requests allowed per window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |

---

## Networks

### List All Networks

Returns all active networks that have at least one visible data plan.

**Endpoint:**
```http
GET /v1/networks
```

**Required Scope:** `read`

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "MTN",     "code": "mtn",     "status": "active" },
    { "id": 2, "name": "Airtel",  "code": "airtel",  "status": "active" },
    { "id": 3, "name": "Glo",     "code": "glo",     "status": "active" },
    { "id": 4, "name": "9mobile", "code": "9mobile", "status": "active" }
  ],
  "message": "Networks retrieved successfully"
}
```

---

### Get Single Network

```http
GET /v1/networks/{networkCode}
```

| Path Parameter | Type   | Description |
|----------------|--------|-------------|
| `networkCode`  | string | One of: `mtn`, `airtel`, `glo`, `9mobile` |

**Response:**
```json
{
  "success": true,
  "data": { "id": 1, "name": "MTN", "code": "mtn", "status": "active" },
  "message": "Network retrieved successfully"
}
```

---

## Data Plans

### List All Plans

Returns all active, visible data plans sorted by network and price.

**Endpoint:**
```http
GET /v1/data/plans
```

**Required Scope:** `read`

**Query Parameters:**

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `network` | string | No       | Filter by network code: `mtn`, `airtel`, `glo`, `9mobile` |
| `status`  | string | No       | `active` (default) or `all` |

**Example Request:**
```bash
curl -X GET "https://api.abdatahub.com/api/v1/data/plans?network=mtn" \
  -H "x-api-key: YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "3f1a2b4c-0e9d-4f7a-b8c1-1234567890ab",
      "provider_plan_id": 173,
      "network": "mtn",
      "name": "MTN 1GB SME - 30 Days",
      "price": 350.00,
      "provider_price": 295.00,
      "provider": "danmalama",
      "status": "active",
      "created_at": "2026-09-20T10:00:00Z",
      "updated_at": "2026-09-23T18:00:00Z"
    },
    {
      "id": "7a9b3c1d-2e4f-5a6b-c7d8-abcdef012345",
      "provider_plan_id": 42,
      "network": "mtn",
      "name": "MTN 2GB SME - 30 Days",
      "price": 650.00,
      "provider_price": 560.00,
      "provider": "smeplug",
      "status": "active",
      "created_at": "2026-08-15T12:00:00Z",
      "updated_at": "2026-09-22T09:00:00Z"
    }
  ],
  "message": "Data plans retrieved successfully"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID string | **Use this as `plan_id` in purchase requests** |
| `provider_plan_id` | number | Internal plan ID from the upstream provider |
| `network` | string | Network code (`mtn`, `airtel`, `glo`, `9mobile`) |
| `name` | string | Human-readable plan name including size and validity |
| `price` | number | Selling price in NGN (what the user pays) |
| `provider_price` | number | Our cost price from the upstream provider |
| `provider` | string | Upstream provider: `smeplug`, `swiftbills`, `amzaet`, or `danmalama` |
| `status` | string | `active` or `inactive` |

---

### Filter Plans by Network

```http
GET /v1/data/plans?network=airtel
GET /v1/data/plans?network=glo
GET /v1/data/plans?network=9mobile
```

All return the same response shape as above, filtered to the specified network.

---

### Get a Single Plan

```http
GET /v1/data/plans/{planId}
```

| Path Parameter | Type | Description |
|----------------|------|-------------|
| `planId` | UUID | The `id` from the plan listing |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "3f1a2b4c-0e9d-4f7a-b8c1-1234567890ab",
    "provider_plan_id": 173,
    "network": "mtn",
    "name": "MTN 1GB SME - 30 Days",
    "price": 350.00,
    "provider_price": 295.00,
    "provider": "danmalama",
    "status": "active",
    "created_at": "2026-09-20T10:00:00Z",
    "updated_at": "2026-09-23T18:00:00Z"
  },
  "message": "Data plan retrieved successfully"
}
```

---

### Plan ID Reference Guide

> **Important:** AB Data Hub uses **UUID-based `plan_id`s** (e.g. `3f1a2b4c-0e9d-4f7a-b8c1-1234567890ab`) as the standard identifier for purchasing data. These UUIDs are **stable** — they do not change when the upstream provider updates prices or names. Always use the `id` field from the plan listing.

#### How Plan IDs Work

```
 GET /v1/data/plans?network=mtn
 Returns:
 [{
   "id": "3f1a2b4c-...",    <-- USE THIS as plan_id in purchase
   "provider_plan_id": 173,  <-- Internal upstream ID (read-only)
   "network": "mtn",
   "provider": "danmalama"   <-- Routed automatically by the server
 }]
```

#### Recommended Integration Pattern

1. **Fetch plans once** and cache them (refresh daily or on demand)
2. **Let user select** a plan from your UI — store the UUID `id`
3. **Purchase** using that UUID — the server handles routing to the right provider automatically

You do **not** need to know or manage which provider backs a plan.

---

## Purchase Data

> **Required Scope:** `full`

Purchase a data bundle for any phone number using a pre-funded wallet.

**Endpoint:**
```http
POST /v1/data/purchase
```

**Headers:**

```http
x-api-key: YOUR_API_KEY
Content-Type: application/json
Idempotency-Key: UNIQUE_KEY_PER_REQUEST    (optional but recommended)
```

**Request Body:**

```json
{
  "plan_id": "3f1a2b4c-0e9d-4f7a-b8c1-1234567890ab",
  "network": "mtn",
  "phone": "08012345678"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `plan_id` | UUID string | Yes | The `id` from `GET /v1/data/plans` |
| `network` | string | Yes | `mtn`, `airtel`, `glo`, or `9mobile` |
| `phone` | string | Yes | 10 or 11-digit Nigerian phone number |

**`Idempotency-Key` Header (Recommended)**

Use a unique string per purchase attempt (e.g. UUID v4). If the same key is sent within 24 hours, the API returns the original result without charging again — protecting against duplicate purchases on network retries.

```http
Idempotency-Key: f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "transaction_reference": "DATA-20260923-A1B2C3D4",
    "network": "mtn",
    "plan": "MTN 1GB SME - 30 Days",
    "phone": "08012345678",
    "amount": 350.00,
    "status": "success",
    "provider_transaction_id": "DAN-78291",
    "completed_at": "2026-09-23T22:15:43Z",
    "message": "Data subscription sent to 08012345678"
  },
  "message": "Data subscription sent to 08012345678"
}
```

**Failure Response:**

```json
{
  "success": false,
  "data": {
    "transaction_reference": "DATA-20260923-X9Y8Z7W6",
    "network": "airtel",
    "plan": "Airtel 1GB - 30 Days",
    "phone": "09012345678",
    "amount": 320.00,
    "status": "failed",
    "provider_transaction_id": null,
    "completed_at": "2026-09-23T22:20:10Z",
    "message": "Provider rejected the request"
  },
  "message": "Provider rejected the request"
}
```

> **On failure:** The amount is **automatically refunded** to the wallet. No manual action needed from your side.

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `transaction_reference` | string | Unique reference — save this for tracking |
| `network` | string | Network code used |
| `plan` | string | Plan name |
| `phone` | string | Recipient phone number |
| `amount` | number | Amount debited from wallet (NGN) |
| `status` | string | `success` or `failed` |
| `provider_transaction_id` | string/null | Reference from upstream provider |
| `completed_at` | ISO 8601 | Timestamp of completion |
| `message` | string | Human-readable status message |

---

## Transactions

### List Transactions

Returns paginated transaction history for the authenticated API key owner.

**Endpoint:**
```http
GET /v1/transactions
```

**Required Scope:** `read`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 20 | Items per page (max: 100) |
| `status` | string | — | Filter: `success`, `failed`, `processing` |

**Example:**
```bash
curl "https://api.abdatahub.com/api/v1/transactions?page=1&limit=10&status=success" \
  -H "x-api-key: YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "9c3e1a2b-4d5f-6789-abcd-ef0123456789",
      "reference": "DATA-20260923-A1B2C3D4",
      "network": "mtn",
      "plan": "MTN 1GB SME - 30 Days",
      "phone": "08012345678",
      "amount": 350.00,
      "status": "success",
      "failure_reason": null,
      "provider_transaction_id": "DAN-78291",
      "created_at": "2026-09-23T22:15:40Z",
      "completed_at": "2026-09-23T22:15:43Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 142,
    "totalPages": 15
  },
  "message": "Transactions retrieved successfully"
}
```

---

### Get Transaction by Reference

Look up a specific transaction using the `transaction_reference` returned from a purchase.

**Endpoint:**
```http
GET /v1/transactions/{reference}
```

| Path Parameter | Type | Description |
|----------------|------|-------------|
| `reference` | string | e.g. `DATA-20260923-A1B2C3D4` |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "9c3e1a2b-4d5f-6789-abcd-ef0123456789",
    "reference": "DATA-20260923-A1B2C3D4",
    "network": "mtn",
    "plan": "MTN 1GB SME - 30 Days",
    "phone": "08012345678",
    "amount": 350.00,
    "status": "success",
    "failure_reason": null,
    "provider_transaction_id": "DAN-78291",
    "created_at": "2026-09-23T22:15:40Z",
    "completed_at": "2026-09-23T22:15:43Z"
  },
  "message": "Transaction retrieved successfully"
}
```

---

## Error Reference

All errors follow this envelope:

```json
{
  "success": false,
  "message": "Human readable error message",
  "data": null
}
```

### HTTP Status Codes

| Status | Meaning |
|--------|---------|
| `200` | Success |
| `201` | Resource created (purchase) |
| `400` | Bad request — invalid input |
| `401` | Unauthorized — missing or invalid API key |
| `403` | Forbidden — API key scope insufficient |
| `404` | Not found — plan or transaction doesn't exist |
| `429` | Too many requests — rate limit exceeded |
| `500` | Internal server error |

### Common Error Messages

| Message | HTTP | Fix |
|---------|------|-----|
| `Missing or invalid API key` | 401 | Check `x-api-key` header |
| `Your API key does not have purchase access` | 403 | Upgrade scope to `full` |
| `Invalid phone number. Must be 10 or 11 digits.` | 400 | Validate phone before sending |
| `Data plan not found or is currently inactive.` | 404 | Refresh plan list — plan may have been removed |
| `Insufficient wallet balance` | 400 | Top up wallet via dashboard |
| `Rate limit exceeded` | 429 | Implement exponential backoff |

---

## Providers Reference

The platform uses multiple upstream providers for reliability and pricing diversity. You do **not** need to interact with providers directly — the API routes automatically based on the `plan_id`.

### Provider Coverage by Network

| Provider | MTN | Airtel | Glo | 9mobile | Added |
|----------|-----|--------|-----|---------|-------|
| `smeplug` | Yes | Yes | Yes | Yes | v1.0 |
| `swiftbills` | Yes | — | — | — | v1.1 |
| `amzaet` | Yes | — | — | — | v1.1 |
| `danmalama` | **Yes** | **Yes** | **Yes** | — | **v1.3** |

> **Danmalama** (added Sept 2026) is the newest provider — it covers MTN, Airtel, and Glo. When you fetch plans and see `"provider": "danmalama"`, purchasing them works exactly the same way as any other plan.

---

## Code Examples

### Node.js / JavaScript

```javascript
const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://api.abdatahub.com/api/v1';

// 1. Fetch all MTN plans
async function getMtnPlans() {
  const res = await fetch(`${BASE_URL}/data/plans?network=mtn`, {
    headers: { 'x-api-key': API_KEY }
  });
  const { data } = await res.json();
  return data; // Array of plans
}

// 2. Purchase a data plan
async function purchaseData(planId, phone, network) {
  const res = await fetch(`${BASE_URL}/data/purchase`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID()
    },
    body: JSON.stringify({ plan_id: planId, phone, network })
  });
  return res.json();
}

// Usage
const plans = await getMtnPlans();
const firstPlan = plans[0]; // { id: "uuid...", network: "mtn", ... }
const result = await purchaseData(firstPlan.id, '08012345678', 'mtn');
console.log(result.data.status); // "success" or "failed"
```

### Python

```python
import requests
import uuid

API_KEY = "your_api_key_here"
BASE_URL = "https://api.abdatahub.com/api/v1"
HEADERS = {"x-api-key": API_KEY, "Content-Type": "application/json"}

def get_plans(network="mtn"):
    r = requests.get(f"{BASE_URL}/data/plans", params={"network": network}, headers=HEADERS)
    return r.json()["data"]

def purchase_data(plan_id: str, phone: str, network: str):
    r = requests.post(
        f"{BASE_URL}/data/purchase",
        headers={**HEADERS, "Idempotency-Key": str(uuid.uuid4())},
        json={"plan_id": plan_id, "phone": phone, "network": network}
    )
    return r.json()

# Usage
plans = get_plans("airtel")
result = purchase_data(plans[0]["id"], "09012345678", "airtel")
print(result["data"]["status"])
```

### Dart (Flutter)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';

const apiKey = 'your_api_key_here';
const baseUrl = 'https://api.abdatahub.com/api/v1';

// Fetch data plans by network
Future<List<Map<String, dynamic>>> getDataPlans(String network) async {
  final uri = Uri.parse('$baseUrl/data/plans?network=$network');
  final res = await http.get(uri, headers: {'x-api-key': apiKey});
  final body = jsonDecode(res.body) as Map<String, dynamic>;
  return List<Map<String, dynamic>>.from(body['data']);
}

// Purchase data
Future<Map<String, dynamic>> purchaseData({
  required String planId,
  required String phone,
  required String network,
}) async {
  final uri = Uri.parse('$baseUrl/data/purchase');
  final res = await http.post(
    uri,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'Idempotency-Key': const Uuid().v4(),
    },
    body: jsonEncode({'plan_id': planId, 'phone': phone, 'network': network}),
  );
  return jsonDecode(res.body) as Map<String, dynamic>;
}

// Usage example
void main() async {
  final plans = await getDataPlans('glo');
  final result = await purchaseData(
    planId: plans.first['id'],
    phone: '08123456789',
    network: 'glo',
  );
  print(result['data']['status']); // success or failed
}
```

---

## Webhooks

Webhooks allow AB Data Hub to **push real-time notifications** to your server when events happen — such as when a data purchase succeeds or fails. This is far more efficient than polling the transactions API.

> **Requires:** JWT authentication. Manage your webhooks from your server — never expose your webhook secret in a client app.

### Register an Endpoint

```http
POST /v1/webhooks
```

**Request Body:**

```json
{
  "label": "Production App",
  "url": "https://yourapp.com/hooks/abdatahub",
  "events": ["data.purchase.success", "data.purchase.failed"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | No | Friendly name for this endpoint |
| `url` | string | Yes | Your HTTPS endpoint URL |
| `events` | string[] | No | Events to subscribe to (defaults to all) |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "wh_3f1a2b4c-0e9d-4f7a-b8c1-1234567890ab",
    "label": "Production App",
    "url": "https://yourapp.com/hooks/abdatahub",
    "events": ["data.purchase.success", "data.purchase.failed"],
    "status": "active",
    "secret": "whsec_a1b2c3d4e5f6...",
    "created_at": "2026-09-24T00:10:00Z"
  },
  "message": "Webhook endpoint registered. Save your secret — it will not be shown again."
}
```

> **Save your `secret` immediately.** It is shown only once and is required to verify incoming webhook signatures.

---

### List Endpoints

```http
GET /v1/webhooks
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "wh_3f1a2b4c-...",
      "label": "Production App",
      "url": "https://yourapp.com/hooks/abdatahub",
      "events": ["data.purchase.success", "data.purchase.failed"],
      "status": "active",
      "created_at": "2026-09-24T00:10:00Z"
    }
  ]
}
```

> The `secret` is **not returned** after initial registration.

---

### Delete an Endpoint

```http
DELETE /v1/webhooks/{id}
```

Permanently removes the endpoint and all its delivery history.

---

### Disable an Endpoint

```http
POST /v1/webhooks/{id}/disable
```

Pauses deliveries without deleting the endpoint. Re-enable by deleting and re-registering.

---

### View Delivery History

```http
GET /v1/webhooks/{id}/deliveries?limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "del_abc123",
      "event": "data.purchase.success",
      "success": true,
      "attempt": 1,
      "response_status": 200,
      "response_body": "ok",
      "delivered_at": "2026-09-24T00:15:43Z",
      "created_at": "2026-09-24T00:15:40Z"
    }
  ]
}
```

| Field | Description |
|-------|-------------|
| `attempt` | Delivery attempt number (1 = first try, 2+ = retry) |
| `success` | `true` if your server returned HTTP 2xx |
| `response_status` | HTTP status your server returned |

---

### Send a Test Ping

```http
POST /v1/webhooks/{id}/test
```

Sends a `test.ping` event to your endpoint to verify connectivity before going live.

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "response_status": 200,
    "message": "Test ping delivered successfully."
  }
}
```

---

### Webhook Events

| Event | Fired When |
|-------|------------|
| `data.purchase.success` | A data purchase completes successfully |
| `data.purchase.failed` | A data purchase fails (refund is automatically issued) |
| `test.ping` | Sent only via the test endpoint — not a real transaction |

**Retry policy:** Failed deliveries are retried up to **3 times** with exponential backoff (1s → 3s → 9s). After all retries fail, the event is marked as failed in delivery history.

---

### Payload Structure

Every webhook POST to your URL contains:

```json
{
  "event": "data.purchase.success",
  "data": {
    "transaction_reference": "DATA-20260924-A1B2C3D4",
    "network": "mtn",
    "plan": "MTN 1GB SME - 30 Days",
    "phone": "08012345678",
    "amount": 350.00,
    "status": "success",
    "provider_transaction_id": "DAN-78291",
    "completed_at": "2026-09-24T00:15:43Z",
    "message": "Data subscription sent to 08012345678"
  },
  "timestamp": "2026-09-24T00:15:44Z"
}
```

**HTTP Headers sent with every delivery:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `X-ABHub-Signature` | `sha256=<HMAC-SHA256 of request body>` |
| `X-ABHub-Event` | e.g. `data.purchase.success` |
| `User-Agent` | `ABDataHub-Webhooks/1.0` |

---

### Signature Verification

**Always verify the `X-ABHub-Signature` header** before processing a webhook — this confirms the delivery genuinely comes from AB Data Hub and hasn't been tampered with.

The signature is computed as:
```
sha256=HMAC-SHA256(webhookSecret, rawRequestBody)
```

#### Node.js

```javascript
const crypto = require('crypto');

function verifyWebhook(rawBody, signatureHeader, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody)  // rawBody must be the raw Buffer/string, NOT parsed JSON
    .digest('hex');
  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader)
  );
}

// Express example
app.post('/hooks/abdatahub', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-abhub-signature'];
  if (!verifyWebhook(req.body, sig, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  const event = JSON.parse(req.body);
  console.log('Received:', event.event, event.data.transaction_reference);
  res.status(200).send('ok');
});
```

#### Python (Flask)

```python
import hmac, hashlib, os
from flask import Flask, request, abort

app = Flask(__name__)

@app.route('/hooks/abdatahub', methods=['POST'])
def webhook():
    sig = request.headers.get('X-ABHub-Signature', '')
    raw = request.get_data()  # raw bytes — do NOT call request.json first
    expected = 'sha256=' + hmac.new(
        os.environ['WEBHOOK_SECRET'].encode(),
        raw,
        hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected, sig):
        abort(401)
    event = request.json
    print('Received:', event['event'], event['data']['transaction_reference'])
    return 'ok', 200
```

#### Dart (Flutter backend / server)

```dart
import 'dart:convert';
import 'dart:io';
import 'package:crypto/crypto.dart';

bool verifySignature(String rawBody, String sigHeader, String secret) {
  final mac = Hmac(sha256, utf8.encode(secret));
  final digest = mac.convert(utf8.encode(rawBody));
  final expected = 'sha256=\${digest.toString()}';
  // Constant-time comparison
  if (expected.length != sigHeader.length) return false;
  var result = 0;
  for (var i = 0; i < expected.length; i++) {
    result |= expected.codeUnitAt(i) ^ sigHeader.codeUnitAt(i);
  }
  return result == 0;
}
```

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| Sept 2026 | v1.4 | Added **Outgoing Webhook System** — `data.purchase.success`, `data.purchase.failed` events with HMAC-SHA256 signing and 3-attempt retry |
| Sept 2026 | v1.3 | Added **Danmalama** provider — MTN, Airtel, and Glo plans now available via Danmalama |
| Sept 2026 | v1.2 | Added Swiftbills provider for MTN plans |
| Aug 2026 | v1.1 | Added AMZAET provider for MTN plans |
| Jul 2026 | v1.0 | Initial release with SMEPlug as default provider |

---

*For support or to report integration issues, contact the AB Data Hub team via your dashboard.*
