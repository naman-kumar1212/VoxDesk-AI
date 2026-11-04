#!/usr/bin/env python3
"""
VoxDesk AI — Realistic Demo Data Seeder
Generates 150 synthetic support tickets distributed over the past 90 days,
along with default departments and support staff users.

Safety features:
- Idempotent (checks existing demo tickets)
- Flags all generated records with is_demo = True
- Safe cleanup via --clean / --remove-demo
- Never modifies real customer complaints
- Zero external network calls or paid APIs
"""
import argparse
import os
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.config import settings
from app.database import get_db
from app.models import (
    AdminUser,
    Department,
    Organization,
    Ticket,
    TicketEvent,
    VALID_CATEGORIES,
    VALID_PRIORITIES,
    VALID_STATUSES,
)

# Seed departments
DEFAULT_DEPARTMENTS = [
    {
        "name": "Billing",
        "description": "Handles payment issues, duplicate charges, billing disputes, and refund verifications.",
        "status": "active",
    },
    {
        "name": "Logistics",
        "description": "Manages order shipments, delivery delays, tracking updates, and transit damages.",
        "status": "active",
    },
    {
        "name": "Technical Support",
        "description": "Assists with broadband outages, router resets, app connectivity, and software bugs.",
        "status": "active",
    },
    {
        "name": "Account Support",
        "description": "Assists with account lockout, password resets, profile settings, and MFA issues.",
        "status": "active",
    },
    {
        "name": "General Support",
        "description": "General customer inquiries, product questions, feedback, and escalation triage.",
        "status": "active",
    },
]

# Seed staff users
DEFAULT_STAFF_USERS = [
    {"name": "Sarah Jenkins", "email": "s.jenkins@example.com", "role": "admin", "department": "General Support"},
    {"name": "Marcus Vance", "email": "m.vance@example.com", "role": "staff", "department": "Technical Support"},
    {"name": "Priya Sharma", "email": "p.sharma@example.com", "role": "staff", "department": "Billing"},
    {"name": "David Kim", "email": "d.kim@example.com", "role": "staff", "department": "Logistics"},
    {"name": "Elena Rostova", "email": "e.rostova@example.com", "role": "staff", "department": "Account Support"},
    {"name": "James Wilson", "email": "j.wilson@example.com", "role": "staff", "department": "Technical Support"},
    {"name": "Ananya Desai", "email": "a.desai@example.com", "role": "staff", "department": "Billing"},
    {"name": "Michael Torres", "email": "m.torres@example.com", "role": "staff", "department": "Logistics"},
]

# Realistic complaint corpus by category
COMPLAINT_TEMPLATES = {
    "payment": [
        ("I was charged twice on my credit card for transaction #{order_num}. Please reverse the duplicate charge.", "Duplicate charge reported on credit card for transaction #{order_num}."),
        ("My payment went through and funds were deducted from my bank, but the portal still says payment pending.", "Payment deducted but order status remains pending."),
        ("I am unable to update my default billing payment method. The checkout page gives error code PAY-402.", "Checkout error code PAY-402 when updating billing payment method."),
        ("Requested an authorized invoice receipt for tax filing, but the PDF download link generates a 404 error.", "Unable to download billing tax invoice PDF."),
    ],
    "orders": [
        ("I placed order #{order_num} three days ago with express shipping, but the tracking number is still inactive.", "Express order #{order_num} tracking inactive after 3 days."),
        ("I received an incorrect item in my order #{order_num}. I ordered the 100W power adapter but got a 45W unit.", "Incorrect SKU received in order #{order_num}."),
        ("Need to cancel order #{order_num} because I entered the wrong model variant before it leaves the warehouse.", "Customer requested cancellation for order #{order_num} before dispatch."),
        ("Missing accessories from the package for order #{order_num}. The package was unsealed upon arrival.", "Missing bundled accessories reported for order #{order_num}."),
    ],
    "delivery": [
        ("The delivery courier marked package #{order_num} as delivered at my door, but no package was left.", "Package marked as delivered but not received by customer."),
        ("My parcel has been stuck at the regional sorting hub for over 5 business days with no further scan.", "Delivery delayed at regional hub for over 5 days."),
        ("The delivery driver arrived outside the scheduled delivery window without calling the customer.", "Delivery attempt failed outside agreed delivery time window."),
        ("Package arrived damaged with torn outer box and scratched device casing for order #{order_num}.", "Outer packaging and product arrived damaged in transit."),
    ],
    "technical": [
        ("Home optical fiber broadband connection has been disconnected with red LOS indicator since morning.", "Fiber broadband LOS indicator blinking red, no internet connection."),
        ("The VoxDesk mobile app crashes immediately on launch after updating to the latest version on iOS.", "Mobile application crashes immediately upon opening on iOS."),
        ("Router keeps rebooting every 15 minutes whenever multiple streaming devices are connected.", "Hardware router frequent restart loops under standard network load."),
        ("High latency and packet loss exceeding 40% on my broadband line during peak evening hours.", "Severe packet loss and latency spikes during peak hours."),
    ],
    "account": [
        ("Locked out of my primary account after failing 2-factor authentication when I switched to a new phone.", "Customer locked out following phone migration and 2FA reset requirement."),
        ("Not receiving password reset verification emails on my registered corporate email address.", "Password reset verification emails not reaching inbox or spam folder."),
        ("Need to update the primary administrative email address associated with my business account.", "Request to change primary company administrative email address."),
        ("Suspected unauthorized login attempt notification received from an unrecognized location.", "Customer flagged suspicious login notification from unknown IP address."),
    ],
    "refund": [
        ("Returned defective merchandise with return tracking #{order_num} over two weeks ago; refund still pending.", "Return tracking #{order_num} delivered 14 days ago, refund pending."),
        ("Canceled service subscription within the 30-day money-back guarantee period but full refund was not credited.", "Refund credit not reflected within 30-day satisfaction window."),
        ("Partial refund received does not match the invoice amount after returning damaged goods.", "Discrepancy in issued partial refund calculation."),
        ("Refund was directed to an expired card account instead of the updated bank account on file.", "Customer requested re-routing refund to active banking account."),
    ],
    "other": [
        ("Looking for documentation on business SLA coverage and dedicated priority telephone support options.", "Inquiry regarding enterprise SLA terms and dedicated phone support tiers."),
        ("Submitting feedback regarding customer service agent who helped resolve our fiber installation promptly.", "Customer satisfaction feedback regarding polite technician visit."),
        ("Requesting formal data portability export of customer account history under privacy regulations.", "Customer submitted formal account data export request."),
        ("Inquiring about scheduled maintenance downtime notices for the upcoming weekend in our district.", "Query regarding maintenance schedule in Northern regional district."),
    ],
}

CATEGORY_TO_DEPT = {
    "payment": "Billing",
    "refund": "Billing",
    "delivery": "Logistics",
    "orders": "Logistics",
    "technical": "Technical Support",
    "account": "Account Support",
    "other": "General Support",
}

CUSTOMER_NAMES = [
    "Rachel Adams", "David Patel", "Elena Rostova", "Liam Henderson", "Sophia Chen",
    "Marcus Vance", "Aisha Al-Mansoor", "Carlos Mendez", "Hannah Abbott", "Noah Tanaka",
    "Zoe Washington", "Vikram Malhotra", "Chloe Bennett", "Ethan Walker", "Amara Okafor",
    "Lucas Silva", "Isabella Rossi", "Benjamin Miller", "Fatima Zahra", "Alexander Scott",
]

def generate_ticket_number(idx: int) -> str:
    """Deterministic and formatted ticket number: VD-10000 + idx"""
    return f"VD-{10400 + idx}"

def seed_departments(db, org_id):
    print("Seeding default departments...")
    created_count = 0
    for dept_data in DEFAULT_DEPARTMENTS:
        existing = db.query(Department).filter(
            Department.organization_id == org_id,
            Department.name == dept_data["name"],
        ).first()
        if not existing:
            dept = Department(
                organization_id=org_id,
                name=dept_data["name"],
                description=dept_data["description"],
                status=dept_data["status"],
            )
            db.add(dept)
            created_count += 1
    db.commit()
    print(f"Departments ready ({created_count} added, {len(DEFAULT_DEPARTMENTS) - created_count} existed).")

def seed_staff_users(db, org_id):
    print("Seeding default staff and admin users...")
    created_count = 0
    for udata in DEFAULT_STAFF_USERS:
        existing = db.query(AdminUser).filter(
            AdminUser.organization_id == org_id,
            AdminUser.email == udata["email"],
        ).first()
        if not existing:
            user = AdminUser(
                organization_id=org_id,
                name=udata["name"],
                email=udata["email"],
                role=udata["role"],
                department=udata["department"],
                status="active",
                created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(30, 180)),
                last_active_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48)),
            )
            db.add(user)
            created_count += 1
    db.commit()
    print(f"Staff users ready ({created_count} added, {len(DEFAULT_STAFF_USERS) - created_count} existed).")

def seed_tickets(db, org_id, count=150):
    print(f"Checking existing demo tickets for count={count}...")
    existing_demo_count = db.query(Ticket).filter(
        Ticket.organization_id == org_id,
        Ticket.is_demo == True,  # noqa: E712
    ).count()

    if existing_demo_count >= count:
        print(f"Database already has {existing_demo_count} demo tickets (>= {count}). Skipping ticket creation.")
        return existing_demo_count

    to_create = count - existing_demo_count
    print(f"Generating {to_create} realistic synthetic demo tickets...")

    categories = list(VALID_CATEGORIES)
    priorities_weighted = ["low"] * 25 + ["medium"] * 45 + ["high"] * 30
    statuses_weighted = ["open"] * 20 + ["in_progress"] * 30 + ["escalated"] * 15 + ["resolved"] * 35

    now = datetime.now(timezone.utc)
    created_tickets = 0

    for i in range(existing_demo_count, count):
        ticket_num = generate_ticket_number(i + 1)
        
        # Check uniqueness by ticket number
        if db.query(Ticket).filter(Ticket.ticket_number == ticket_num).first():
            continue

        cat = categories[i % len(categories)]
        dept = CATEGORY_TO_DEPT.get(cat, "General Support")
        prio = priorities_weighted[i % len(priorities_weighted)]
        status = statuses_weighted[i % len(statuses_weighted)]

        # Time distribution: Past 90 days
        days_ago = max(0, min(89, int(random.gauss(35, 25))))
        hours_ago = random.randint(0, 23)
        minutes_ago = random.randint(0, 59)
        created_at = now - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)

        # Escalation rules
        is_escalated = (status == "escalated")
        escalation_reason = None
        if is_escalated:
            reasons = [
                "Customer contacted multiple times without resolution.",
                "High customer frustration detected with threat to escalate to regulatory body.",
                "Priority SLA window breached without assigned agent action.",
                "Suspected recurring billing inconsistency exceeding standard threshold.",
            ]
            escalation_reason = reasons[i % len(reasons)]

        # Resolution timestamp
        resolved_at = None
        if status == "resolved":
            hours_to_resolve = random.randint(2, 8) if prio == "high" else (random.randint(8, 28) if prio == "medium" else random.randint(24, 72))
            resolved_at = min(now, created_at + timedelta(hours=hours_to_resolve))
            updated_at = resolved_at
        else:
            updated_at = min(now, created_at + timedelta(hours=random.randint(1, 12)))

        # Complaint text
        templates = COMPLAINT_TEMPLATES[cat]
        complaint_tpl, summary_tpl = templates[i % len(templates)]
        order_num = f"{100000 + i * 37}"
        transcript = complaint_tpl.replace("{order_num}", order_num)
        summary = summary_tpl.replace("{order_num}", order_num)

        customer_name = CUSTOMER_NAMES[i % len(CUSTOMER_NAMES)]
        clean_name = customer_name.lower().replace(" ", ".")
        customer_email = f"{clean_name}@example.com"

        ticket = Ticket(
            ticket_number=ticket_num,
            organization_id=org_id,
            idempotency_key=uuid.uuid4(),
            transcript=transcript,
            category=cat,
            priority=prio,
            department=dept,
            summary=summary,
            status=status,
            escalated=is_escalated,
            escalation_reason=escalation_reason,
            analysis_status="completed",
            customer_name=customer_name,
            customer_email=customer_email,
            internal_notes=f"Initial grievance recorded via VoxDesk voice intake channel. Assigned to {dept} team.",
            is_demo=True,
            created_at=created_at,
            updated_at=updated_at,
            resolved_at=resolved_at,
        )
        db.add(ticket)
        db.flush()  # get ticket.id

        # Seed realistic activity history
        event_created = TicketEvent(
            ticket_id=ticket.id,
            event_type="TICKET_CREATED",
            details={"channel": "web_voice", "category": cat, "priority": prio, "department": dept},
            created_at=created_at,
        )
        db.add(event_created)

        if is_escalated:
            event_escalated = TicketEvent(
                ticket_id=ticket.id,
                event_type="TICKET_ESCALATED",
                details={"reason": escalation_reason, "flagged_by": "Automated SLA Monitor"},
                created_at=created_at + timedelta(hours=1),
            )
            db.add(event_escalated)

        if status in ("in_progress", "resolved"):
            event_status = TicketEvent(
                ticket_id=ticket.id,
                event_type="STATUS_CHANGED",
                details={"from_status": "open", "to_status": status, "operator": "Demo Support Staff"},
                created_at=updated_at,
            )
            db.add(event_status)

        created_tickets += 1

    db.commit()
    total_demo = db.query(Ticket).filter(Ticket.organization_id == org_id, Ticket.is_demo == True).count()
    print(f"Successfully committed {created_tickets} new demo tickets. Total demo tickets in DB: {total_demo}")
    return total_demo

def clean_demo_data(db, org_id):
    print("Purging only synthetic demo records (is_demo = True)...")
    deleted_tickets = db.execute(
        text("DELETE FROM tickets WHERE organization_id = :org_id AND is_demo = TRUE RETURNING id;"),
        {"org_id": org_id},
    ).fetchall()
    db.commit()
    print(f"Removed {len(deleted_tickets)} demo tickets and associated event records cleanly.")

def main():
    parser = argparse.ArgumentParser(description="VoxDesk AI Demo Data Seeder")
    parser.add_argument("--count", type=int, default=150, help="Number of demo tickets to generate (100-200, default: 150)")
    parser.add_argument("--clean", "--remove-demo", dest="clean", action="store_true", help="Remove all demo data safely without affecting real customer records")

    args = parser.parse_args()

    if args.count < 100 or args.count > 200:
        print("Warning: count should be between 100 and 200 tickets for optimal dashboard statistics.")
        count = max(50, min(250, args.count))
    else:
        count = args.count

    if not settings.DEMO_ORGANIZATION_ID:
        print("Error: DEMO_ORGANIZATION_ID is not configured in settings.", file=sys.stderr)
        sys.exit(1)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)
    db = next(get_db())

    try:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if not org:
            org = Organization(id=org_id, name="VoxDesk AI Demo Organization")
            db.add(org)
            db.commit()

        if args.clean:
            clean_demo_data(db, org_id)
        else:
            seed_departments(db, org_id)
            seed_staff_users(db, org_id)
            seed_tickets(db, org_id, count=count)
            print("\nSeeding completed successfully! All 5 Admin Console sections now have live database data.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
