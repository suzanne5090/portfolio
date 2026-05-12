from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
import resend
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ---------- Config ----------
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me')
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@example.com').lower()
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
OWNER_EMAIL = os.environ.get('OWNER_EMAIL', ADMIN_EMAIL)

resend.api_key = RESEND_API_KEY

# ---------- DB ----------
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ---------- App ----------
app = FastAPI(title="Suzanne Cherian Portfolio API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

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
    bio: str = "I'm Suzanne — a Bangalore-based graphic designer & illustrator. I help brands find their voice through bold typography, expressive illustrations, and editorial-grade layouts."
    email: str = ""
    instagram_url: str = ""
    behance_url: str = ""
    linkedin_url: str = ""
    cv_url: str = ""

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
    media_type: str = "image"  # image | video | behance | iframe
    media_url: str = ""        # google drive / image link / behance project URL
    behance_embed: str = ""    # full <iframe ...> snippet (optional)
    thumbnail_url: str = ""    # used on the card grid
    tools: List[str] = []
    year: str = ""
    client: str = ""
    external_link: str = ""
    featured: bool = False
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
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------- Routes: Auth ----------
@api_router.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"])
    return TokenResponse(
        access_token=token,
        user=UserOut(id=user["id"], email=user["email"], name=user["name"], role=user["role"]),
    )

@api_router.get("/auth/me", response_model=UserOut)
async def me(current=Depends(get_current_admin)):
    return UserOut(id=current["id"], email=current["email"], name=current["name"], role=current["role"])


# ---------- Routes: Profile ----------
@api_router.get("/profile", response_model=Profile)
async def get_profile():
    doc = await db.profile.find_one({"_id": "singleton"}, {"_id": 0})
    if not doc:
        default = Profile().model_dump()
        await db.profile.insert_one({"_id": "singleton", **default})
        return Profile(**default)
    return Profile(**doc)

@api_router.put("/profile", response_model=Profile)
async def update_profile(payload: Profile, _=Depends(get_current_admin)):
    data = payload.model_dump()
    await db.profile.update_one({"_id": "singleton"}, {"$set": data}, upsert=True)
    return Profile(**data)


# ---------- Routes: Categories ----------
def _slugify(text: str) -> str:
    return "-".join("".join(c.lower() if c.isalnum() else " " for c in text).split())

@api_router.get("/categories", response_model=List[Category])
async def list_categories():
    items = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(500)
    return [Category(**c) for c in items]

@api_router.post("/categories", response_model=Category)
async def create_category(payload: CategoryCreate, _=Depends(get_current_admin)):
    slug = payload.slug or _slugify(payload.name)
    cat = Category(name=payload.name, slug=slug, description=payload.description, order=payload.order)
    await db.categories.insert_one(cat.model_dump())
    return cat

@api_router.put("/categories/{cat_id}", response_model=Category)
async def update_category(cat_id: str, payload: CategoryUpdate, _=Depends(get_current_admin)):
    existing = await db.categories.find_one({"id": cat_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "name" in update and "slug" not in update:
        update["slug"] = _slugify(update["name"])
    await db.categories.update_one({"id": cat_id}, {"$set": update})
    merged = {**existing, **update}
    return Category(**merged)

@api_router.delete("/categories/{cat_id}")
async def delete_category(cat_id: str, _=Depends(get_current_admin)):
    res = await db.categories.delete_one({"id": cat_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    # Also unset category on projects (we keep projects)
    await db.projects.update_many({"category_id": cat_id}, {"$set": {"category_id": ""}})
    return {"ok": True}


# ---------- Routes: Projects ----------
@api_router.get("/projects", response_model=List[Project])
async def list_projects(category_id: Optional[str] = None):
    q = {}
    if category_id:
        q["category_id"] = category_id
    items = await db.projects.find(q, {"_id": 0}).sort("order", 1).to_list(1000)
    return [Project(**p) for p in items]

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    p = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**p)

@api_router.post("/projects", response_model=Project)
async def create_project(payload: ProjectCreate, _=Depends(get_current_admin)):
    project = Project(**payload.model_dump())
    await db.projects.insert_one(project.model_dump())
    return project

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, payload: ProjectUpdate, _=Depends(get_current_admin)):
    existing = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    await db.projects.update_one({"id": project_id}, {"$set": update})
    merged = {**existing, **update}
    return Project(**merged)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, _=Depends(get_current_admin)):
    res = await db.projects.delete_one({"id": project_id})
    if res.deleted_count == 0:
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
    await db.contact_messages.insert_one(msg.model_dump())

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
    items = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [ContactMessage(**m) for m in items]

@api_router.delete("/messages/{msg_id}")
async def delete_message(msg_id: str, _=Depends(get_current_admin)):
    res = await db.contact_messages.delete_one({"id": msg_id})
    if res.deleted_count == 0:
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

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.categories.create_index("id", unique=True)
    await db.projects.create_index("id", unique=True)
    await db.contact_messages.create_index("id", unique=True)

    # Seed admin
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing is None:
        user_doc = {
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "name": "Suzanne Cherian",
            "role": "admin",
            "password_hash": hash_password(ADMIN_PASSWORD),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user_doc)
        logger.info(f"Admin seeded: {ADMIN_EMAIL}")
    else:
        # If password has changed, update hash
        if not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
            await db.users.update_one(
                {"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}}
            )
            logger.info("Admin password updated from env")

    # Seed profile if missing
    if not await db.profile.find_one({"_id": "singleton"}):
        await db.profile.insert_one({
            "_id": "singleton",
            **Profile(
                profile_pic_url="https://images.unsplash.com/photo-1571367032831-eabd75a52baf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwyfHxpbmRpYW4lMjBncmFwaGljJTIwZGVzaWduZXIlMjBwb3J0cmFpdHxlbnwwfHx8fDE3Nzg1NDYyMDV8MA&ixlib=rb-4.1.0&q=85",
                email=ADMIN_EMAIL,
                behance_url="https://www.behance.net/suzannecherian",
            ).model_dump()
        })

    # Seed default categories if empty
    if await db.categories.count_documents({}) == 0:
        defaults = [
            {"name": "Branding", "order": 1},
            {"name": "Illustration", "order": 2},
            {"name": "Web Design", "order": 3},
            {"name": "Editorial", "order": 4},
        ]
        for d in defaults:
            cat = Category(name=d["name"], slug=_slugify(d["name"]), order=d["order"])
            await db.categories.insert_one(cat.model_dump())


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
