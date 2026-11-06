#!/bin/sh
set -e

npx prisma migrate deploy
node dist/prisma/seed.js

# exec: приложение становится процессом PID 1 и получает SIGTERM от docker stop.
exec node dist/src/main.js
