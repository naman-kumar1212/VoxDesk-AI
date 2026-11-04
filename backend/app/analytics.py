"""
VoxDesk AI — In-Memory Analytics & Visualization Engine
Uses Pandas for data aggregation and Matplotlib/Seaborn for chart generation.
Returns charts directly as in-memory PNG bytes (io.BytesIO) with zero disk I/O.
Strictly $0 / free tier compliant.
"""
import io
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

import matplotlib
# Enforce non-interactive Agg backend before importing pyplot
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from sqlalchemy import text
from app.database import get_db
from app.models import Ticket

logger = logging.getLogger(__name__)

# Primary brand colors matching VoxDesk AI design system
VOX_PURPLE = "#7c3aed"
VOX_LAVENDER = "#8b5cf6"
VOX_BLUE = "#3b82f6"
VOX_EMERALD = "#10b981"
VOX_AMBER = "#f59e0b"
VOX_ROSE = "#ef4444"
VOX_SLATE = "#64748b"


def _parse_date_filter(range_param: str, start_str: Optional[str] = None, end_str: Optional[str] = None) -> Tuple[Optional[datetime], Optional[datetime]]:
    now = datetime.now(timezone.utc)
    range_clean = (range_param or "all").lower().strip()

    if range_clean == "7d":
        return now - timedelta(days=7), now
    elif range_clean == "30d":
        return now - timedelta(days=30), now
    elif range_clean == "90d":
        return now - timedelta(days=90), now
    elif range_clean == "custom" and start_str:
        try:
            start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
            if start_dt.tzinfo is None:
                start_dt = start_dt.replace(tzinfo=timezone.utc)
            end_dt = now
            if end_str:
                end_dt = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
                if end_dt.tzinfo is None:
                    end_dt = end_dt.replace(tzinfo=timezone.utc)
            return start_dt, end_dt
        except Exception:
            return None, None
    return None, None


def get_tickets_dataframe(org_id, range_param: str = "all", start_str: Optional[str] = None, end_str: Optional[str] = None) -> pd.DataFrame:
    """
    Fetches tickets from PostgreSQL for an organization and returns a Pandas DataFrame.
    """
    start_dt, end_dt = _parse_date_filter(range_param, start_str, end_str)

    db = next(get_db())
    try:
        query = db.query(Ticket).filter(Ticket.organization_id == org_id)

        if start_dt:
            query = query.filter(Ticket.created_at >= start_dt)
        if end_dt:
            query = query.filter(Ticket.created_at <= end_dt)

        tickets = query.all()

        if not tickets:
            return pd.DataFrame(columns=[
                "id", "ticket_number", "created_at", "resolved_at", "status",
                "priority", "category", "department", "escalated", "resolution_hours"
            ])

        records = []
        for t in tickets:
            res_hours = None
            if t.resolved_at and t.created_at:
                delta = t.resolved_at - t.created_at
                res_hours = max(0.1, delta.total_seconds() / 3600.0)

            records.append({
                "id": str(t.id),
                "ticket_number": t.ticket_number,
                "created_at": t.created_at,
                "resolved_at": t.resolved_at,
                "status": t.status,
                "priority": t.priority,
                "category": t.category,
                "department": t.department,
                "escalated": bool(t.escalated),
                "resolution_hours": res_hours,
            })

        df = pd.DataFrame(records)
        df["created_date"] = pd.to_datetime(df["created_at"]).dt.date
        return df
    finally:
        db.close()


def get_analytics_summary(org_id, range_param: str = "all", start_str: Optional[str] = None, end_str: Optional[str] = None) -> dict:
    """
    Computes statistical KPIs and aggregations using Pandas.
    """
    df = get_tickets_dataframe(org_id, range_param, start_str, end_str)
    total_volume = len(df)

    if total_volume == 0:
        return {
            "total_volume": 0,
            "open_tickets": 0,
            "in_progress_tickets": 0,
            "resolved_tickets": 0,
            "escalated_tickets": 0,
            "escalation_rate": 0.0,
            "resolution_rate": 0.0,
            "avg_resolution_hours": 0.0,
            "daily_trends": [],
            "status_breakdown": {},
            "category_breakdown": {},
            "priority_breakdown": {},
            "department_breakdown": {},
        }

    # Status counts
    status_counts = df["status"].value_counts().to_dict()
    open_count = int(status_counts.get("open", 0))
    in_prog_count = int(status_counts.get("in_progress", 0))
    resolved_count = int(status_counts.get("resolved", 0))
    escalated_count = int(df["escalated"].sum())

    # Rates
    escalation_rate = round((escalated_count / total_volume) * 100, 1)
    resolution_rate = round((resolved_count / total_volume) * 100, 1)

    # Resolution duration
    resolved_df = df.dropna(subset=["resolution_hours"])
    avg_resolution_hours = round(float(resolved_df["resolution_hours"].mean()), 1) if not resolved_df.empty else 0.0

    # Daily trends (sorted by date)
    daily_grouped = df.groupby("created_date").size().reset_index(name="count")
    daily_grouped = daily_grouped.sort_values("created_date")
    daily_trends = [
        {"date": str(row["created_date"]), "count": int(row["count"])}
        for _, row in daily_grouped.iterrows()
    ]

    return {
        "total_volume": total_volume,
        "open_tickets": open_count,
        "in_progress_tickets": in_prog_count,
        "resolved_tickets": resolved_count,
        "escalated_tickets": escalated_count,
        "escalation_rate": escalation_rate,
        "resolution_rate": resolution_rate,
        "avg_resolution_hours": avg_resolution_hours,
        "daily_trends": daily_trends,
        "status_breakdown": {k: int(v) for k, v in status_counts.items()},
        "category_breakdown": {k: int(v) for k, v in df["category"].value_counts().to_dict().items()},
        "priority_breakdown": {k: int(v) for k, v in df["priority"].value_counts().to_dict().items()},
        "department_breakdown": {k: int(v) for k, v in df["department"].value_counts().to_dict().items()},
    }


def render_chart_png(org_id, chart_name: str, range_param: str = "all", start_str: Optional[str] = None, end_str: Optional[str] = None) -> bytes:
    """
    Renders high-resolution visualization using Matplotlib & Seaborn.
    Returns in-memory PNG bytes via io.BytesIO buffer.
    """
    df = get_tickets_dataframe(org_id, range_param, start_str, end_str)

    # Style configuration
    plt.close("all")
    sns.set_theme(style="whitegrid")
    fig, ax = plt.subplots(figsize=(7, 3.8), dpi=140)

    # Empty dataset fallback
    if df.empty:
        ax.text(
            0.5, 0.5, "No ticket records available for the selected period",
            horizontalalignment="center", verticalalignment="center",
            transform=ax.transAxes, color=VOX_SLATE, fontsize=12, fontweight="medium"
        )
        ax.set_axis_off()
        buf = io.BytesIO()
        plt.savefig(buf, format="png", bbox_inches="tight", transparent=False, facecolor="#ffffff")
        plt.close("all")
        buf.seek(0)
        return buf.getvalue()

    # 1. Volume Over Time Line Chart
    if chart_name == "volume_over_time":
        daily = df.groupby("created_date").size().reset_index(name="count")
        daily = daily.sort_values("created_date")
        daily["created_date"] = pd.to_datetime(daily["created_date"])

        ax.plot(daily["created_date"], daily["count"], color=VOX_PURPLE, marker="o", markersize=4, linewidth=2.2, label="Daily Ingested Tickets")
        ax.fill_between(daily["created_date"], daily["count"], color=VOX_PURPLE, alpha=0.12)
        ax.set_title("Ticket Volume Ingestion Over Time", fontsize=11, fontweight="bold", pad=12, color="#1e293b")
        ax.set_xlabel("Date", fontsize=9, color="#64748b")
        ax.set_ylabel("Ticket Count", fontsize=9, color="#64748b")
        fig.autofmt_xdate(rotation=30)

    # 2. Tickets by Status Bar Chart
    elif chart_name == "status_distribution":
        order = ["open", "in_progress", "escalated", "resolved"]
        status_palette = {
            "open": VOX_SLATE,
            "in_progress": VOX_BLUE,
            "escalated": VOX_ROSE,
            "resolved": VOX_EMERALD,
        }
        counts = df["status"].value_counts().reindex(order).fillna(0)
        bars = ax.bar([s.replace("_", " ").title() for s in order], counts.values, color=[status_palette[s] for s in order], width=0.55)
        for bar in bars:
            height = bar.get_height()
            ax.annotate(f"{int(height)}",
                        xy=(bar.get_x() + bar.get_width() / 2, height),
                        xytext=(0, 3), textcoords="offset points",
                        ha="center", va="bottom", fontsize=9, fontweight="bold", color="#334155")
        ax.set_title("Tickets by Resolution Status", fontsize=11, fontweight="bold", pad=12, color="#1e293b")
        ax.set_ylabel("Total Tickets", fontsize=9, color="#64748b")

    # 3. Complaint Categories Horizontal Bar Chart
    elif chart_name == "category_distribution":
        cat_counts = df["category"].value_counts().sort_values(ascending=True)
        colors = sns.color_palette("mako", len(cat_counts))
        bars = ax.barh([c.replace("_", " ").title() for c in cat_counts.index], cat_counts.values, color=colors, height=0.6)
        for bar in bars:
            width = bar.get_width()
            ax.annotate(f" {int(width)}",
                        xy=(width, bar.get_y() + bar.get_height() / 2),
                        xytext=(3, 0), textcoords="offset points",
                        ha="left", va="center", fontsize=9, fontweight="bold", color="#334155")
        ax.set_title("Complaint Category Breakdown", fontsize=11, fontweight="bold", pad=12, color="#1e293b")
        ax.set_xlabel("Total Grievances", fontsize=9, color="#64748b")

    # 4. Priority Distribution Donut Chart
    elif chart_name == "priority_distribution":
        prio_counts = df["priority"].value_counts()
        prio_palette = {"high": VOX_ROSE, "medium": VOX_AMBER, "low": VOX_EMERALD}
        colors = [prio_palette.get(p, VOX_SLATE) for p in prio_counts.index]
        wedges, texts, autotexts = ax.pie(
            prio_counts.values,
            labels=[p.title() for p in prio_counts.index],
            autopct="%1.1f%%",
            startangle=140,
            colors=colors,
            wedgeprops=dict(width=0.45, edgecolor="white", linewidth=2),
            pctdistance=0.75,
        )
        for at in autotexts:
            at.set_fontsize(9)
            at.set_fontweight("bold")
            at.set_color("#ffffff")
        ax.set_title("Priority Level Allocation", fontsize=11, fontweight="bold", pad=12, color="#1e293b")

    # 5. Department Workload Bar Chart
    elif chart_name == "department_workload":
        dept_counts = df["department"].value_counts().sort_values(ascending=False)
        colors = [VOX_PURPLE, VOX_BLUE, VOX_LAVENDER, VOX_AMBER, VOX_EMERALD][:len(dept_counts)]
        bars = ax.bar(dept_counts.index, dept_counts.values, color=colors, width=0.55)
        for bar in bars:
            height = bar.get_height()
            ax.annotate(f"{int(height)}",
                        xy=(bar.get_x() + bar.get_width() / 2, height),
                        xytext=(0, 3), textcoords="offset points",
                        ha="center", va="bottom", fontsize=9, fontweight="bold", color="#334155")
        ax.set_title("Active Workload by Department", fontsize=11, fontweight="bold", pad=12, color="#1e293b")
        ax.set_ylabel("Assigned Tickets", fontsize=9, color="#64748b")
        fig.autofmt_xdate(rotation=20)

    # 6. Resolution Time Distribution
    elif chart_name == "resolution_time":
        resolved_df = df.dropna(subset=["resolution_hours"])
        if not resolved_df.empty and len(resolved_df) > 1:
            sns.histplot(resolved_df["resolution_hours"], kde=True, ax=ax, color=VOX_PURPLE, bins=12, edgecolor="#ffffff")
            ax.set_title("Resolution Time Distribution (Hours)", fontsize=11, fontweight="bold", pad=12, color="#1e293b")
            ax.set_xlabel("Hours to Resolve", fontsize=9, color="#64748b")
            ax.set_ylabel("Resolved Count", fontsize=9, color="#64748b")
        else:
            ax.text(0.5, 0.5, "Insufficient resolved ticket data to compute duration spread",
                    ha="center", va="center", transform=ax.transAxes, color=VOX_SLATE, fontsize=10)
            ax.set_axis_off()

    else:
        ax.text(0.5, 0.5, f"Unknown chart identifier: {chart_name}",
                ha="center", va="center", transform=ax.transAxes, color=VOX_ROSE, fontsize=11)
        ax.set_axis_off()

    # Layout cleanup
    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", transparent=False, facecolor="#ffffff", dpi=140)
    plt.close("all")
    buf.seek(0)
    return buf.getvalue()
