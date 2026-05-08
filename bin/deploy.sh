#!/usr/bin/env bash
# Build and deploy the Astro site to S3, then invalidate CloudFront.
# Usage: bin/deploy.sh
#
# Requires: AWS CLI configured with the wc-cwickersham profile.
#
# This is the LOCAL deploy fallback. The normal flow is the GitHub Actions
# `deploy.yml` workflow that auto-runs on every push to `main` (and is
# manually triggerable via "Run workflow"). Use this script when:
#   - GitHub Actions is down or you need to deploy from offline
#   - You're testing a build locally and want to see it on the real domain
#     without going through a PR (avoid for production use; PR is the gate)

set -euo pipefail

BUCKET="${BUCKET:-wc-site-cheer-booster-010119294271}"
DISTRIBUTION_ID="${DISTRIBUTION_ID:-EKLNEPIFRDBX1}"
AWS_PROFILE="${AWS_PROFILE:-wc-cwickersham}"

cd "$(dirname "$0")/.."

echo "==> Building site..."
npm run build

echo "==> Syncing to s3://${BUCKET}/ ..."
aws s3 sync ./dist/ "s3://${BUCKET}/" \
  --delete \
  --profile "${AWS_PROFILE}"

echo "==> Invalidating CloudFront cache (distribution ${DISTRIBUTION_ID})..."
aws cloudfront create-invalidation \
  --distribution-id "${DISTRIBUTION_ID}" \
  --paths '/*' \
  --profile "${AWS_PROFILE}" \
  --query 'Invalidation.{Id: Id, Status: Status}' \
  --output table

echo "==> Done. Cache will clear in ~30s."
