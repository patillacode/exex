"""
Expresión Exprés (ExEx) Flask Application.

This module initializes the Flask application with appropriate configurations
and registers all necessary blueprints and extensions.
"""

import os
from datetime import datetime

from flask import Flask


def create_app(test_config=None):
    """
    Create and configure the Flask application.

    Args:
        test_config: Configuration dictionary for testing (optional)

    Returns:
        app: Configured Flask application instance
    """
    # Create Flask app with instance_relative_config for configurations
    app = Flask(__name__, instance_relative_config=True)

    # Set default configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev-key-for-development-only"),
        GAME_DATA_PATH=os.path.join(app.root_path, "words.json"),
    )

    if test_config is None:
        # Load instance config if it exists and not testing
        app.config.from_pyfile("config.py", silent=True)
    else:
        # Load test config if passed
        app.config.from_mapping(test_config)

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Register error handlers
    register_error_handlers(app)

    # Register routes
    from app.routes import main

    app.register_blueprint(main.bp)

    # Register context processors
    register_context_processors(app)

    # Register CLI commands if needed
    register_commands(app)

    return app


def register_error_handlers(app):
    """
    Register custom error handlers for the application.

    Args:
        app: Flask application instance
    """

    @app.errorhandler(404)
    def page_not_found(e):
        return {"error": "Page not found"}, 404

    @app.errorhandler(500)
    def server_error(e):
        return {"error": "Internal server error"}, 500


def register_context_processors(app):
    """
    Register context processors for templates.

    Args:
        app: Flask application instance
    """

    @app.context_processor
    def inject_now():
        return {"now": datetime.now}


def register_commands(app):
    """
    Register CLI commands with the application.

    Args:
        app: Flask application instance
    """

    @app.cli.command("init-db")
    def init_db_command():
        """Initialize game data."""
        # Could be used to reset game data or validate JSON files
        print("Game data initialized.")
