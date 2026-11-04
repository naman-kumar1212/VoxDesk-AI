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
import matplotlib.dates as mdates
import pandas as pd
import seaborn as sns
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
            if len(start_str) == 10 and "-" in start_str:
                start_dt = datetime.strptime(start_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            else:
                start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
                if start_dt.tzinfo is None:
                    start_dt = start_dt.replace(tzinfo=timezone.utc)

            if end_str:
                if len(end_str) == 10 and "-" in end_str:
                    end_dt = datetime.strptime(end_str, "%Y-%m-%d").replace(
                        hour=23, minute=59, second=59, microsecond=999999, tzinfo=timezone.utc
                    )
                else:
                    end_dt = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
                    if end_dt.tzinfo is None:
                        end_dt = end_dt.replace(tzinfo=timezone.utc)
            else:
                end_dt = now

            return start_dt, end_dt
        except Exception as e:
            logger.warning("Error parsing custom date range: %s", e)
            return None, None
    return None, None


def get_tickets_dataframe(org_id, range_param: str = "all", start_str: Optional[str] = None, end_str: Optional[str] = None) -> pd.DataFrame:
    """
    Fetches tickets from PostgreSQL for an organization and returns a normalized Pandas DataFrame.
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

            # Department name normalization: clean and ensure "Billing" maps to "Billing Support"
            dept = (t.department or "General Support").strip()
            if dept == "Billing":
                dept = "Billing Support"

            # Consistent lower-cased status & priority
            status_val = (t.status or "open").lower().strip()
            priority_val = (t.priority or "medium").lower().strip()

            records.append({
                "id": str(t.id),
                "ticket_number": t.ticket_number,
                "created_at": t.created_at,
                "resolved_at": t.resolved_at,
                "status": status_val,
                "priority": priority_val,
                "category": (t.category or "OTHER").strip(),
                "department": dept,
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
    Computes statistical KPIs and aggregations using Pandas from actual database records.
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
            "median_resolution_hours": 0.0,
            "resolved_tickets_count": 0,
            "daily_trends": [],
            "status_breakdown": {"open": 0, "in_progress": 0, "resolved": 0, "escalated": 0},
            "category_breakdown": {},
            "priority_breakdown": {},
            "department_breakdown": {},
            "department_table": [],
            "status_table": [
                {"status": "Open", "count": 0, "percentage": 0.0, "color": VOX_SLATE},
                {"status": "In Progress", "count": 0, "percentage": 0.0, "color": VOX_BLUE},
                {"status": "Escalated", "count": 0, "percentage": 0.0, "color": VOX_ROSE},
                {"status": "Resolved", "count": 0, "percentage": 0.0, "color": VOX_EMERALD},
            ],
        }

    # Status counts strictly normalized
    status_counts = df["status"].value_counts().to_dict()
    open_count = int(status_counts.get("open", 0))
    in_prog_count = int(status_counts.get("in_progress", 0))
    resolved_count = int(status_counts.get("resolved", 0))
    escalated_count = int(df["escalated"].sum())

    # Rates calculated against total volume in the same date window
    escalation_rate = round((escalated_count / total_volume) * 100, 1)
    resolution_rate = round((resolved_count / total_volume) * 100, 1)

    # Resolution duration metrics
    resolved_df = df.dropna(subset=["resolution_hours"])
    n_resolved = len(resolved_df)
    avg_resolution_hours = round(float(resolved_df["resolution_hours"].mean()), 1) if n_resolved > 0 else 0.0
    median_resolution_hours = round(float(resolved_df["resolution_hours"].median()), 1) if n_resolved > 0 else 0.0

    # Daily trends (sorted chronologically)
    daily_grouped = df.groupby("created_date").size().reset_index(name="count")
    daily_grouped = daily_grouped.sort_values("created_date")
    daily_trends = [
        {"date": str(row["created_date"]), "count": int(row["count"])}
        for _, row in daily_grouped.iterrows()
    ]

    # Department table sorted descending
    dept_counts = df["department"].value_counts()
    department_table = [
        {
            "department": dept,
            "count": int(count),
            "percentage": round((count / total_volume) * 100, 1),
        }
        for dept, count in dept_counts.items()
    ]

    # Status table with percentages
    status_table = [
        {
            "status": "Open",
            "key": "open",
            "count": open_count,
            "percentage": round((open_count / total_volume) * 100, 1),
            "color": VOX_SLATE,
        },
        {
            "status": "In Progress",
            "key": "in_progress",
            "count": in_prog_count,
            "percentage": round((in_prog_count / total_volume) * 100, 1),
            "color": VOX_BLUE,
        },
        {
            "status": "Escalated",
            "key": "escalated",
            "count": escalated_count,
            "percentage": round((escalated_count / total_volume) * 100, 1),
            "color": VOX_ROSE,
        },
        {
            "status": "Resolved",
            "key": "resolved",
            "count": resolved_count,
            "percentage": round((resolved_count / total_volume) * 100, 1),
            "color": VOX_EMERALD,
        },
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
        "median_resolution_hours": median_resolution_hours,
        "resolved_tickets_count": n_resolved,
        "daily_trends": daily_trends,
        "status_breakdown": {k: int(v) for k, v in status_counts.items()},
        "category_breakdown": {k: int(v) for k, v in df["category"].value_counts().to_dict().items()},
        "priority_breakdown": {k: int(v) for k, v in df["priority"].value_counts().to_dict().items()},
        "department_breakdown": {k: int(v) for k, v in dept_counts.to_dict().items()},
        "department_table": department_table,
        "status_table": status_table,
    }


def render_chart_png(org_id, chart_name: str, range_param: str = "all", start_str: Optional[str] = None, end_str: Optional[str] = None) -> bytes:
    """
    Renders high-resolution visualization using Matplotlib & Seaborn.
    Returns in-memory PNG bytes via io.BytesIO buffer with zero disk I/O.
    """
    df = get_tickets_dataframe(org_id, range_param, start_str, end_str)

    # Style configuration
    plt.close("all")
    sns.set_theme(style="white", palette="muted")
    fig, ax = plt.subplots(figsize=(7.2, 3.9), dpi=140)
    fig.patch.set_facecolor("#ffffff")
    ax.set_facecolor("#ffffff")

    # Spines & tick formatting
    def _apply_clean_spines(axis):
        axis.spines["top"].set_visible(False)
        axis.spines["right"].set_visible(False)
        axis.spines["left"].set_color("#cbd5e1")
        axis.spines["bottom"].set_color("#cbd5e1")
        axis.tick_params(colors="#475569", labelsize=9)

    _apply_clean_spines(ax)

    # Empty dataset fallback
    if df.empty:
        ax.text(
            0.5, 0.54, "No Ticket Records in Selected Period",
            horizontalalignment="center", verticalalignment="center",
            transform=ax.transAxes, color="#1e293b", fontsize=12, fontweight="bold"
        )
        ax.text(
            0.5, 0.44, "Try expanding the date filter or selecting All Time",
            horizontalalignment="center", verticalalignment="center",
            transform=ax.transAxes, color="#64748b", fontsize=9.5
        )
        ax.set_axis_off()
        buf = io.BytesIO()
        plt.savefig(buf, format="png", bbox_inches="tight", transparent=False, facecolor="#ffffff", dpi=140)
        plt.close("all")
        buf.seek(0)
        return buf.getvalue()

    total_tickets = len(df)

    # ─────────────────────────────────────────────────────────────────────────
    # 1. Ticket Volume Over Time (Line Chart)
    # ─────────────────────────────────────────────────────────────────────────
    if chart_name == "volume_over_time":
        daily = df.groupby("created_date").size().reset_index(name="count")
        daily["created_date"] = pd.to_datetime(daily["created_date"])
        daily = daily.sort_values("created_date")

        # Reindex to full daily range if span is > 1 day to show smooth trajectory
        if len(daily) > 1:
            min_d = daily["created_date"].min()
            max_d = daily["created_date"].max()
            full_idx = pd.date_range(min_d, max_d, freq="D")
            daily = daily.set_index("created_date").reindex(full_idx, fill_value=0).reset_index()
            daily = daily.rename(columns={"index": "created_date"})

        ax.plot(
            daily["created_date"],
            daily["count"],
            color=VOX_PURPLE,
            marker="o",
            markersize=4.5,
            linewidth=2.4,
            markerfacecolor=VOX_PURPLE,
            markeredgecolor="#ffffff",
            markeredgewidth=1.2,
            label="Daily Intake",
        )
        ax.fill_between(daily["created_date"], daily["count"], color=VOX_PURPLE, alpha=0.12)
        ax.set_title("Ticket Volume Ingestion Over Time", fontsize=11.5, fontweight="bold", pad=12, color="#0f172a", loc="left")
        ax.set_ylabel("Daily Tickets", fontsize=9, color="#64748b", labelpad=8)
        max_y = daily["count"].max() if len(daily) else 1
        ax.set_ylim(bottom=0, top=max(max_y * 1.25, 4))
        ax.grid(axis="y", linestyle="--", alpha=0.4, color="#cbd5e1")
        ax.grid(axis="x", visible=False)

        # Date formatting without diagonal overlap
        num_days = len(daily)
        if num_days <= 8:
            ax.xaxis.set_major_locator(mdates.DayLocator())
            ax.xaxis.set_major_formatter(mdates.DateFormatter("%a, %b %d"))
        elif num_days <= 35:
            ax.xaxis.set_major_locator(mdates.WeekdayLocator(interval=1))
            ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))
        else:
            ax.xaxis.set_major_locator(mdates.AutoDateLocator(minticks=5, maxticks=8))
            ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))

        ax.tick_params(axis="x", rotation=0, labelsize=8.5)
        fig.subplots_adjust(left=0.10, right=0.96, top=0.88, bottom=0.16)

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Tickets by Resolution Status (Bar Chart with Counts & Percentages)
    # ─────────────────────────────────────────────────────────────────────────
    elif chart_name == "status_distribution":
        order = ["open", "in_progress", "escalated", "resolved"]
        labels = ["Open", "In Progress", "Escalated", "Resolved"]
        status_palette = [VOX_SLATE, VOX_BLUE, VOX_ROSE, VOX_EMERALD]

        counts_map = df["status"].value_counts().to_dict()
        counts = [int(counts_map.get(s, 0)) for s in order]
        max_c = max(counts) if counts else 1

        bars = ax.bar(labels, counts, color=status_palette, width=0.52, edgecolor="#ffffff", linewidth=1.5)
        ax.set_ylim(0, max_c * 1.30 if max_c > 0 else 5)

        for bar, c in zip(bars, counts):
            h = bar.get_height()
            pct_str = f"{(c / total_tickets * 100):.1f}%" if total_tickets > 0 else "0%"
            ax.annotate(
                f"{c}\n({pct_str})",
                xy=(bar.get_x() + bar.get_width() / 2, h),
                xytext=(0, 4),
                textcoords="offset points",
                ha="center",
                va="bottom",
                fontsize=9,
                fontweight="bold",
                color="#1e293b",
                linespacing=1.1,
            )

        ax.set_title("Tickets by Resolution Status", fontsize=11.5, fontweight="bold", pad=12, color="#0f172a", loc="left")
        ax.set_ylabel("Total Tickets", fontsize=9, color="#64748b", labelpad=8)
        ax.grid(axis="y", linestyle="--", alpha=0.4, color="#cbd5e1")
        ax.grid(axis="x", visible=False)
        fig.subplots_adjust(left=0.10, right=0.96, top=0.88, bottom=0.16)

    # ─────────────────────────────────────────────────────────────────────────
    # 3. Department Active Workload (Horizontal Bar Chart Sorted Descending)
    # ─────────────────────────────────────────────────────────────────────────
    elif chart_name == "department_workload":
        # Ascending for barh so largest is at the top of the chart
        dept_s = df["department"].value_counts().sort_values(ascending=True)
        dept_names = list(dept_s.index)
        dept_counts = dept_s.values
        max_w = max(dept_counts) if len(dept_counts) else 1

        palette = sns.color_palette("light:#7c3aed_r", n_colors=max(len(dept_s), 1))
        colors = list(reversed(palette))

        bars = ax.barh(dept_names, dept_counts, color=colors, height=0.55, edgecolor="#ffffff", linewidth=1.2)
        ax.set_xlim(0, max_w * 1.32 if max_w > 0 else 5)

        for bar, val in zip(bars, dept_counts):
            pct_str = f"{(val / total_tickets * 100):.1f}%" if total_tickets > 0 else "0%"
            ax.annotate(
                f"  {int(val)} tickets ({pct_str})",
                xy=(val, bar.get_y() + bar.get_height() / 2),
                xytext=(3, 0),
                textcoords="offset points",
                ha="left",
                va="center",
                fontsize=9,
                fontweight="bold",
                color="#1e293b",
            )

        ax.set_title("Department Active Workload (Ranked)", fontsize=11.5, fontweight="bold", pad=12, color="#0f172a", loc="left")
        ax.set_xlabel("Assigned Tickets", fontsize=9, color="#64748b", labelpad=8)
        ax.grid(axis="x", linestyle="--", alpha=0.4, color="#cbd5e1")
        ax.grid(axis="y", visible=False)
        fig.subplots_adjust(left=0.28, right=0.96, top=0.88, bottom=0.16)

    # ─────────────────────────────────────────────────────────────────────────
    # 4. Resolution Time Distribution (Histogram with Mean & Median)
    # ─────────────────────────────────────────────────────────────────────────
    elif chart_name == "resolution_time":
        resolved_df = df.dropna(subset=["resolution_hours"])
        n_resolved = len(resolved_df)

        if n_resolved == 0:
            ax.text(
                0.5, 0.54, "No Resolved Tickets in Period",
                horizontalalignment="center", verticalalignment="center",
                transform=ax.transAxes, color="#1e293b", fontsize=12, fontweight="bold"
            )
            ax.text(
                0.5, 0.44, "Resolution duration is recorded when tickets transition to Resolved",
                horizontalalignment="center", verticalalignment="center",
                transform=ax.transAxes, color="#64748b", fontsize=9.5
            )
            ax.set_axis_off()
        else:
            hours = resolved_df["resolution_hours"]
            mean_hrs = float(hours.mean())
            median_hrs = float(hours.median())

            bins = min(12, max(4, int(n_resolved ** 0.5 * 1.5)))
            counts_hist, bin_edges, patches = ax.hist(
                hours,
                bins=bins,
                color=VOX_LAVENDER,
                edgecolor="#ffffff",
                linewidth=1.2,
                alpha=0.85,
            )

            # Reference lines
            ax.axvline(mean_hrs, color=VOX_ROSE, linestyle="--", linewidth=2.0, label=f"Mean: {mean_hrs:.1f} hrs")
            ax.axvline(median_hrs, color=VOX_BLUE, linestyle="-.", linewidth=2.0, label=f"Median: {median_hrs:.1f} hrs")

            # Only show KDE if N >= 15 to avoid misleading sparse curves
            if n_resolved >= 15:
                try:
                    kde_ax = ax.twinx()
                    sns.kdeplot(hours, ax=kde_ax, color="#4c1d95", linewidth=1.6)
                    kde_ax.set_yticks([])
                    kde_ax.grid(False)
                    kde_ax.spines["top"].set_visible(False)
                    kde_ax.spines["right"].set_visible(False)
                    kde_ax.spines["left"].set_visible(False)
                except Exception:
                    pass

            ax.set_title(f"Resolution Time Distribution (N = {n_resolved} Resolved)", fontsize=11.5, fontweight="bold", pad=12, color="#0f172a", loc="left")
            ax.set_xlabel("Hours to Resolution", fontsize=9, color="#64748b", labelpad=8)
            ax.set_ylabel("Resolved Count", fontsize=9, color="#64748b", labelpad=8)
            ax.legend(loc="upper right", frameon=True, facecolor="#ffffff", edgecolor="#cbd5e1", fontsize=8.5)
            ax.grid(axis="y", linestyle="--", alpha=0.4, color="#cbd5e1")
            ax.grid(axis="x", visible=False)
            fig.subplots_adjust(left=0.10, right=0.96, top=0.88, bottom=0.16)

    # ─────────────────────────────────────────────────────────────────────────
    # 5. Complaint Categories (Horizontal Breakdown)
    # ─────────────────────────────────────────────────────────────────────────
    elif chart_name == "category_distribution":
        cat_counts = df["category"].value_counts().sort_values(ascending=True)
        colors = sns.color_palette("mako", len(cat_counts))
        bars = ax.barh([c.replace("_", " ").title() for c in cat_counts.index], cat_counts.values, color=colors, height=0.6)
        max_cat = max(cat_counts.values) if len(cat_counts) else 1
        ax.set_xlim(0, max_cat * 1.30 if max_cat > 0 else 5)

        for bar, val in zip(bars, cat_counts.values):
            pct_str = f"{(val / total_tickets * 100):.1f}%" if total_tickets > 0 else "0%"
            ax.annotate(
                f"  {int(val)} ({pct_str})",
                xy=(val, bar.get_y() + bar.get_height() / 2),
                xytext=(3, 0),
                textcoords="offset points",
                ha="left",
                va="center",
                fontsize=9,
                fontweight="bold",
                color="#1e293b",
            )
        ax.set_title("Complaint Category Breakdown", fontsize=11.5, fontweight="bold", pad=12, color="#0f172a", loc="left")
        ax.set_xlabel("Total Grievances", fontsize=9, color="#64748b", labelpad=8)
        ax.grid(axis="x", linestyle="--", alpha=0.4, color="#cbd5e1")
        ax.grid(axis="y", visible=False)
        fig.subplots_adjust(left=0.28, right=0.96, top=0.88, bottom=0.16)

    # ─────────────────────────────────────────────────────────────────────────
    # 6. Priority Distribution (Donut Chart)
    # ─────────────────────────────────────────────────────────────────────────
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
        ax.set_title("Priority Level Allocation", fontsize=11.5, fontweight="bold", pad=12, color="#0f172a", loc="left")
        fig.subplots_adjust(left=0.10, right=0.96, top=0.88, bottom=0.10)

    else:
        ax.text(0.5, 0.5, f"Unknown chart identifier: {chart_name}",
                ha="center", va="center", transform=ax.transAxes, color=VOX_ROSE, fontsize=11)
        ax.set_axis_off()

    buf = io.BytesIO()
    plt.savefig(buf, format="png", bbox_inches="tight", transparent=False, facecolor="#ffffff", dpi=140)
    plt.close("all")
    buf.seek(0)
    return buf.getvalue()
