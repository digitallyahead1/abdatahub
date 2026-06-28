# API Documentation - AB Data Hub

## Base URL

```
http://localhost:3001/api/v1
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {accessToken}
```

---

## Authentication Endpoints

### Register User

`POST /auth/register`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "08012345678",
  "password": "securePassword123",
  "confirmPassword": "securePassword123",
  "referralCode": "OPTIONAL"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "user": {
      "id": "user_id",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "08012345678"
    },
    "expiresIn": 86400
  }
}
```

---

### Login

`POST /auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "user": { ... }
  }
}
```

---

### Verify OTP

`POST /auth/verify-otp`

**Request Body:**
```json
{
  "userId": "user_id",
  "otp": "123456",
  "type": "email" | "phone"
}
```

---

## User Endpoints

### Get Profile

`GET /users/profile`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "08012345678",
    "avatar": "url",
    "walletBalance": 5000,
    "totalTransactions": 25,
    "successfulTransactions": 24,
    "referralCode": "ABuser_123abc",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Update Profile

`PUT /users/profile`

**Request Body:**
```json
{
  "fullName": "John Doe",
  "avatar": "url"
}
```

---

## Transaction Endpoints

### Buy Data

`POST /transactions/data`

**Request Body:**
```json
{
  "phoneNumber": "08012345678",
  "network": "mtn" | "airtel" | "glo" | "9mobile",
  "planId": "data_plan_id",
  "amount": 500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "transaction_id",
    "type": "debit",
    "service": "data",
    "amount": 500,
    "status": "processing",
    "reference": "ABD202401150001",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### Buy Airtime

`POST /transactions/airtime`

**Request Body:**
```json
{
  "phoneNumber": "08012345678",
  "network": "mtn",
  "amount": 1000
}
```

---

### Buy Cable TV

`POST /transactions/cable`

**Request Body:**
```json
{
  "provider": "dstv",
  "smartCardNumber": "1234567890",
  "packageId": "package_id",
  "amount": 5000
}
```

---

### Pay Electricity

`POST /transactions/electricity`

**Request Body:**
```json
{
  "disco": "ikedc",
  "meterNumber": "12345678901",
  "meterType": "prepaid" | "postpaid",
  "amount": 3000
}
```

---

### Buy Exam Pins

`POST /transactions/exam-pins`

**Request Body:**
```json
{
  "examType": "waec" | "neco" | "jamb" | "nabteb",
  "quantity": 5,
  "amount": 2500
}
```

---

### Transaction History

`GET /transactions?page=1&pageSize=10&status=success`

**Query Parameters:**
- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 10)
- `status` - Filter by status
- `type` - Filter by service type
- `startDate` - Filter by date range
- `endDate` - Filter by date range

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "transaction_id",
      "type": "debit",
      "service": "data",
      "amount": 500,
      "status": "success",
      "reference": "ABD202401150001",
      "metadata": { ... },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

---

## Wallet Endpoints

### Get Wallet Balance

`GET /wallet/balance`

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 15000,
    "ledgerBalance": 15000,
    "currency": "NGN"
  }
}
```

---

### Fund Wallet

`POST /wallet/fund`

**Request Body:**
```json
{
  "amount": 5000,
  "paymentMethod": "paystack" | "flutterwave" | "moniepoint"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "transaction_id",
    "amount": 5000,
    "status": "pending",
    "paymentUrl": "https://checkout.paystack.com/...",
    "reference": "ABW202401150001"
  }
}
```

---

### Wallet History

`GET /wallet/history?page=1&pageSize=10`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "transaction_id",
      "type": "credit",
      "amount": 5000,
      "description": "Wallet Funding",
      "reference": "ABW202401150001",
      "previousBalance": 10000,
      "newBalance": 15000,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Referral Endpoints

### Get Referral Info

`GET /referral/info`

**Response:**
```json
{
  "success": true,
  "data": {
    "referralCode": "ABuser_123abc",
    "totalReferrals": 10,
    "totalEarnings": 5000,
    "pendingEarnings": 1000,
    "referrals": [
      {
        "id": "referral_id",
        "referralCode": "ABuser_123abc",
        "referredUserId": "referred_user_id",
        "status": "active",
        "commission": 500,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Common Error Codes

| Code | Status | Message |
|------|--------|---------|
| INVALID_CREDENTIALS | 401 | Invalid email or password |
| USER_NOT_FOUND | 404 | User not found |
| INSUFFICIENT_BALANCE | 400 | Insufficient wallet balance |
| TRANSACTION_FAILED | 400 | Transaction processing failed |
| INVALID_PHONE_NUMBER | 400 | Invalid phone number format |
| USER_ALREADY_EXISTS | 409 | Email or phone already registered |

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Window**: 15 minutes
- **Limit**: 100 requests per window
- **Headers**: 
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

---

## Pagination

Paginated endpoints accept:

- `page` - Page number (1-indexed)
- `pageSize` - Items per page (1-100, default: 10)

Response includes:

```json
{
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```
