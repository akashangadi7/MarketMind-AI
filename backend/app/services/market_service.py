import logging
import requests
import yfinance as yf
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# Mock fallback prices for demonstration purposes
MOCK_PRICES = {
    # Stocks
    "AAPL": 185.50,
    "MSFT": 420.25,
    "TSLA": 178.90,
    "NVDA": 875.12,
    "RELIANCE.NS": 2930.50,
    "INFY.NS": 1420.10,
    "TCS.NS": 3850.35,
    "HDFCBANK.NS": 1490.40,
    # Crypto
    "BTC": 64200.00,
    "ETH": 3500.00,
    "SOL": 145.25,
    "XRP": 0.48,
    "BNB": 575.80,
    "ADA": 0.38,
}

def get_live_price(symbol: str, asset_type: str = "stock") -> Optional[float]:
    """
    Fetches the live price of a stock (via yfinance) or crypto asset (via Binance or Coingecko API).
    Falls back to mock data if the API query fails or is throttled.
    """
    cleaned_symbol = symbol.strip().upper()
    
    if asset_type.lower() == "crypto":
        # Crypto symbols might be single ticker (BTC) or pair (BTCUSDT)
        pair = cleaned_symbol if cleaned_symbol.endswith("USDT") or cleaned_symbol.endswith("USD") else f"{cleaned_symbol}USDT"
        try:
            url = f"https://api.binance.com/api/v3/ticker/price?symbol={pair}"
            response = requests.get(url, timeout=3)
            if response.status_code == 200:
                data = response.json()
                return float(data["price"])
        except Exception as e:
            logger.warning(f"Failed to fetch live crypto price for {cleaned_symbol} from Binance: {e}")
            
        # Try Coingecko fallback if binance fails
        try:
            cg_symbol_map = {
                "BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana",
                "XRP": "ripple", "BNB": "binancecoin", "ADA": "cardano"
            }
            cg_id = cg_symbol_map.get(cleaned_symbol)
            if cg_id:
                url = f"https://api.coingecko.com/api/v3/simple/price?ids={cg_id}&vs_currencies=usd"
                response = requests.get(url, timeout=3)
                if response.status_code == 200:
                    data = response.json()
                    return float(data[cg_id]["usd"])
        except Exception as e:
             logger.warning(f"Failed to fetch live crypto price for {cleaned_symbol} from Coingecko: {e}")
    else:
        # Stock symbol processing (yfinance)
        try:
            ticker = yf.Ticker(cleaned_symbol)
            # Fetch current price from info or history
            price = ticker.info.get("currentPrice") or ticker.info.get("regularMarketPrice")
            if price is not None:
                return float(price)
            # Try history as fallback if info is empty
            hist = ticker.history(period="1d")
            if not hist.empty:
                return float(hist["Close"].iloc[-1])
        except Exception as e:
            logger.warning(f"Failed to fetch live stock price for {cleaned_symbol} from yfinance: {e}")

    # Fallback to mock price
    base_sym = cleaned_symbol.replace(".NS", "")
    fallback_val = MOCK_PRICES.get(base_sym) or MOCK_PRICES.get(cleaned_symbol)
    if fallback_val:
        logger.info(f"Using fallback price for {cleaned_symbol}: {fallback_val}")
        return fallback_val

    # Generic fallback
    logger.warning(f"No price found for {cleaned_symbol}. Returning mock default 100.0")
    return 100.0

def get_multiple_prices(assets: List[Dict[str, str]]) -> Dict[str, float]:
    """
    Given a list of assets (dicts with key 'symbol' and 'asset_type'), returns dictionary of prices.
    e.g. assets = [{'symbol': 'AAPL', 'asset_type': 'stock'}, {'symbol': 'BTC', 'asset_type': 'crypto'}]
    """
    prices = {}
    for asset in assets:
        sym = asset["symbol"]
        atype = asset.get("asset_type", "stock")
        prices[sym] = get_live_price(sym, atype)
    return prices
