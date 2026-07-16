# API Documentation - MarketMind AI

All endpoints are relative to the base URL (e.g. `http://localhost:8000/api/v1` or `/api/v1`).

---

## 1. Authentication Endpoints

### 1.1 User Registration
* **Endpoint**: `POST /auth/register`
* **Security**: None
* **Request Body**:
  ```json
  {
    "email": "analyst@firm.com",
    "password": "strongpassword123",
    "role": "analyst"
  }
  ```
* **Response Status**: `201 Created`
* **Response Body**:
  ```json
  {
    "email": "analyst@firm.com",
    "id": 1,
    "role": "analyst",
    "is_active": true,
    "created_at": "2026-07-16T17:20:00"
  }
  ```

### 1.2 User Login (Token Generation)
* **Endpoint**: `POST /auth/login`
* **Security**: None
* **Request Format**: `application/x-www-form-urlencoded`
* **Request Parameters**:
  * `username`: (email string)
  * `password`: (password string)
* **Response Body**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "token_type": "bearer",
    "role": "analyst",
    "email": "analyst@firm.com"
  }
  ```

### 1.3 Get Current User Profile
* **Endpoint**: `GET /auth/me`
* **Security**: Bearer JWT Token
* **Response Body**:
  ```json
  {
    "email": "analyst@firm.com",
    "id": 1,
    "role": "analyst",
    "is_active": true,
    "created_at": "2026-07-16T17:20:00"
  }
  ```

---

## 2. Chart Analysis Endpoints

### 2.1 Upload Chart Image
* **Endpoint**: `POST /analysis/upload`
* **Security**: Bearer JWT Token
* **Request Format**: `multipart/form-data`
* **Request Parameters**:
  * `file`: Image file bytes
  * `asset_symbol`: Asset symbol string (e.g., BTC, AAPL)
  * `asset_type`: "stock" or "crypto"
* **Response Status**: `201 Created`
* **Response Body**: Returns structured `Analysis` object including image path and full Gemini JSON observations outcome.

### 2.2 Retrieve Analysis History
* **Endpoint**: `GET /analysis/history`
* **Security**: Bearer JWT Token
* **Query Parameters**:
  * `search`: Filter by symbol substring (optional)
  * `asset_type`: "stock" or "crypto" (optional)
  * `is_favorite`: boolean flag (optional)
  * `sort_by`: "date_desc", "date_asc", or "symbol_asc"
* **Response Body**: Array of `Analysis` objects.

### 2.3 Toggle Favorite Status
* **Endpoint**: `PUT /analysis/{analysis_id}/favorite`
* **Security**: Bearer JWT Token
* **Response Body**: Updated `Analysis` object.

### 2.4 Export Analysis CSV Data
* **Endpoint**: `GET /analysis/{analysis_id}/export/csv`
* **Security**: Bearer JWT Token
* **Response**: Returns standard `text/csv` stream file download.

### 2.5 Export Analysis PDF (Printable Text Format)
* **Endpoint**: `GET /analysis/{analysis_id}/export/pdf`
* **Security**: Bearer JWT Token
* **Response**: Returns standard `text/plain` file download stream containing formatted report sheets.

---

## 3. Position Calculator Endpoints

### 3.1 Calculate Position Sizing
* **Endpoint**: `POST /calculator`
* **Security**: None
* **Request Body**:
  ```json
  {
    "available_capital": 10000.0,
    "entry_price": 100.0,
    "stop_loss": 95.0,
    "target_price": 115.0,
    "max_risk_pct": 2.0
  }
  ```
* **Response Body**:
  ```json
  {
    "position_size": 40.0,
    "max_loss": 200.0,
    "expected_profit": 600.0,
    "risk_reward_ratio": 3.0,
    "capital_allocation_pct": 40.0
  }
  ```

---

## 4. Portfolio & Watchlist Endpoints

### 4.1 Get Active Portfolio Holdings
* **Endpoint**: `GET /portfolio`
* **Security**: Bearer JWT Token
* **Response Body**: Array of assets enriched with current price and P/L indicators.

### 4.2 Log Transaction
* **Endpoint**: `POST /portfolio/transaction`
* **Security**: Bearer JWT Token
* **Request Body**:
  ```json
  {
    "symbol": "BTC",
    "type": "BUY",
    "quantity": 0.5,
    "price": 62000.0
  }
  ```
* **Response Body**: Logged transaction receipt.

### 4.3 Get Watchlist Items
* **Endpoint**: `GET /watchlist`
* **Security**: Bearer JWT Token
* **Response Body**: Array of watchlisted assets.

### 4.4 Add Item to Watchlist
* **Endpoint**: `POST /watchlist`
* **Security**: Bearer JWT Token
* **Request Body**:
  ```json
  {
    "symbol": "SOL",
    "asset_type": "crypto",
    "notes": "Retesting weekly dynamic support",
    "tags": "breakout, core"
  }
  ```

---

## 5. Administrative Endpoints
*All Admin endpoints require the active User role to be `admin`.*

### 5.1 System Usage Statistics
* **Endpoint**: `GET /admin/stats`
* **Security**: Bearer JWT Token (Admin role check)
* **Response Body**:
  ```json
  {
    "total_users": 10,
    "active_users": 9,
    "total_analyses": 45,
    "saved_reports": 12,
    "average_confidence": 84.5
  }
  ```

### 5.2 Security Audit Logs
* **Endpoint**: `GET /admin/logs`
* **Security**: Bearer JWT Token (Admin role check)
* **Response Body**: Array of audit log actions.
