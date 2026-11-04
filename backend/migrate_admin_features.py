#!/usr/bin/env python3
"""
VoxDesk AI — Admin Features Schema Migration
Safely creates departments and admin_users tables, and adds enhanced columns to tickets.
Idempotent and non-destructive.
"""
import sys
from sqlalchemy import text
from app.database import get_db

def run_migration():
    print("Running VoxDesk AI Admin Features migration...")
    db = next(get_db())
    try:
        # 1. Create departments table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS departments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
                name VARCHAR(64) NOT NULL,
                description TEXT,
                status VARCHAR(24) NOT NULL DEFAULT 'active',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT uq_department_org_name UNIQUE (organization_id, name)
            );
        """))

        # 2. Create admin_users table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS admin_users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
                auth_user_id UUID,
                name VARCHAR(120) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                role VARCHAR(32) NOT NULL DEFAULT 'staff',
                department VARCHAR(64),
                status VARCHAR(24) NOT NULL DEFAULT 'active',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                last_active_at TIMESTAMPTZ
            );
        """))

        # 3. Add enhanced columns to tickets
        columns_to_add = [
            ("customer_name", "VARCHAR(120)"),
            ("customer_email", "VARCHAR(255)"),
            ("internal_notes", "TEXT"),
            ("is_demo", "BOOLEAN NOT NULL DEFAULT FALSE"),
            ("resolved_at", "TIMESTAMPTZ"),
        ]
        for col_name, col_type in columns_to_add:
            db.execute(text(f"""
                ALTER TABLE tickets 
                ADD COLUMN IF NOT EXISTS {col_name} {col_type};
            """))

        db.commit()
        print("Migration completed successfully.")
    except Exception as exc:
        db.rollback()
        print(f"Migration failed: {exc}", file=sys.stderr)
        raise exc
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
