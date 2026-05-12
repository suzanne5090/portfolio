from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import json
import logging
import uuid
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import asyncpg
import bcrypt
import jwt
import re
import requests
import resend
from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr

# ---------- Config ----------
DATABASE_URL = os.environ.get('DATABASE_URL')
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me')
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@example.com').lower()
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
OWNER_EMAIL = os.environ.get('OWNER_EMAIL', ADMIN_EMAIL)

resend.api_key = RESEND_API_KEY

logger = logging.getLogger(__name__)

# ---------- DB Pool ----------
pool: asyncpg.Pool = None

async def get_pool() -> asyncpg.Pool:
    return pool

# ---------- App ----------
app = FastAPI(title="Suzanne Cherian Portfolio API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------- Models ----------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class Profile(BaseModel):
    name: str = "Suzanne Cherian"
    title: str = "Graphic Designer | Illustrator"
    location: str = "Bangalore, India"
    available: bool = True
    profile_pic_url: str = ""
    tagline: str = "Crafting visual stories through design & illustration."
    bio: str = "I'm Suzanne — a Bangalore-based graphic designer & illustrator."
    email: str = ""
    instagram_url: str = ""
    behance_url: str = ""
    linkedin_url: str = ""
    cv_url: str = ""
    sketchbook_cover_url: str = ""
    sketchbook_cover_prompt: str = ""

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    description: str = ""
    order: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: str = ""
    order: int = 0

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category_id: str
    description: str = ""
    short_description: str = ""
    media_type: str = "image"
    media_url: str = ""
    behance_embed: str = ""
    thumbnail_url: str = ""
    tools: List[str] = []
    year: str = ""
    client: str = ""
    external_link: str = ""
    featured: bool = False
    show_in_book: bool = True
    order: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProjectCreate(BaseModel):
    title: str
    category_id: str
    description: str = ""
    short_description: str = ""
    media_type: str = "image"
    media_url: str = ""
    behance_embed: str = ""
    thumbnail_url: str = ""
    tools: List[str] = []
    year: str = ""
    client: str = ""
    external_link: str = ""
    featured: bool = False
    show_in_book: bool = True
    order: int = 0

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    category_id: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    media_type: Optional[str] = None
    media_url: Optional[str] = None
    behance_embed: Optional[str] = None
    thumbnail_url: Optional[str] = None
    tools: Optional[List[str]] = None
    year: Optional[str] = None
    client: Optional[str] = None
    external_link: Optional[str] = None
    featured: Optional[bool] = None
    show_in_book: Optional[bool] = None
    order: Optional[int] = None

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str = ""
    message: str

class ContactMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    subject: str = ""
    message: str
    read: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ---------- Auth helpers ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT id, email, name, role FROM users WHERE id=$1", payload["sub"])
    if not user or user["role"] != "admin":
        raise HTTPException(status_code=401, detail="User not found")
    return dict(user)


# ---------- DB helpers ----------
def _row_to_profile(row) -> Profile:
    d = dict(row)
    return Profile(**{k: (v if v is not None else "") for k, v in d.items() if k != "id"})

def _row_to_project(row) -> Project:
    d = dict(row)
    d["tools"] = json.loads(d.get("tools") or "[]")
    return Project(**d)

def _row_to_category(row) -> Category:
    return Category(**dict(row))

def _row_to_message(row) -> ContactMessage:
    return ContactMessage(**dict(row))


# ---------- Routes: Auth ----------
@api_router.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    email = payload.email.lower()
    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT * FROM users WHERE email=$1", email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"])
    return TokenResponse(
        access_token=token,
        user=UserOut(id=user["id"], email=user["email"], name=user["name"], role=user["role"]),
    )

@api_router.get("/auth/me", response_model=UserOut)
async def me(current=Depends(get_current_admin)):
    return UserOut(**current)


# ---------- Routes: Profile ----------
@api_router.get("/profile", response_model=Profile)
async def get_profile():
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM profile WHERE id='singleton'")
    if not row:
        default = Profile()
        async with pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO profile (id,name,title,location,available,profile_pic_url,tagline,bio,
                  email,instagram_url,behance_url,linkedin_url,cv_url,sketchbook_cover_url,sketchbook_cover_prompt)
                VALUES ('singleton',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
                ON CONFLICT (id) DO NOTHING
            """, default.name, default.title, default.location, default.available,
                default.profile_pic_url, default.tagline, default.bio, default.email,
                default.instagram_url, default.behance_url, default.linkedin_url,
                default.cv_url, default.sketchbook_cover_url, default.sketchbook_cover_prompt)
        return default
    return _row_to_profile(row)

@api_router.put("/profile", response_model=Profile)
async def update_profile(payload: Profile, _=Depends(get_current_admin)):
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO profile (id,name,title,location,available,profile_pic_url,tagline,bio,
              email,instagram_url,behance_url,linkedin_url,cv_url,sketchbook_cover_url,sketchbook_cover_prompt)
            VALUES ('singleton',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            ON CONFLICT (id) DO UPDATE SET
              name=$1,title=$2,location=$3,available=$4,profile_pic_url=$5,tagline=$6,bio=$7,
              email=$8,instagram_url=$9,behance_url=$10,linkedin_url=$11,cv_url=$12,
              sketchbook_cover_url=$13,sketchbook_cover_prompt=$14
        """, payload.name, payload.title, payload.location, payload.available,
            payload.profile_pic_url, payload.tagline, payload.bio, payload.email,
            payload.instagram_url, payload.behance_url, payload.linkedin_url,
            payload.cv_url, payload.sketchbook_cover_url, payload.sketchbook_cover_prompt)
    return payload


# ---------- Routes: Categories ----------
def _slugify(text: str) -> str:
    return "-".join("".join(c.lower() if c.isalnum() else " " for c in text).split())

@api_router.get("/categories", response_model=List[Category])
async def list_categories():
    async with pool.acquire() as conn:
        rows = await conn.fetch('SELECT * FROM categories ORDER BY "order" ASC')
    return [_row_to_category(r) for r in rows]

@api_router.post("/categories", response_model=Category)
async def create_category(payload: CategoryCreate, _=Depends(get_current_admin)):
    slug = payload.slug or _slugify(payload.name)
    cat = Category(name=payload.name, slug=slug, description=payload.description, order=payload.order)
    async with pool.acquire() as conn:
        await conn.execute(
            'INSERT INTO categories (id,name,slug,description,"order",created_at) VALUES ($1,$2,$3,$4,$5,$6)',
            cat.id, cat.name, cat.slug, cat.description, cat.order, cat.created_at
        )
    return cat

@api_router.put("/categories/{cat_id}", response_model=Category)
async def update_category(cat_id: str, payload: CategoryUpdate, _=Depends(get_current_admin)):
    async with pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT * FROM categories WHERE id=$1", cat_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Category not found")
        update = {k: v for k, v in payload.model_dump().items() if v is not None}
        if "name" in update and "slug" not in update:
            update["slug"] = _slugify(update["name"])
        merged = {**dict(existing), **update}
        await conn.execute(
            'UPDATE categories SET name=$1,slug=$2,description=$3,"order"=$4 WHERE id=$5',
            merged["name"], merged["slug"], merged["description"], merged["order"], cat_id
        )
    return Category(**merged)

@api_router.delete("/categories/{cat_id}")
async def delete_category(cat_id: str, _=Depends(get_current_admin)):
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM categories WHERE id=$1", cat_id)
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Category not found")
        await conn.execute("UPDATE projects SET category_id='' WHERE category_id=$1", cat_id)
    return {"ok": True}


# ---------- Routes: Projects ----------
def _extract_drive_id(url: str) -> Optional[str]:
    if not url:
        return None
    for pattern in (r"/file/d/([a-zA-Z0-9_-]{10,})", r"[?&]id=([a-zA-Z0-9_-]{10,})", r"/d/([a-zA-Z0-9_-]{10,})"):
        m = re.search(pattern, url)
        if m:
            return m.group(1)
    return None

def _extract_behance_id(text: str) -> Optional[str]:
    if not text:
        return None
    for pattern in (r"behance\.net/gallery/(\d{6,})", r"behance\.net/embed/project/(\d{6,})", r"behance\.net/embed/(\d{6,})"):
        m = re.search(pattern, text)
        if m:
            return m.group(1)
    return None

def _fetch_behance_thumbnail(project_id: str) -> str:
    try:
        url = f"https://www.behance.net/embed/project/{project_id}"
        r = requests.get(url, timeout=8, headers={"User-Agent": "Mozilla/5.0"})
        if r.status_code != 200:
            return ""
        candidates = re.findall(r"https://mir-s3-cdn-cf\.behance\.net/projects/[^\"'<>\s]+", r.text)
        if not candidates:
            return ""
        def score(u):
            if "max_808" in u: return 4
            if "/808" in u or "/810" in u: return 3
            if "/404" in u or "/400" in u: return 2
            if "/230" in u or "/202" in u: return 1
            return 0
        candidates.sort(key=score, reverse=True)
        return candidates[0]
    except Exception as e:
        logging.warning(f"Behance scrape failed for {project_id}: {e}")
    return ""

async def _auto_thumbnail(data: dict) -> str:
    if data.get("thumbnail_url"):
        return data["thumbnail_url"]
    media_type = data.get("media_type", "image")
    media_url = data.get("media_url", "") or ""
    behance_embed = data.get("behance_embed", "") or ""
    bid = _extract_behance_id(behance_embed) or _extract_behance_id(media_url)
    if bid:
        thumb = await asyncio.to_thread(_fetch_behance_thumbnail, bid)
        if thumb:
            return thumb
    drive_id = _extract_drive_id(media_url)
    if drive_id:
        return f"https://drive.google.com/thumbnail?id={drive_id}&sz=w2000"
    if media_type == "image" and media_url:
        return media_url
    return ""


@api_router.get("/projects", response_model=List[Project])
async def list_projects(category_id: Optional[str] = None):
    async with pool.acquire() as conn:
        if category_id:
            rows = await conn.fetch('SELECT * FROM projects WHERE category_id=$1 ORDER BY "order" ASC', category_id)
        else:
            rows = await conn.fetch('SELECT * FROM projects ORDER BY "order" ASC')
    return [_row_to_project(r) for r in rows]

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM projects WHERE id=$1", project_id)
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    return _row_to_project(row)

@api_router.post("/projects", response_model=Project)
async def create_project(payload: ProjectCreate, _=Depends(get_current_admin)):
    data = payload.model_dump()
    if not data.get("thumbnail_url"):
        data["thumbnail_url"] = await _auto_thumbnail(data)
    project = Project(**data)
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO projects (id,title,category_id,description,short_description,media_type,
              media_url,behance_embed,thumbnail_url,tools,year,client,external_link,
              featured,show_in_book,"order",created_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        """, project.id, project.title, project.category_id, project.description,
            project.short_description, project.media_type, project.media_url,
            project.behance_embed, project.thumbnail_url, json.dumps(project.tools),
            project.year, project.client, project.external_link, project.featured,
            project.show_in_book, project.order, project.created_at)
    return project

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, payload: ProjectUpdate, _=Depends(get_current_admin)):
    async with pool.acquire() as conn:
        existing_row = await conn.fetchrow("SELECT * FROM projects WHERE id=$1", project_id)
        if not existing_row:
            raise HTTPException(status_code=404, detail="Project not found")
        existing = _row_to_project(existing_row).model_dump()
        update = {k: v for k, v in payload.model_dump().items() if v is not None}
        merged = {**existing, **update}
        if not merged.get("thumbnail_url"):
            merged["thumbnail_url"] = await _auto_thumbnail(merged)
            update["thumbnail_url"] = merged["thumbnail_url"]
        await conn.execute("""
            UPDATE projects SET title=$1,category_id=$2,description=$3,short_description=$4,
              media_type=$5,media_url=$6,behance_embed=$7,thumbnail_url=$8,tools=$9,
              year=$10,client=$11,external_link=$12,featured=$13,show_in_book=$14,"order"=$15
            WHERE id=$16
        """, merged["title"], merged["category_id"], merged["description"],
            merged["short_description"], merged["media_type"], merged["media_url"],
            merged["behance_embed"], merged["thumbnail_url"], json.dumps(merged["tools"]),
            merged["year"], merged["client"], merged["external_link"], merged["featured"],
            merged["show_in_book"], merged["order"], project_id)
    return Project(**merged)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, _=Depends(get_current_admin)):
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM projects WHERE id=$1", project_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}


# ---------- Routes: Contact ----------
async def _send_email(to_email: str, subject: str, html: str):
    if not RESEND_API_KEY:
        logging.warning("RESEND_API_KEY not set — skipping email")
        return None
    params = {"from": SENDER_EMAIL, "to": [to_email], "subject": subject, "html": html}
    try:
        return await asyncio.to_thread(resend.Emails.send, params)
    except Exception as e:
        logging.error(f"Resend error: {e}")
        return None

@api_router.post("/contact", response_model=ContactMessage)
async def submit_contact(payload: ContactCreate):
    msg = ContactMessage(
        name=payload.name,
        email=payload.email,
        subject=payload.subject or "New portfolio inquiry",
        message=payload.message,
    )
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO contact_messages (id,name,email,subject,message,read,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)",
            msg.id, msg.name, msg.email, msg.subject, msg.message, msg.read, msg.created_at
        )
    html = f"""
    <table style="font-family: -apple-system, sans-serif; width: 100%; max-width: 560px;">
      <tr><td style="padding: 16px 0; border-bottom: 1px solid #E1E3E8;">
        <h2 style="margin:0; font-size: 20px; color:#0A0B10;">New portfolio inquiry</h2>
      </td></tr>
      <tr><td style="padding: 16px 0;">
        <p style="margin:0 0 8px 0;"><strong>From:</strong> {payload.name} &lt;{payload.email}&gt;</p>
        <p style="margin:0 0 8px 0;"><strong>Subject:</strong> {msg.subject}</p>
        <p style="margin:16px 0 0 0; white-space:pre-wrap;">{payload.message}</p>
      </td></tr>
    </table>
    """
    await _send_email(OWNER_EMAIL, f"[Portfolio] {msg.subject}", html)
    return msg

@api_router.get("/messages", response_model=List[ContactMessage])
async def list_messages(_=Depends(get_current_admin)):
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM contact_messages ORDER BY created_at DESC")
    return [_row_to_message(r) for r in rows]

@api_router.delete("/messages/{msg_id}")
async def delete_message(msg_id: str, _=Depends(get_current_admin)):
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM contact_messages WHERE id=$1", msg_id)
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Message not found")
    return {"ok": True}


# ---------- Health ----------
@api_router.get("/")
async def root():
    return {"message": "Suzanne Cherian Portfolio API", "status": "ok"}


# ---------- App wiring ----------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Startup / Shutdown ----------
@app.on_event("startup")
async def startup():
    global pool
    if not DATABASE_URL:
        logger.error("CRITICAL ERROR: DATABASE_URL environment variable is not set!")
        raise RuntimeError("DATABASE_URL is missing")

    try:
        # NeonDB requires SSL. We add it if not explicitly passed.
        # But asyncpg handles '?sslmode=require' poorly sometimes, so we can pass ssl='require' natively
        logger.info("Attempting to connect to the database...")
        # If url already has sslmode, we can just connect. But passing ssl='require' is safer for Neon.
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        pool = await asyncpg.create_pool(
            DATABASE_URL, 
            min_size=1, 
            max_size=5,
            ssl=ctx if "sslmode=require" not in DATABASE_URL else None
        )
        logger.info("Database connection pool created successfully.")

        async with pool.acquire() as conn:
            # Create tables
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                  id TEXT PRIMARY KEY,
                  email TEXT UNIQUE NOT NULL,
                  name TEXT NOT NULL,
                  role TEXT NOT NULL DEFAULT 'admin',
                  password_hash TEXT NOT NULL,
                  created_at TEXT NOT NULL
                )
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS profile (
                  id TEXT PRIMARY KEY DEFAULT 'singleton',
                  name TEXT, title TEXT, location TEXT, available BOOLEAN,
                  profile_pic_url TEXT, tagline TEXT, bio TEXT, email TEXT,
                  instagram_url TEXT, behance_url TEXT, linkedin_url TEXT,
                  cv_url TEXT, sketchbook_cover_url TEXT, sketchbook_cover_prompt TEXT
                )
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS categories (
                  id TEXT PRIMARY KEY,
                  name TEXT NOT NULL,
                  slug TEXT NOT NULL,
                  description TEXT DEFAULT '',
                  "order" INT DEFAULT 0,
                  created_at TEXT NOT NULL
                )
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS projects (
                  id TEXT PRIMARY KEY,
                  title TEXT NOT NULL,
                  category_id TEXT DEFAULT '',
                  description TEXT DEFAULT '',
                  short_description TEXT DEFAULT '',
                  media_type TEXT DEFAULT 'image',
                  media_url TEXT DEFAULT '',
                  behance_embed TEXT DEFAULT '',
                  thumbnail_url TEXT DEFAULT '',
                  tools TEXT DEFAULT '[]',
                  year TEXT DEFAULT '',
                  client TEXT DEFAULT '',
                  external_link TEXT DEFAULT '',

              featured BOOLEAN DEFAULT FALSE,
              show_in_book BOOLEAN DEFAULT TRUE,
              "order" INT DEFAULT 0,
              created_at TEXT NOT NULL
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS contact_messages (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              subject TEXT DEFAULT '',
              message TEXT NOT NULL,
              read BOOLEAN DEFAULT FALSE,
              created_at TEXT NOT NULL
            )
        """)

        # Seed admin
        existing = await conn.fetchrow("SELECT id, password_hash FROM users WHERE email=$1", ADMIN_EMAIL)
        if existing is None:
            await conn.execute(
                "INSERT INTO users (id,email,name,role,password_hash,created_at) VALUES ($1,$2,$3,$4,$5,$6)",
                str(uuid.uuid4()), ADMIN_EMAIL, "Suzanne Cherian", "admin",
                hash_password(ADMIN_PASSWORD), datetime.now(timezone.utc).isoformat()
            )
            logger.info(f"Admin seeded: {ADMIN_EMAIL}")
        else:
            if not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
                await conn.execute(
                    "UPDATE users SET password_hash=$1 WHERE email=$2",
                    hash_password(ADMIN_PASSWORD), ADMIN_EMAIL
                )
                logger.info("Admin password updated from env")

        # Seed profile
        prof_exists = await conn.fetchrow("SELECT id FROM profile WHERE id='singleton'")
        if not prof_exists:
            default = Profile(
                profile_pic_url="https://images.unsplash.com/photo-1571367032831-eabd75a52baf?crop=entropy&cs=srgb&fm=jpg&q=85",
                email=ADMIN_EMAIL,
                behance_url="https://www.behance.net/suzannecherian",
            )
            await conn.execute("""
                INSERT INTO profile (id,name,title,location,available,profile_pic_url,tagline,bio,
                  email,instagram_url,behance_url,linkedin_url,cv_url,sketchbook_cover_url,sketchbook_cover_prompt)
                VALUES ('singleton',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            """, default.name, default.title, default.location, default.available,
                default.profile_pic_url, default.tagline, default.bio, default.email,
                default.instagram_url, default.behance_url, default.linkedin_url,
                default.cv_url, default.sketchbook_cover_url, default.sketchbook_cover_prompt)

        # Seed default categories
        cat_count = await conn.fetchval("SELECT COUNT(*) FROM categories")
        if cat_count == 0:
            defaults = [
                ("Branding", 1), ("Illustration", 2), ("Web Design", 3), ("Editorial", 4)
            ]
            for name, order in defaults:
                cat = Category(name=name, slug=_slugify(name), order=order)
                await conn.execute(
                    'INSERT INTO categories (id,name,slug,description,"order",created_at) VALUES ($1,$2,$3,$4,$5,$6)',
                    cat.id, cat.name, cat.slug, cat.description, cat.order, cat.created_at
                )
    except Exception as e:
        logger.exception("CRITICAL: Failed to initialize database during startup")
        raise e


@app.on_event("shutdown")
async def shutdown():
    if pool:
        await pool.close()
