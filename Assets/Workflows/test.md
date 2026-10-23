# TEST.md — Industry-Standard Test Suite Agent

## Role

Act as a Senior QA Engineer and Test Architect. Your job is to write real, runnable tests for every function, service, repository, and endpoint in this project. Tests must execute against the actual code — not mocks of mocks. Every broken function must be reported by name with the exact failure reason. No fake green ticks. No placeholder tests. If it doesn't run, it doesn't count.

---

## When To Run This File

This file is triggered **after code-check.md completes** on a given step. The pipeline is:

```
CLAUDE.md builds Step N
      ↓
code-check.md — static review + fixes (AI reads code, finds issues, fixes them)
      ↓
TEST.md — writes real tests + runs them + reports results       ← YOU ARE HERE
      ↓
✅ Step N is truly complete. Say "next" to continue.
```

Do not run TEST.md before code-check.md has passed. Do not skip TEST.md. Every step that produces code gets tested before the next step begins.

---

## Agent Flow — MUST FOLLOW

### PHASE 0 — TEST PLAN (show before writing a single test)

Before writing any test code, output a test plan:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST PLAN — Step [N]: [Step Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stack:        [FastAPI/Python | Spring Boot/Java]
Test runner:  [pytest | JUnit 5 + Testcontainers]
Files to test:
  [list every source file produced in this step]

Test files to create:
  [list every test file that will be written]

Coverage target: 80% minimum on all new code

Test categories for this step:
  Unit tests:        [list functions/methods getting unit tests]
  Integration tests: [list endpoints/flows getting integration tests]
  Edge case tests:   [list critical edge cases to cover]
  Auth tests:        [list auth scenarios if auth code was produced]
  AI mock tests:     [list AI endpoints if AI code was produced]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Proceed to write tests? (auto-yes, continuing...)
```

Then write and run all tests.

---

## PHASE 1 — SETUP & INFRASTRUCTURE

### FastAPI — Test Infrastructure (write once, reuse across all steps)

**`tests/conftest.py`** — written at Step 1, never modified after:
```python
import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.core.database import get_db
from app.models.base import Base

# Use a separate test database — NEVER the dev/prod DB
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/testdb"

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Fresh DB state per test — full rollback after each test."""
    engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
        await session.rollback()  # ← hard rollback: every test starts clean

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    """HTTP test client with DB dependency overridden to use test DB."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def auth_headers(client):
    """Register + login a test user, return JWT auth headers."""
    await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "TestPassword123!"
    })
    res = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "TestPassword123!"
    })
    token = res.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest_asyncio.fixture
async def second_user_headers(client):
    """Second user for ownership/permission boundary tests."""
    await client.post("/api/v1/auth/register", json={
        "email": "other@example.com",
        "password": "OtherPassword123!"
    })
    res = await client.post("/api/v1/auth/login", json={
        "email": "other@example.com",
        "password": "OtherPassword123!"
    })
    token = res.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

**`pytest.ini`:**
```ini
[pytest]
asyncio_mode = auto
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short --strict-markers -p no:warnings
markers =
    unit: pure unit tests, no DB or HTTP
    integration: tests that hit DB or HTTP
    auth: authentication and authorization tests
    ai: tests for AI/LLM endpoints (uses mocks)
    slow: tests that take >1s
```

**`requirements-test.txt`:**
```
pytest==8.2.0
pytest-asyncio==0.23.7
pytest-cov==5.0.0
httpx==0.27.0
factory-boy==3.3.0
faker==25.0.0
respx==0.21.1          # mock external HTTP (AI provider calls)
freezegun==1.5.1       # freeze time for JWT expiry tests
```

---

### Spring Boot — Test Infrastructure (write once, reuse across all steps)

**`pom.xml` test dependencies:**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <version>1.19.8</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>1.19.8</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
```

**`src/test/java/com/project/BaseIntegrationTest.java`:**
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@Transactional  // ← rollback after every test automatically
public abstract class BaseIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    protected String toJson(Object obj) throws Exception {
        return objectMapper.writeValueAsString(obj);
    }
}
```

---

## PHASE 2 — WHAT TO TEST (MANDATORY COVERAGE PER LAYER)

### Layer 1 — Repository Tests (unit + DB)

Test every repository method. Each test must:
- Use the real DB (test DB, rolled back after)
- Verify the actual DB state after the operation, not just return values

```python
# FastAPI example — tests/test_user_repository.py
import pytest
from app.repositories.user_repository import UserRepository
from app.models.user import User

pytestmark = pytest.mark.integration

class TestUserRepository:

    async def test_create_user_persists_to_db(self, db_session):
        repo = UserRepository(db_session)
        user = await repo.create(email="test@x.com", hashed_password="hashed")
        assert user.id is not None
        assert user.email == "test@x.com"
        # Verify it's actually in the DB — not just in memory
        fetched = await repo.get_by_id(user.id)
        assert fetched is not None
        assert fetched.email == "test@x.com"

    async def test_get_by_email_returns_none_for_missing(self, db_session):
        repo = UserRepository(db_session)
        result = await repo.get_by_email("nobody@nowhere.com")
        assert result is None  # must return None, not raise

    async def test_soft_delete_sets_is_deleted_flag(self, db_session):
        repo = UserRepository(db_session)
        user = await repo.create(email="del@x.com", hashed_password="h")
        await repo.soft_delete(user.id)
        fetched = await repo.get_by_id(user.id)
        assert fetched.is_deleted is True
        assert fetched.deleted_at is not None

    async def test_duplicate_email_raises_integrity_error(self, db_session):
        repo = UserRepository(db_session)
        await repo.create(email="dup@x.com", hashed_password="h")
        with pytest.raises(Exception):  # IntegrityError or custom DuplicateError
            await repo.create(email="dup@x.com", hashed_password="h")

    async def test_list_returns_paginated_results(self, db_session):
        repo = UserRepository(db_session)
        for i in range(5):
            await repo.create(email=f"user{i}@x.com", hashed_password="h")
        result = await repo.list(page=1, per_page=3)
        assert len(result.items) == 3
        assert result.total == 5
        assert result.pages == 2
```

---

### Layer 2 — Service Tests (pure unit, mock the repository)

Services contain business logic. Test the logic in isolation — mock the DB layer.

```python
# FastAPI example — tests/test_user_service.py
import pytest
from unittest.mock import AsyncMock, patch
from app.services.user_service import UserService
from app.exceptions import DuplicateEmailError, UserNotFoundError

pytestmark = pytest.mark.unit

class TestUserService:

    async def test_register_hashes_password_before_storing(self):
        mock_repo = AsyncMock()
        mock_repo.get_by_email.return_value = None
        mock_repo.create.return_value = AsyncMock(id=1, email="a@b.com")

        service = UserService(mock_repo)
        await service.register("a@b.com", "plaintext_password")

        call_args = mock_repo.create.call_args
        stored_hash = call_args.kwargs["hashed_password"]
        assert stored_hash != "plaintext_password"        # must not store plain
        assert stored_hash.startswith("$2b$")            # must be bcrypt

    async def test_register_raises_on_duplicate_email(self):
        mock_repo = AsyncMock()
        mock_repo.get_by_email.return_value = AsyncMock(id=1)  # user exists

        service = UserService(mock_repo)
        with pytest.raises(DuplicateEmailError):
            await service.register("taken@b.com", "password")

    async def test_login_raises_on_wrong_password(self):
        from app.core.security import get_password_hash
        mock_repo = AsyncMock()
        mock_repo.get_by_email.return_value = AsyncMock(
            hashed_password=get_password_hash("correct_password"),
            is_active=True
        )
        service = UserService(mock_repo)
        with pytest.raises(Exception):  # InvalidCredentialsError
            await service.login("a@b.com", "wrong_password")

    async def test_get_user_raises_404_for_missing_id(self):
        mock_repo = AsyncMock()
        mock_repo.get_by_id.return_value = None

        service = UserService(mock_repo)
        with pytest.raises(UserNotFoundError):
            await service.get_by_id(99999)
```

---

### Layer 3 — Router / Endpoint Tests (full HTTP integration)

These are the most important tests. Hit real endpoints, check real HTTP responses. Every endpoint gets tested for all cases.

**Mandatory test matrix for EVERY endpoint:**

| Test | What it checks |
|---|---|
| `test_[action]_success` | Happy path — correct input → correct response shape + status code |
| `test_[action]_unauthenticated` | No token → 401 |
| `test_[action]_unauthorized` | Wrong user's resource → 403 |
| `test_[action]_not_found` | Non-existent ID → 404 |
| `test_[action]_invalid_input` | Bad request body → 422 |
| `test_[action]_duplicate` | Duplicate unique field → 409 (where applicable) |

```python
# FastAPI example — tests/test_auth_router.py
import pytest
from freezegun import freeze_time

pytestmark = pytest.mark.auth

class TestAuthRegister:

    async def test_register_success_returns_201(self, client):
        res = await client.post("/api/v1/auth/register", json={
            "email": "new@x.com", "password": "StrongPass123!"
        })
        assert res.status_code == 201
        body = res.json()
        assert body["success"] is True
        assert "id" in body["data"]
        assert "password" not in body["data"]           # never expose password
        assert "hashed_password" not in body["data"]    # never expose hash

    async def test_register_duplicate_email_returns_409(self, client):
        payload = {"email": "dup@x.com", "password": "Pass123!"}
        await client.post("/api/v1/auth/register", json=payload)
        res = await client.post("/api/v1/auth/register", json=payload)
        assert res.status_code == 409

    async def test_register_invalid_email_returns_422(self, client):
        res = await client.post("/api/v1/auth/register", json={
            "email": "not-an-email", "password": "Pass123!"
        })
        assert res.status_code == 422

    async def test_register_weak_password_returns_422(self, client):
        res = await client.post("/api/v1/auth/register", json={
            "email": "a@b.com", "password": "123"
        })
        assert res.status_code == 422

class TestAuthLogin:

    async def test_login_success_returns_both_tokens(self, client):
        await client.post("/api/v1/auth/register", json={
            "email": "u@x.com", "password": "Pass123!"
        })
        res = await client.post("/api/v1/auth/login", json={
            "email": "u@x.com", "password": "Pass123!"
        })
        assert res.status_code == 200
        data = res.json()["data"]
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password_returns_401(self, client):
        await client.post("/api/v1/auth/register", json={
            "email": "u2@x.com", "password": "Pass123!"
        })
        res = await client.post("/api/v1/auth/login", json={
            "email": "u2@x.com", "password": "WrongPass!"
        })
        assert res.status_code == 401
        # Must NOT expose whether user exists or password was wrong
        assert "password" not in res.json().get("message", "").lower()

    async def test_login_nonexistent_user_returns_401(self, client):
        res = await client.post("/api/v1/auth/login", json={
            "email": "ghost@x.com", "password": "Pass123!"
        })
        assert res.status_code == 401

class TestAuthRefresh:

    async def test_refresh_issues_new_access_token(self, client):
        await client.post("/api/v1/auth/register", json={
            "email": "r@x.com", "password": "Pass123!"
        })
        login = await client.post("/api/v1/auth/login", json={
            "email": "r@x.com", "password": "Pass123!"
        })
        old_access = login.json()["data"]["access_token"]
        refresh = login.json()["data"]["refresh_token"]

        res = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh
        })
        assert res.status_code == 200
        new_access = res.json()["data"]["access_token"]
        assert new_access != old_access  # must issue NEW token

    async def test_expired_refresh_token_returns_401(self, client):
        with freeze_time("2020-01-01"):
            await client.post("/api/v1/auth/register", json={
                "email": "exp@x.com", "password": "Pass123!"
            })
            login = await client.post("/api/v1/auth/login", json={
                "email": "exp@x.com", "password": "Pass123!"
            })
            refresh = login.json()["data"]["refresh_token"]

        # 8 days later — refresh token has expired (7 day TTL)
        with freeze_time("2020-01-09"):
            res = await client.post("/api/v1/auth/refresh", json={
                "refresh_token": refresh
            })
            assert res.status_code == 401

class TestProtectedRoutes:

    async def test_protected_endpoint_without_token_returns_401(self, client):
        res = await client.get("/api/v1/auth/me")
        assert res.status_code == 401

    async def test_protected_endpoint_with_invalid_token_returns_401(self, client):
        res = await client.get("/api/v1/auth/me", headers={
            "Authorization": "Bearer fake.token.here"
        })
        assert res.status_code == 401

    async def test_me_returns_current_user(self, client, auth_headers):
        res = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["data"]["email"] == "test@example.com"
```

```python
# Generic CRUD endpoint tests — tests/test_[entity]_router.py
class TestEntityCRUD:

    async def test_create_success(self, client, auth_headers):
        res = await client.post("/api/v1/[entity]/", json={...valid payload...},
                                headers=auth_headers)
        assert res.status_code == 201
        assert res.json()["success"] is True
        assert res.json()["data"]["id"] is not None

    async def test_create_unauthenticated_returns_401(self, client):
        res = await client.post("/api/v1/[entity]/", json={...valid payload...})
        assert res.status_code == 401

    async def test_get_list_is_paginated(self, client, auth_headers):
        # Create 5 items
        for i in range(5):
            await client.post("/api/v1/[entity]/", json={...}, headers=auth_headers)
        res = await client.get("/api/v1/[entity]/?page=1&per_page=3", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()["data"]
        assert len(data["items"]) == 3
        assert data["total"] == 5
        assert data["pages"] == 2

    async def test_get_by_id_not_found_returns_404(self, client, auth_headers):
        res = await client.get("/api/v1/[entity]/99999", headers=auth_headers)
        assert res.status_code == 404

    async def test_update_other_users_resource_returns_403(self, client, auth_headers, second_user_headers):
        create = await client.post("/api/v1/[entity]/", json={...}, headers=auth_headers)
        entity_id = create.json()["data"]["id"]
        res = await client.patch(f"/api/v1/[entity]/{entity_id}",
                                 json={...}, headers=second_user_headers)
        assert res.status_code == 403

    async def test_delete_soft_deletes_not_hard_deletes(self, client, auth_headers, db_session):
        create = await client.post("/api/v1/[entity]/", json={...}, headers=auth_headers)
        entity_id = create.json()["data"]["id"]
        await client.delete(f"/api/v1/[entity]/{entity_id}", headers=auth_headers)

        # Verify it's soft deleted — still in DB with is_deleted=True
        from app.repositories.[entity]_repository import EntityRepository
        repo = EntityRepository(db_session)
        entity = await repo.get_by_id_including_deleted(entity_id)
        assert entity is not None
        assert entity.is_deleted is True
```

---

### Layer 4 — AI Endpoint Tests (always mock the provider)

Never make real AI API calls in tests. Use `respx` (FastAPI) or `@MockBean` (Spring Boot) to mock provider responses. Tests must verify the logic around the AI call, not the AI itself.

```python
# tests/test_ai_router.py
import pytest
import respx
import httpx

pytestmark = pytest.mark.ai

MOCK_OPENAI_RESPONSE = {
    "choices": [{"message": {"content": "Mocked AI response"}, "finish_reason": "stop"}],
    "usage": {"total_tokens": 42}
}

class TestAIChat:

    @respx.mock
    async def test_chat_returns_ai_response(self, client, auth_headers):
        respx.post("https://api.openai.com/v1/chat/completions").mock(
            return_value=httpx.Response(200, json=MOCK_OPENAI_RESPONSE)
        )
        res = await client.post("/api/v1/ai/chat", json={
            "message": "Hello", "session_id": "test-session"
        }, headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["data"]["reply"] == "Mocked AI response"

    @respx.mock
    async def test_chat_saves_message_to_db(self, client, auth_headers, db_session):
        respx.post("https://api.openai.com/v1/chat/completions").mock(
            return_value=httpx.Response(200, json=MOCK_OPENAI_RESPONSE)
        )
        await client.post("/api/v1/ai/chat", json={
            "message": "Hello", "session_id": "test-session"
        }, headers=auth_headers)

        # Verify both user message and assistant reply were persisted
        from app.repositories.chat_repository import ChatRepository
        repo = ChatRepository(db_session)
        messages = await repo.get_messages("test-session")
        assert len(messages) == 2
        assert messages[0].role == "user"
        assert messages[1].role == "assistant"
        assert messages[1].tokens_used == 42

    @respx.mock
    async def test_chat_unauthenticated_returns_401(self, client):
        res = await client.post("/api/v1/ai/chat", json={
            "message": "Hello", "session_id": "s"
        })
        assert res.status_code == 401

    @respx.mock
    async def test_chat_handles_provider_failure_gracefully(self, client, auth_headers):
        respx.post("https://api.openai.com/v1/chat/completions").mock(
            return_value=httpx.Response(500, json={"error": "provider down"})
        )
        res = await client.post("/api/v1/ai/chat", json={
            "message": "Hello", "session_id": "s"
        }, headers=auth_headers)
        # Must return a clean error, never a 500 with internal details
        assert res.status_code in [503, 502]
        assert "openai" not in res.text.lower()  # never expose provider name in error
        assert "api key" not in res.text.lower()  # never expose key info
```

---

## PHASE 3 — RUN TESTS + REPORT RESULTS

After writing all test files, run the full suite and report results using this exact format.

### Run Commands

**FastAPI:**
```bash
# Run all tests with coverage
pytest tests/ -v --cov=app --cov-report=term-missing --cov-fail-under=80

# Run by category
pytest tests/ -m unit -v
pytest tests/ -m integration -v
pytest tests/ -m auth -v
pytest tests/ -m ai -v

# Run a single file
pytest tests/test_auth_router.py -v
```

**Spring Boot:**
```bash
# Run all tests
mvn test -Dspring.profiles.active=test

# Run with coverage (JaCoCo)
mvn verify -Dspring.profiles.active=test

# Run a single test class
mvn test -Dtest=AuthControllerTest -Dspring.profiles.active=test
```

---

### PHASE 3 — Results Report Format

After running, output this report. Never skip it. Never fake it.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST RESULTS — Step [N]: [Step Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY
  Total tests run:    [N]
  ✅ Passed:          [N]
  ❌ Failed:          [N]
  ⚠️  Warnings:       [N]
  ⏭️  Skipped:        [N]
  Duration:           [Xs]

COVERAGE
  Overall:            [N]%  [PASS ≥80% | FAIL <80%]
  app/routers/:       [N]%
  app/services/:      [N]%
  app/repositories/:  [N]%
  app/ai/:            [N]%  (if applicable)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PASSED TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ test_register_success_returns_201
✅ test_register_duplicate_email_returns_409
✅ test_login_success_returns_both_tokens
... (list every passing test by name)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FAILED TESTS (if any)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ test_refresh_issues_new_access_token
   File:     tests/test_auth_router.py::TestAuthRefresh::test_refresh_issues_new_access_token
   Function: POST /api/v1/auth/refresh
   Error:    AssertionError: assert 'eyJhb...' != 'eyJhb...'  (tokens are identical)
   Root cause: refresh_token endpoint is returning the SAME access token instead of
               issuing a new one. Token rotation is not implemented in auth_service.py.
   Fix needed: In AuthService.refresh(), generate a new access token before
               invalidating the old refresh token.
               File: app/services/auth_service.py, line ~47

❌ test_update_other_users_resource_returns_403
   File:     tests/test_post_router.py::TestPostCRUD::test_update_other_users_resource_returns_403
   Function: PATCH /api/v1/posts/{id}
   Error:    assert 200 == 403  (endpoint returned 200 instead of 403)
   Root cause: PostService.update() does not check if current_user.id == post.user_id
               before performing the update. Any authenticated user can edit any post.
   Fix needed: Add ownership check in PostService.update() before calling repository.
               File: app/services/post_service.py, line ~31

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UNCOVERED CODE (lines with no test coverage)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app/services/auth_service.py    lines 89-94   (logout when token already expired)
app/repositories/user_repo.py   lines 41-43   (bulk delete — no test exists)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERDICT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 2 tests FAILED — Step [N] is NOT complete.

Fixing failures now...
[apply fixes]
Re-running failed tests...
✅ test_refresh_issues_new_access_token  PASSED
✅ test_update_other_users_resource_returns_403  PASSED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL VERDICT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 All [N] tests PASSING. Coverage: [N]%. Step [N] is complete.

Say "next" to continue to Step [N+1].
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Failure Protocol — Non-Negotiable Rules

**Rule 1 — Never fake a pass.**
If a test fails, do not move to the next step. Fix the source code, re-run the test, confirm it passes. Then continue.

**Rule 2 — Every failure gets a root cause.**
Never say "the test failed." Always say:
- Which function is broken
- Which line in which file
- Why the logic is wrong
- What the fix is

**Rule 3 — Coverage below 80% blocks the step.**
If coverage is below 80% for any new file, write additional tests until it passes. Do not skip.

**Rule 4 — Fix source code, not tests.**
If a test catches a real bug, fix the source code. Never delete or weaken a test to make it pass.

**Rule 5 — Security tests are not optional.**
Every auth endpoint gets the full 401/403 matrix. No exceptions.

---

## Test Naming Convention

```
test_[action]_[condition]_[expected_result]

✅ test_register_duplicate_email_returns_409
✅ test_login_wrong_password_returns_401
✅ test_get_post_by_id_not_found_returns_404
✅ test_update_other_users_post_returns_403
✅ test_create_post_unauthenticated_returns_401
✅ test_chat_provider_failure_returns_503
✅ test_refresh_expired_token_returns_401

❌ test_login           (too vague — what scenario? what outcome?)
❌ test_user_service    (too vague — what function?)
❌ test_it_works        (meaningless)
```

---

## What Gets Tested Per Step

```
Step 1  (scaffold)          → No code tests. Verify docker-compose.yml syntax only.
Step 2  (models)            → Test model field types, constraints, relationships, defaults
Step 3  (repositories)      → Full CRUD + pagination + soft delete + duplicate handling
Step 4  (services)          → Unit tests with mocked repos — business logic only
Step 5  (auth flow)         → Full auth test matrix (register, login, refresh, logout, me)
Step 6  (domain routers)    → Full CRUD matrix per entity (happy + 401 + 403 + 404 + 422)
Step 7  (AI endpoints)      → Mocked provider tests + message persistence + error handling
Step 8  (background tasks)  → Task enqueue test + mock task execution result
Step 9  (frontend)          → Skip (no backend logic — covered by browser testing)
Step 10 (test scaffold)     → Final coverage report across entire project
Step 11 (README)            → No tests
```

---

## Quick Reference — What A Broken Function Report Looks Like

```
❌ FUNCTION BROKEN: AuthService.refresh_token()
   File:       app/services/auth_service.py
   Line:       47
   Called by:  POST /api/v1/auth/refresh
   Symptom:    Returns the same access token on every refresh call
   Root cause: Token is generated BEFORE the old refresh token is looked up.
               The creation timestamp is identical so the JWT payload is identical.
   Fix:
     # BEFORE (broken)
     new_token = create_access_token({"sub": str(user_id)})
     old_refresh = await repo.get_refresh_token(token)  # ← too late

     # AFTER (fixed)
     old_refresh = await repo.get_refresh_token(token)  # ← look up first
     if not old_refresh or old_refresh.expires_at < datetime.utcnow():
         raise InvalidTokenError()
     await repo.invalidate_refresh_token(old_refresh.id)
     new_token = create_access_token({"sub": str(user_id)})  # ← then generate
```

---

## What This File Is NOT For

- Load testing / performance testing → use Locust or k6 separately
- End-to-end browser testing → use Playwright or Cypress separately
- Contract testing between services → use Pact separately
- Testing the AI provider itself → never test external APIs, only your code around them
