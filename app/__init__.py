"""
Expresión Exprés (ExEx) Flask Application.

This module initializes the Flask application with appropriate configurations
and registers all necessary blueprints and extensions.
"""

import json
import os
import secrets
from datetime import datetime

from flask import Flask
from flask_wtf.csrf import CSRFProtect


def create_app(test_config=None):
    """Create and configure the Flask application."""
    app = Flask(__name__, instance_relative_config=True)

    # Default configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", secrets.token_hex(32)),
        WORDS_FILE=os.path.join(app.root_path, "words.json"),
        MAX_POINTS=10,  # Default maximum points to win
        WTF_CSRF_TIME_LIMIT=3600,  # 1 hour CSRF token expiry
    )

    if test_config is None:
        # Load the instance config, if it exists, when not testing
        app.config.from_pyfile("config.py", silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)

    # Initialize CSRF protection
    CSRFProtect(app)

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Load game words
    with open(app.config["WORDS_FILE"], "r", encoding="utf-8") as f:
        app.words = json.load(f)["words"]

    # Register blueprints
    from app.routes.game import bp as game_bp

    app.register_blueprint(game_bp)

    # Add simple health check route
    @app.route("/health")
    def health_check():
        return {"status": "healthy", "timestamp": datetime.now().isoformat()}

    # Register context processors
    @app.context_processor
    def utility_processor():
        def now(format_str=None):
            if format_str == "year":
                return datetime.now().year
            return datetime.now()

        return dict(now=now)

    return app
