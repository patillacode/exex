#!/usr/bin/env python
"""
Expresión Exprés Game - Entry Point

This script starts the Flask application for the Expresión Exprés word-guessing game.
"""

import os

from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

from app import create_app  # noqa: E402

app = create_app()

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host=host, port=port, debug=debug)
