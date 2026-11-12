"""initial schema: users, courts, court sessions, participants, watches

Revision ID: 0001
Revises:
Create Date: 2026-11-11
"""
import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geography
from sqlalchemy.dialects import postgresql as pg

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

sport = pg.ENUM("football", "basketball", "tennis", name="sport", create_type=False)


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    sport.create(op.get_bind(), checkfirst=True)
    point = Geography(geometry_type="POINT", srid=4326, spatial_index=False)
    now = sa.text("now()")

    op.create_table(
        "users",
        sa.Column("id", pg.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("username", sa.String(50), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255)),
        sa.Column("facebook_id", sa.String(64), unique=True),
        sa.Column("full_name", sa.String(120)),
        sa.Column("phone", sa.String(32)),
        sa.Column("address", sa.String(255)),
        sa.Column("avatar_url", sa.String(512)),
        sa.Column("favorite_sport", sport),
        sa.Column("last_location", point),
        sa.Column("last_seen_at", sa.DateTime(timezone=True)),
        sa.Column("expo_push_token", sa.String(255)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=now, nullable=False),
    )
    op.create_index("ix_users_email_lower", "users", [sa.text("lower(email)")], unique=True)
    op.create_index("ix_users_username_lower", "users", [sa.text("lower(username)")], unique=True)
    op.create_index("ix_users_last_location", "users", ["last_location"], postgresql_using="gist")

    op.create_table(
        "courts",
        sa.Column("id", pg.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("sport", sport, nullable=False),
        sa.Column("is_paid", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("location", point, nullable=False),
        sa.Column("address", sa.String(255)),
        sa.Column("photo_url", sa.String(512)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=now, nullable=False),
    )
    op.create_index("ix_courts_location", "courts", ["location"], postgresql_using="gist")

    op.create_table(
        "court_sessions",
        sa.Column("id", pg.UUID(as_uuid=True), primary_key=True),
        sa.Column("court_id", pg.UUID(as_uuid=True), sa.ForeignKey("courts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("holder_id", pg.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("players_count", sa.Integer, nullable=False, server_default="1"),
        sa.Column("open_to_join", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("chat_locked", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=now, nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True)),
        sa.Column("extensions", sa.Integer, nullable=False, server_default="0"),
        sa.Column("warned_at", sa.DateTime(timezone=True)),
        sa.Column("freed_notified", sa.Boolean, nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_court_sessions_court_id", "court_sessions", ["court_id"])
    # Fast lookup of open sessions (status + scheduler).
    op.create_index(
        "ix_court_sessions_open", "court_sessions", ["court_id", "expires_at"], postgresql_where=sa.text("ended_at IS NULL")
    )
    op.create_index(
        "ix_court_sessions_unnotified", "court_sessions", ["expires_at"], postgresql_where=sa.text("NOT freed_notified")
    )

    op.create_table(
        "session_participants",
        sa.Column("session_id", pg.UUID(as_uuid=True), sa.ForeignKey("court_sessions.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", pg.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=now, nullable=False),
    )
    op.create_index("ix_session_participants_user", "session_participants", ["user_id", "joined_at"])

    op.create_table(
        "court_watches",
        sa.Column("user_id", pg.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("court_id", pg.UUID(as_uuid=True), sa.ForeignKey("courts.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=now, nullable=False),
    )
    op.create_index("ix_court_watches_court", "court_watches", ["court_id"])


def downgrade() -> None:
    for t in ("court_watches", "session_participants", "court_sessions", "courts", "users"):
        op.drop_table(t)
    sport.drop(op.get_bind(), checkfirst=True)
