"""Change auth tokens to LargeBinary

Revision ID: 26f4c9b1251b
Revises: 07a4a563e670
Create Date: 2026-03-11 21:19:34.082111

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "26f4c9b1251b"
down_revision: Union[str, Sequence[str], None] = "07a4a563e670"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    with op.batch_alter_table("auth_providers", schema=None) as batch_op:
        batch_op.alter_column(
            "access_token",
            existing_type=sa.TEXT(),
            type_=sa.LargeBinary(),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "refresh_token",
            existing_type=sa.TEXT(),
            type_=sa.LargeBinary(),
            existing_nullable=True,
        )


def downgrade():
    with op.batch_alter_table("auth_providers", schema=None) as batch_op:
        batch_op.alter_column(
            "access_token",
            existing_type=sa.LargeBinary(),
            type_=sa.TEXT(),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "refresh_token",
            existing_type=sa.LargeBinary(),
            type_=sa.TEXT(),
            existing_nullable=True,
        )
