from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_calculator_success():
    payload = {
        "available_capital": 10000.0,
        "entry_price": 100.0,
        "stop_loss": 95.0,
        "target_price": 115.0,
        "max_risk_pct": 2.0  # Risk 2% of $10000 = $200
    }
    # Price difference is $5.0. Position units = 200 / 5 = 40.
    # Capital allocation = 40 * $100 = $4000 (40% of capital)
    # Expected profit = 40 * ($115 - $100) = $600
    # Risk Reward = (115 - 100) / (100 - 95) = 15 / 5 = 3.0
    
    response = client.post("/api/v1/calculator", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["position_size"] == 40.0
    assert data["max_loss"] == 200.0
    assert data["expected_profit"] == 600.0
    assert data["risk_reward_ratio"] == 3.0
    assert data["capital_allocation_pct"] == 40.0

def test_calculator_invalid_parameters():
    # Negative entry price
    payload = {
        "available_capital": 10000.0,
        "entry_price": -100.0,
        "stop_loss": 95.0,
        "target_price": 115.0,
        "max_risk_pct": 2.0
    }
    response = client.post("/api/v1/calculator", json=payload)
    assert response.status_code == 400
    assert "greater than zero" in response.json()["detail"]

    # Identical stop and entry
    payload = {
        "available_capital": 10000.0,
        "entry_price": 100.0,
        "stop_loss": 100.0,
        "target_price": 115.0,
        "max_risk_pct": 2.0
    }
    response = client.post("/api/v1/calculator", json=payload)
    assert response.status_code == 400
    assert "identical" in response.json()["detail"]

    # Risk out of bounds
    payload = {
        "available_capital": 10000.0,
        "entry_price": 100.0,
        "stop_loss": 95.0,
        "target_price": 115.0,
        "max_risk_pct": 150.0
    }
    response = client.post("/api/v1/calculator", json=payload)
    assert response.status_code == 400
    assert "between 0% and 100%" in response.json()["detail"]
