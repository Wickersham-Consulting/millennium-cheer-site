#!/usr/bin/env bash
# Build and deploy the Astro site to S3, then invalidate CloudFront.
# Usage: bin/deploy.sh
#
# Requires: AWS CLI configured with the wc-cwickersham profile.

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
