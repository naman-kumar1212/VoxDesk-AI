"""
VoxDesk AI — Database Seeding Script
Creates all tables and seeds the default demo organization.
Can be executed with: python seed.py
"""
import uuid
import sys
from app import create_app
from app.config import settings
from app.database import engine, SessionLocal, create_tables
from app.models import Organization

DEMO_ORG_NAME = "VocalLabs Demo Support"
DEFAULT_ORG_UUID = "00000000-0000-0000-0000-000000000001"

def seed():
    if not settings.DATABASE_URL:
        print("DATABASE_URL is not configured. Set it in .env before running seed.")
        sys.exit(1)

    print("Connecting to database and creating tables...")
    create_tables()

    db = SessionLocal()
    try:
        # Check if demo org already exists
        org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID or DEFAULT_ORG_UUID)
        existing = db.query(Organization).filter(Organization.id == org_id).first()

        if existing:
            print(f"Demo organization already exists: {existing.name} ({existing.id})")
        else:
            org = Organization(
                id=org_id,
                name=DEMO_ORG_NAME,
            )
            db.add(org)
            db.commit()
            print(f"Created demo organization: {org.name} ({org.id})")
            print(f"Update your DEMO_ORGANIZATION_ID={org.id} in .env if not set.")
    except Exception as exc:
        db.rollback()
        print(f"Failed to seed demo organization: {exc}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed()

