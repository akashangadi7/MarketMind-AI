from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db

# isolated testing database setup (in-memory SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Recreate testing tables cleanly
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_auth_flow():
    # 1. Register a test user
    register_payload = {
        "email": "testuser@marketmind.ai",
        "password": "strongpassword123",
        "role": "retail"
    }
    response = client.post("/api/v1/auth/register", json=register_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testuser@marketmind.ai"
    assert data["role"] == "retail"
    assert "id" in data

    # 2. Prevent duplicate email registration
    response = client.post("/api/v1/auth/register", json=register_payload)
    assert response.status_code == 400
    assert "exists" in response.json()["detail"]

    # 3. Log in to acquire JWT token
    login_data = {
        "username": "testuser@marketmind.ai",
        "password": "strongpassword123"
    }
    response = client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["role"] == "retail"
    
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Get active profile me endpoint
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    me_data = response.json()
    assert me_data["email"] == "testuser@marketmind.ai"
    assert me_data["role"] == "retail"
    
    # 5. Accessing protected endpoint without headers fails
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
