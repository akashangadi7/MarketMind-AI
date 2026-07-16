# System Design & Architecture Document - MarketMind AI

## 1. Architectural Style
MarketMind AI uses a containerized multi-tier client-server architecture:
* **Presentation Layer**: Single Page Application built on React, TypeScript, and Tailwind CSS. Renders dashboards, charts, forms, and handles state.
* **API Gateway / Control Layer**: FastAPI (Python) implementing REST API routes, security middleware, and input parsing.
* **Service Integrations**: Google Gemini API for Vision Technical analysis, and Yahoo Finance/Binance APIs for live price feeds.
* **Data Layer**: PostgreSQL (development/production) or SQLite (local standalone) with SQLAlchemy Object Relational Mapping (ORM).

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS {
        int id PK
        string email UK
        string hashed_password
        string role
        boolean is_active
        string mfa_secret
        datetime created_at
    }
    ANALYSES {
        int id PK
        int user_id FK
        string asset_symbol
        string asset_type
        string chart_image_path
        json analysis_result
        boolean is_favorite
        datetime created_at
    }
    PORTFOLIO_ASSETS {
        int id PK
        int user_id FK
        string symbol
        string asset_type
        float shares_quantity
        float average_buy_price
        datetime updated_at
    }
    TRANSACTIONS {
        int id PK
        int user_id FK
        string symbol
        string type
        float quantity
        float price
        datetime executed_at
    }
    WATCHLISTS {
        int id PK
        int user_id FK
        string symbol
        string asset_type
        text notes
        string tags
        datetime created_at
    }
    AUDIT_LOGS {
        int id PK
        int user_id FK
        string action
        string ip_address
        datetime timestamp
    }

    USERS ||--o{ ANALYSES : generates
    USERS ||--o{ PORTFOLIO_ASSETS : owns
    USERS ||--o{ TRANSACTIONS : logs
    USERS ||--o{ WATCHLISTS : tracks
    USERS ||--o{ AUDIT_LOGS : records
```

---

## 3. Database Schema Mapping

### 3.1 `users` Table
* `id` (INTEGER, Primary Key, Auto-increment)
* `email` (VARCHAR, Unique, Indexed, Not Null)
* `hashed_password` (VARCHAR, Not Null)
* `role` (VARCHAR, Default 'retail', Not Null)
* `is_active` (BOOLEAN, Default True, Not Null)
* `mfa_secret` (VARCHAR, Nullable)
* `created_at` (DATETIME, Default UTC Now, Not Null)

### 3.2 `analyses` Table
* `id` (INTEGER, Primary Key, Auto-increment)
* `user_id` (INTEGER, Foreign Key referencing `users.id`, Not Null)
* `asset_symbol` (VARCHAR, Not Null)
* `asset_type` (VARCHAR, Not Null)
* `chart_image_path` (VARCHAR, Nullable)
* `analysis_result` (JSON, Not Null)
* `is_favorite` (BOOLEAN, Default False, Not Null)
* `created_at` (DATETIME, Default UTC Now, Not Null)

### 3.3 `portfolio_assets` Table
* `id` (INTEGER, Primary Key, Auto-increment)
* `user_id` (INTEGER, Foreign Key referencing `users.id`, Not Null)
* `symbol` (VARCHAR, Not Null)
* `asset_type` (VARCHAR, Not Null)
* `shares_quantity` (FLOAT, Default 0.0, Not Null)
* `average_buy_price` (FLOAT, Default 0.0, Not Null)
* `updated_at` (DATETIME, Default UTC Now, Not Null)

### 3.4 `transactions` Table
* `id` (INTEGER, Primary Key, Auto-increment)
* `user_id` (INTEGER, Foreign Key referencing `users.id`, Not Null)
* `symbol` (VARCHAR, Not Null)
* `type` (VARCHAR, Not Null) - "BUY" or "SELL"
* `quantity` (FLOAT, Not Null)
* `price` (FLOAT, Not Null)
* `executed_at` (DATETIME, Default UTC Now, Not Null)

### 3.5 `watchlists` Table
* `id` (INTEGER, Primary Key, Auto-increment)
* `user_id` (INTEGER, Foreign Key referencing `users.id`, Not Null)
* `symbol` (VARCHAR, Not Null)
* `asset_type` (VARCHAR, Not Null)
* `notes` (TEXT, Nullable)
* `tags` (VARCHAR, Nullable)
* `created_at` (DATETIME, Default UTC Now, Not Null)

### 3.6 `audit_logs` Table
* `id` (INTEGER, Primary Key, Auto-increment)
* `user_id` (INTEGER, Foreign Key referencing `users.id`, Nullable)
* `action` (VARCHAR, Not Null)
* `ip_address` (VARCHAR, Nullable)
* `timestamp` (DATETIME, Default UTC Now, Not Null)
