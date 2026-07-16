# Software Requirements Specification (SRS) - MarketMind AI

## 1. Introduction
This document defines the software requirements for **MarketMind AI**, an enterprise-grade Stock & Crypto Market Intelligence Platform.

## 2. Actors & Target Users
* **Retail Investors**: Query charts, evaluate indicators, and manage portfolios.
* **Professional Traders**: Generate AI technical analyses, favorite reports, and track positions.
* **Financial Analysts**: Download reports as CSV or printable TXT, add note commentaries.
* **Administrators**: Control account authorizations, adjust roles, and audit security logs.

## 3. Functional Requirements

### 3.1 Authentication & Security
* The system must allow users to register with custom roles (retail, trader, analyst).
* User passwords must be stored using cryptographically secure hashing (bcrypt).
* Login must yield a valid JSON Web Token (JWT) expire-bound to authorize api requests.
* Optional Multi-Factor authentication (MFA) must generate standard TOTP configuration tokens.

### 3.2 AI Chart Upload & Validation
* Users upload chart images (PNG, JPG, JPEG, WEBP).
* The backend must validate:
  * File size limits (maximum 5MB).
  * Allowed extensions (strictly image formats).
  * Image availability post-save.
* Upload triggers a vision analysis prompt sent to the Gemini API (`gemini-2.5-flash`), returning structured JSON matching technical indicators and trend classifications.

### 3.3 Calculator & Position Sizing
* Capital allocation calculations must evaluate available capital, entry values, stops, targets, and risk tolerances.
* The system calculates exact position units, expected loss amounts, target payouts, capital allocation ratios, and risk-to-reward metrics.
* Renders comparative bar visualizations reflecting liabilities vs gains.

### 3.4 Portfolio & Watchlist
* Allow logging asset transactions (BUY and SELL).
* Recalculates average purchase prices and quantity sizes in real-time.
* Enrichment with live prices using `yfinance` and public crypto endpoints.
* Watchlist tickers support attaching internal notes and category tags.

### 3.5 Admin Portal
* Monitor total system registrations, active sessions, analysis counts, and confidence ratios.
* Access logs tracing action origins and source IPs.
* Controls to disable user accounts or override authorization clearance levels.

## 4. Non-Functional Requirements
* **Security**: Enforce JWT authorization guards across APIs, secure password policies, inputs sanitization, and structured audit logs.
* **Performance**: UI displays skeletons and status phase loops during AI processing.
* **Usability**: Fully responsive layouts adapting fluidly to mobile/tablet panels. Support for contrast toggling (Light & Dark theme).
