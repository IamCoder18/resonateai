#!/bin/sh
set -eu

if [ -f "${S3_CREDENTIALS_FILE:-/shared/garage.env}" ]; then
  set -a
  # shellcheck disable=SC1090
  . "${S3_CREDENTIALS_FILE}"
  set +a
fi

if [ "${1:-}" = "node" ]; then
  shift
fi

exec node server.js "$@"
