#!/bin/bash

set -e

host="$1"
shift
cmd="$@"

until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$host" -U "$POSTGRES_USER" -c '\l' && redis-cli -h "redis"; do
  >&2 echo "Postgres and redis are unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres and redis are up - executing command"
exec $cmd
