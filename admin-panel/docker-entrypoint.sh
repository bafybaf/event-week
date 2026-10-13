#!/bin/sh
set -eu

ORIGIN="${REACT_APP_API_URL:-}"
printf "window.__API_ORIGIN__='%s';\n" "$ORIGIN" > /usr/share/nginx/html/env.js

exec nginx -g 'daemon off;'
