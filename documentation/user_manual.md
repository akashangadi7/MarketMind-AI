# User & Admin Manual - MarketMind AI

Welcome to **MarketMind AI**, the Stock & Crypto Market Intelligence Platform. This manual details application modules and operations.

---

## 1. User Manual

### 1.1 Authentication & Registration
1. Navigate to the login page. If you are a new user, click **Register here** to create an account.
2. Select your professional sector:
   * **Retail Investor**: Standard analytics clearance.
   * **Professional Trader**: Enhanced portfolio recording access.
   * **Financial Analyst**: Multi-format report extraction capabilities.
3. Log in with your registered credentials. Your authentication token will automatically save to authorize browser requests.

### 1.2 Execution of AI Chart Analysis
1. Select **Chart Analysis** from the side menu.
2. Enter the ticker symbol (e.g. `AAPL` or `BTC`) and classify the asset type.
3. Drag and drop your market chart image (PNG, JPG, or WEBP) into the target box, or click to upload.
4. Click **Initiate Analysis**.
5. Renders a comprehensive, visual report detailing:
   * **Confidence ratings**: An indicator showing Gemini's evaluation confidence.
   * **Scenario percentages**: Probability ratios comparing Bullish, Bearish, and Sideways price routes.
   * **Key levels**: Supports and resistances marked inside price tables.
   * **Action limits**: Risk rules showing stop levels and volatility factors.
6. Click **Printable TXT** or **CSV** to save raw summaries locally. Click the **Star** icon to mark the report as a favorite.

### 1.3 Setting Risk Sizing Parameters
1. Open the **Risk Calculator** view.
2. Enter your current total balance, entry trigger level, maximum risk threshold (e.g., 2%), and targeted profit boundaries.
3. Computes suggested contract purchase volumes, target payouts, and allocation ratios. Renders side-by-side risk-vs-reward bar graphs.

### 1.4 Managing Holdings & Watchlists
* **Portfolio**: Under the portfolio tab, record acquisition buy/sell transactions. It tracks overall equity values, dynamic profit/loss tallies, and logs transaction history.
* **Watchlist**: Add tickers to watchlists, append quick evaluation notes (e.g., "Retesting weekly dynamic support"), and add custom tags.

---

## 2. Admin Manual
*Accessible only by accounts with role permissions set to `admin`.*

### 2.1 Viewing Platform Analytics
1. Navigate to the **Admin Console** link in the side menu.
2. The dashboard displays registration counts, analyses triggered, and average confidence levels.

### 2.2 Security Audit Trails
* Scroll through the **Security Audit Ledger** to view log timestamps, IP addresses, and user actions (e.g. `USER_LOGIN`, `CHART_UPLOAD`, `PORTFOLIO_BUY`).

### 2.3 User Permissions
1. The **Account Authorizations** table displays all registered users.
2. Click **Disable** on any row to immediately block account access. Click **Enable** to restore access.
3. Adjust role dropdown selections to change user roles.
