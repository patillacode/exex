"""
Game blueprint for Expresión Exprés.

This blueprint handles all game-related routes and functionality.
"""

from flask import Blueprint

bp = Blueprint("game", __name__, url_prefix="")

# Import routes at the bottom to avoid circular imports
from app.routes.game import routes  # noqa: F401 E402
