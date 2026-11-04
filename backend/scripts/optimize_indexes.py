"""
Database Index Optimization Migration
Adds missing composite and ordering indexes on tickets and ticket_events.
"""
import os
import sys
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine
from sqlalchemy import text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("optimize_indexes")

INDEX_STATEMENTS = [
    # 1. Ticket events ordering index for instant recent activity queries
    """
    CREATE INDEX IF NOT EXISTS ix_ticket_events_created_at_desc
    ON ticket_events (created_at DESC);
    """,

    # 2. Composite indexes on tickets for filtered + ordered queries
    """
    CREATE INDEX IF NOT EXISTS ix_tickets_org_status_created
    ON tickets (organization_id, status, created_at DESC);
    """,
    """
    CREATE INDEX IF NOT EXISTS ix_tickets_org_dept_created
    ON tickets (organization_id, department, created_at DESC);
    """,
    """
    CREATE INDEX IF NOT EXISTS ix_tickets_org_priority_created
    ON tickets (organization_id, priority, created_at DESC);
    """,
    """
    CREATE INDEX IF NOT EXISTS ix_tickets_org_category_created
    ON tickets (organization_id, category, created_at DESC);
    """,

    # 3. Fast case-insensitive search indexes
    """
    CREATE INDEX IF NOT EXISTS ix_tickets_ticket_num_lower
    ON tickets (lower(ticket_number));
    """,
    """
    CREATE INDEX IF NOT EXISTS ix_tickets_customer_email_lower
    ON tickets (lower(customer_email));
    """,
]

def apply_indexes():
    logger.info("Applying PostgreSQL performance indexes to Supabase...")
    with engine.begin() as conn:
        for stmt in INDEX_STATEMENTS:
            name = stmt.strip().split()[5]
            logger.info("  Applying index: %s", name)
            conn.execute(text(stmt))
    logger.info("All performance indexes applied successfully.")

if __name__ == "__main__":
    apply_indexes()
