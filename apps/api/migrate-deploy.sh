#!/bin/sh
# Prisma 7 with a multi-file schema looks for migrations next to the datasource
# file unless migrations.path is set. Even then, a production database created
# before Migrate history existed fails deploy with P3005 (non-empty DB, no
# _prisma_migrations). Baseline the already-applied historical migrations, then
# retry so pending ones (e.g. archived) can run.
set -eu

if pnpm exec prisma migrate deploy; then
  exit 0
fi

echo "prisma migrate deploy failed; baselining existing production schema" >&2
pnpm exec prisma migrate resolve --applied 20260625000000_init || true
pnpm exec prisma migrate resolve --applied 20260625000000_drop_ratings_comments || true
pnpm exec prisma migrate deploy
