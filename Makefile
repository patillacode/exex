# Expresión Exprés (ExEx) Web App Makefile
# This Makefile provides commands for developing, testing, and running the application

.PHONY: help install clean run test coverage docker-build docker-up docker-down docker-test

# Python and virtual environment settings
PYTHON := python3
VENV := venv
VENV_BIN := $(VENV)/bin
PIP := $(VENV_BIN)/pip
FLASK := $(VENV_BIN)/flask
PYTEST := $(VENV_BIN)/pytest
COVERAGE := $(VENV_BIN)/coverage

# Docker settings
DOCKER_COMPOSE := docker-compose

# Default target - show help
help:
	@echo "Expresión Exprés (ExEx) Web App Makefile"
	@echo ""
	@echo "Usage:"
	@echo "  make install    - Create virtual environment and install dependencies"
	@echo "  make clean      - Remove virtual environment and cache files"
	@echo "  make run        - Run the application locally"
	@echo "  make test       - Run tests"
	@echo "  make coverage   - Run tests with coverage report"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-up  - Start the application in Docker"
	@echo "  make docker-down - Stop Docker containers"
	@echo "  make docker-test - Run tests in Docker container"
	@echo "  make help       - Show this help message"

# Create virtual environment and install dependencies
install:
	@echo "Creating virtual environment and installing dependencies..."
	@$(PYTHON) -m venv $(VENV)
	@$(PIP) install --upgrade pip
	@$(PIP) install -r requirements.txt
	@echo "Installation complete! You can now run 'make run' to start the application."

# Run the application locally
run:
	@echo "Starting the application..."
	@$(FLASK) run --debug

# Run tests
test:
	@echo "Running tests..."
	@$(PYTEST) -v tests/

# Run tests with coverage
coverage:
	@echo "Running tests with coverage..."
	@$(COVERAGE) run -m pytest
	@$(COVERAGE) report
	@$(COVERAGE) html
	@echo "HTML coverage report generated in htmlcov/ directory"

# Build Docker image
docker-build:
	@echo "Building Docker image..."
	@$(DOCKER_COMPOSE) build
build: docker-build

# Start the application in Docker
docker-up:
	@echo "Starting the application in Docker..."
	@$(DOCKER_COMPOSE) up

up: docker-up

# Start the application in Docker (detached mode)
docker-up-d:
	@echo "Starting the application in Docker (detached)..."
	@$(DOCKER_COMPOSE) up -d

# Stop Docker containers
docker-down:
	@echo "Stopping Docker containers..."
	@$(DOCKER_COMPOSE) down

# Run tests in Docker container
docker-test:
	@echo "Running tests in Docker container..."
	@$(DOCKER_COMPOSE) run --rm web $(PYTHON) -m pytest -v tests/

# Run tests with coverage in Docker container
docker-coverage:
	@echo "Running tests with coverage in Docker container..."
	@$(DOCKER_COMPOSE) run --rm web $(COVERAGE) run -m pytest
	@$(DOCKER_COMPOSE) run --rm web $(COVERAGE) report
dcov: docker-coverage
