"""
Backend API tests for Suzanne Cherian Portfolio.
Covers: auth, profile, categories CRUD, projects CRUD, contact + messages, _id exclusion.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://design-showcase-1001.preview.emergentagent.com').rstrip('/')
ADMIN_EMAIL = "suzanne@portfolio.com"
ADMIN_PASSWORD = "Suzanne@2026"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def token(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------- Health / root ----------
class TestHealth:
    def test_api_root(self, api):
        r = api.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert d["token_type"] == "bearer"
        assert d["user"]["email"] == ADMIN_EMAIL
        assert d["user"]["role"] == "admin"
        assert isinstance(d["access_token"], str) and len(d["access_token"]) > 20

    def test_login_invalid_password(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": "wrong-pass"})
        assert r.status_code == 401

    def test_login_unknown_user(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": "nobody@example.com", "password": "x"})
        assert r.status_code == 401

    def test_me_with_token(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == ADMIN_EMAIL
        assert d["role"] == "admin"

    def test_me_without_token_unauthorized(self, api):
        # Use a fresh session w/o the default Authorization header
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_me_with_invalid_token(self, api):
        r = requests.get(f"{BASE_URL}/api/auth/me",
                         headers={"Authorization": "Bearer not-a-real-token"})
        assert r.status_code == 401


# ---------- Profile ----------
class TestProfile:
    def test_get_profile_public(self, api):
        r = api.get(f"{BASE_URL}/api/profile")
        assert r.status_code == 200
        d = r.json()
        assert "_id" not in d
        assert d["name"]
        assert d["title"]

    def test_update_profile_requires_auth(self, api):
        r = requests.put(f"{BASE_URL}/api/profile", json={"name": "X"})
        assert r.status_code in (401, 422)

    def test_update_profile_and_verify(self, api, auth_headers):
        # Pull current profile, mutate one field, send full payload
        cur = api.get(f"{BASE_URL}/api/profile").json()
        cur["tagline"] = "TEST_tagline_updated"
        cur["profile_pic_url"] = cur.get("profile_pic_url") or "https://example.com/pic.jpg"
        r = requests.put(f"{BASE_URL}/api/profile", headers=auth_headers, json=cur)
        assert r.status_code == 200, r.text
        assert r.json()["tagline"] == "TEST_tagline_updated"
        # GET to verify persistence
        verify = api.get(f"{BASE_URL}/api/profile").json()
        assert verify["tagline"] == "TEST_tagline_updated"
        assert "_id" not in verify


# ---------- Categories ----------
class TestCategories:
    created_id = None

    def test_list_categories_public(self, api):
        r = api.get(f"{BASE_URL}/api/categories")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        for c in data:
            assert "_id" not in c
            assert "id" in c and "name" in c and "slug" in c

    def test_create_category_unauthorized(self, api):
        r = requests.post(f"{BASE_URL}/api/categories", json={"name": "TEST_NoAuth"})
        assert r.status_code == 401

    def test_create_update_delete_category(self, api, auth_headers):
        # CREATE
        r = requests.post(f"{BASE_URL}/api/categories", headers=auth_headers,
                          json={"name": "TEST_Photography", "description": "test", "order": 99})
        assert r.status_code == 200, r.text
        cat = r.json()
        assert cat["name"] == "TEST_Photography"
        assert cat["slug"] == "test-photography"
        cat_id = cat["id"]
        TestCategories.created_id = cat_id

        # Verify in list
        lst = api.get(f"{BASE_URL}/api/categories").json()
        assert any(c["id"] == cat_id for c in lst)

        # UPDATE
        r = requests.put(f"{BASE_URL}/api/categories/{cat_id}", headers=auth_headers,
                         json={"name": "TEST_Photo_Updated"})
        assert r.status_code == 200, r.text
        assert r.json()["name"] == "TEST_Photo_Updated"
        assert r.json()["slug"] == "test-photo-updated"

        # DELETE
        r = requests.delete(f"{BASE_URL}/api/categories/{cat_id}", headers=auth_headers)
        assert r.status_code == 200

        # Confirm 404 on next delete
        r = requests.delete(f"{BASE_URL}/api/categories/{cat_id}", headers=auth_headers)
        assert r.status_code == 404


# ---------- Projects ----------
class TestProjects:
    project_id = None
    cat_id = None

    def test_setup_category(self, api, auth_headers):
        r = requests.post(f"{BASE_URL}/api/categories", headers=auth_headers,
                          json={"name": "TEST_ProjCat", "order": 50})
        assert r.status_code == 200
        TestProjects.cat_id = r.json()["id"]

    def test_create_project_unauthorized(self, api):
        r = requests.post(f"{BASE_URL}/api/projects",
                          json={"title": "x", "category_id": "abc"})
        assert r.status_code == 401

    def test_create_project(self, api, auth_headers):
        assert TestProjects.cat_id
        payload = {
            "title": "TEST_Project_One",
            "category_id": TestProjects.cat_id,
            "description": "A test project",
            "short_description": "short",
            "media_type": "behance",
            "behance_embed": '<iframe src="https://www.behance.net/embed/project/123"></iframe>',
            "thumbnail_url": "https://example.com/thumb.jpg",
            "tools": ["Photoshop", "Illustrator"],
            "year": "2026",
            "featured": True,
            "order": 1,
        }
        r = requests.post(f"{BASE_URL}/api/projects", headers=auth_headers, json=payload)
        assert r.status_code == 200, r.text
        p = r.json()
        assert p["title"] == payload["title"]
        assert p["media_type"] == "behance"
        assert "_id" not in p
        TestProjects.project_id = p["id"]

    def test_list_projects_public(self, api):
        r = api.get(f"{BASE_URL}/api/projects")
        assert r.status_code == 200
        data = r.json()
        assert any(p["id"] == TestProjects.project_id for p in data)
        for p in data:
            assert "_id" not in p

    def test_filter_projects_by_category(self, api):
        r = api.get(f"{BASE_URL}/api/projects?category_id={TestProjects.cat_id}")
        assert r.status_code == 200
        data = r.json()
        assert all(p["category_id"] == TestProjects.cat_id for p in data)

    def test_get_project(self, api):
        r = api.get(f"{BASE_URL}/api/projects/{TestProjects.project_id}")
        assert r.status_code == 200
        assert r.json()["id"] == TestProjects.project_id

    def test_update_project(self, api, auth_headers):
        r = requests.put(f"{BASE_URL}/api/projects/{TestProjects.project_id}",
                         headers=auth_headers,
                         json={"title": "TEST_Project_Updated", "featured": False})
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_Project_Updated"
        assert r.json()["featured"] is False
        # Verify persistence
        v = api.get(f"{BASE_URL}/api/projects/{TestProjects.project_id}").json()
        assert v["title"] == "TEST_Project_Updated"

    def test_delete_category_unsets_projects(self, api, auth_headers):
        # Delete the category and verify project's category_id is cleared
        r = requests.delete(f"{BASE_URL}/api/categories/{TestProjects.cat_id}",
                            headers=auth_headers)
        assert r.status_code == 200
        v = api.get(f"{BASE_URL}/api/projects/{TestProjects.project_id}").json()
        assert v["category_id"] == ""

    def test_delete_project(self, api, auth_headers):
        r = requests.delete(f"{BASE_URL}/api/projects/{TestProjects.project_id}",
                            headers=auth_headers)
        assert r.status_code == 200
        # 404 on second delete
        r = requests.delete(f"{BASE_URL}/api/projects/{TestProjects.project_id}",
                            headers=auth_headers)
        assert r.status_code == 404


# ---------- Contact ----------
class TestContact:
    msg_id = None

    def test_submit_contact_public(self, api):
        r = api.post(f"{BASE_URL}/api/contact", json={
            "name": "TEST_Sender",
            "email": "test@example.com",
            "subject": "TEST subject",
            "message": "Hello from test",
        })
        # Resend may soft-fail but endpoint should still succeed
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == "TEST_Sender"
        assert "_id" not in d
        TestContact.msg_id = d["id"]

    def test_list_messages_requires_auth(self, api):
        r = requests.get(f"{BASE_URL}/api/messages")
        assert r.status_code == 401

    def test_list_messages_admin(self, api, auth_headers):
        r = requests.get(f"{BASE_URL}/api/messages", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert any(m["id"] == TestContact.msg_id for m in data)
        for m in data:
            assert "_id" not in m

    def test_delete_message(self, api, auth_headers):
        r = requests.delete(f"{BASE_URL}/api/messages/{TestContact.msg_id}",
                            headers=auth_headers)
        assert r.status_code == 200
        # 404 second time
        r = requests.delete(f"{BASE_URL}/api/messages/{TestContact.msg_id}",
                            headers=auth_headers)
        assert r.status_code == 404
