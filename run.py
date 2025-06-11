#!/usr/bin/env python
"""
Expresión Exprés Game - Entry Point

This script starts the Flask application for the Expresión Exprés word-guessing game.
"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
