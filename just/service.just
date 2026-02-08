# Start services
[group('service')]
up:
    docker compose up -d

# Stop services
[group('service')]
down:
    docker compose down

# Restart services
[group('service')]
restart:
    docker compose restart

# Pull latest images and recreate containers
[group('service')]
update:
    docker compose pull && docker compose up -d

# Follow container logs (optionally pass a service name)
[group('service')]
logs *args:
    docker compose logs -f {{args}}

# Rebuild and restart (for code changes)
[group('service')]
rebuild:
    docker compose down && docker compose build && docker compose up -d
