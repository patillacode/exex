# Environment Configuration for Expresión Exprés

This document explains how to configure the environment settings for both development and production deployments.

## Overview

Expresión Exprés uses environment variables to configure various aspects of the application. 
These variables can be set in three ways:
- Through a `.env` file (recommended for development)
- Directly in the environment (recommended for production)
- Through Docker environment variables (via docker-compose or container options)

## Configuration Files

The application includes several environment-related files:

- `.env.example`: Template with all available configuration options
- `.env`: Development environment settings (not committed to version control)
- `.env.production`: Production environment template (rename to `.env` in production)

## Key Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| FLASK_APP | Python file that runs the application | run.py |
| FLASK_DEBUG | Enable debug mode (1=True, 0=False) | 0 (production), 1 (dev) |
| SECRET_KEY | Secret key for session encryption | Random key (dev) |
| ALLOWED_HOSTS | Comma-separated list of allowed hosts | localhost,127.0.0.1 |
| HOST | IP address to listen on | 0.0.0.0 |
| PORT | Port to listen on | 5000 |
| MAX_POINTS | Points needed to win the game | 10 |
| LOG_LEVEL | Logging level (DEBUG, INFO, WARNING, ERROR) | INFO |

## Development Setup

For local development:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your preferred settings.

3. Run the application using Docker:
   ```bash
   docker-compose up
   ```

   Or directly with Flask:
   ```bash
   # Activate virtual environment first
   flask run
   ```

## Production Setup

For production deployment:

1. Create a production `.env` file:
   ```bash
   cp .env.production .env
   ```
   
2. Replace the SECRET_KEY with a secure random string:
   ```bash
   # Generate a random key and update .env
   python -c 'import secrets; print(f"SECRET_KEY={secrets.token_hex(32)}")' >> .env
   ```
   
3. Update the ALLOWED_HOSTS to include your domain name(s).

4. Set FLASK_DEBUG=0 to ensure debug mode is disabled in production.

5. Deploy using Docker:
   ```bash
   docker-compose up -d
   ```

## Using Environment Variables with Docker

Docker Compose will automatically read variables from the `.env` file in the project directory.

For manual Docker deployments, you can pass environment variables using the `-e` flag:

```bash
docker run -p 5000:5000 -e SECRET_KEY=your-secret-key -e ALLOWED_HOSTS=yourdomain.com exex:latest
```

## Overriding Environment Variables

The precedence order for environment variables is:

1. Values explicitly passed to Docker
2. Values in the `.env` file
3. Default values defined in the application code

## Security Considerations

- Never commit `.env` files with production secrets to version control
- Generate a unique SECRET_KEY for each production deployment
- In production, limit ALLOWED_HOSTS to only the necessary domains
- Set FLASK_DEBUG=0 in production to avoid exposing debug information