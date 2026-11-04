#!/usr/bin/env python3
"""
VoxDesk AI — Controlled Administrator Account Setup
Creates or updates an administrator account in Supabase auth.users.
Disables public registration; only accounts created via this script or database seeder can access the admin dashboard.
"""
import argparse
import sys
from app.auth import create_or_update_admin


def main():
    parser = argparse.ArgumentParser(description="Create or update an admin account in Supabase Auth.")
    parser.add_argument("--email", required=False, help="Administrator email address")
    parser.add_argument("--password", required=False, help="Administrator password")
    parser.add_argument("--name", default="VoxDesk Administrator", help="Administrator display name")

    args = parser.parse_args()

    email = args.email
    password = args.password
    name = args.name

    if not email:
        email = input("Enter admin email (e.g. admin@voxdesk.ai): ").strip()
    if not password:
        import getpass
        password = getpass.getpass("Enter admin password: ").strip()

    if not email or "@" not in email:
        print("Error: A valid email address is required.")
        sys.exit(1)

    if not password or len(password) < 8:
        print("Error: Password must be at least 8 characters.")
        sys.exit(1)

    try:
        result = create_or_update_admin(email, password, name)
        print(f"Success: Admin account {result['action']} for '{result['email']}' (ID: {result['id']}).")
        print("Role: admin (enforced via Supabase auth.users app_metadata).")
    except Exception as exc:
        print(f"Error creating admin account: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
