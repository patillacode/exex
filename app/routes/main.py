"""
Main routes for the Expresión Exprés application.

This module defines the primary routes for game setup, gameplay, and state management.
"""

import json
import random
from datetime import datetime

from flask import Blueprint, current_app, jsonify, render_template, request, session

# Create blueprint
bp = Blueprint("main", __name__)


@bp.route("/")
def index():
    """Render the game setup page."""
    return render_template("index.html")


@bp.route("/game")
def game():
    """Render the main game page."""
    # Ensure game is set up
    if "game_state" not in session:
        return render_template("index.html", error="Game not initialized")

    return render_template("game.html")


@bp.route("/api/initialize", methods=["POST"])
def initialize_game():
    """Initialize a new game with teams."""
    data = request.get_json()

    # Validate team names
    if not data or "teams" not in data or len(data["teams"]) != 2:
        return jsonify({"error": "Two team names are required"}), 400

    team1 = data["teams"][0].strip()
    team2 = data["teams"][1].strip()

    if not team1 or not team2:
        return jsonify({"error": "Team names cannot be empty"}), 400
    
    # Get board length if specified
    board_length = 10
    if "boardLength" in data and isinstance(data["boardLength"], int):
        board_length = max(5, min(20, data["boardLength"]))

    # Load words
    words = _load_words()
    if not words:
        return jsonify({"error": "Failed to load game data"}), 500

    # Create new game state
    game_state = {
        "teams": [{"name": team1, "position": 0}, {"name": team2, "position": 0}],
        "current_team": 0,  # Index of the current team (0 or 1)
        "round": 1,
        "used_words": [],
        "available_words": words,
        "board_length": board_length,
        "created_at": datetime.now().isoformat(),
        "is_round_active": False
    }

    # Store in session
    session["game_state"] = game_state

    return jsonify({"success": True, "game_state": _sanitize_game_state(game_state)})


@bp.route("/api/next_turn", methods=["POST"])
def next_turn():
    """Move to the next turn without changing the round."""
    if "game_state" not in session:
        return jsonify({"error": "Game not initialized", "success": False}), 400

    game_state = session["game_state"]

    # Switch to the next team
    game_state["current_team"] = 1 - game_state["current_team"]

    # If we've gone through both teams, increment the round
    if game_state["current_team"] == 0:
        game_state["round"] += 1

    # Save the updated state
    session["game_state"] = game_state

    # Return the sanitized game state without a new word
    # New words are fetched separately in the new game flow
    return jsonify(
        {
            "success": True,
            "game_state": _sanitize_game_state(game_state)
        }
    )


@bp.route("/api/submit_result", methods=["POST"])
def submit_result():
    """Submit the result of a word guess (always success in new flow)."""
    if "game_state" not in session:
        return jsonify({"error": "Game not initialized"}), 400

    data = request.get_json()
    if not data or "success" not in data or "word" not in data:
        return jsonify({"error": "Invalid request data"}), 400

    success = data["success"]  # Always true in new flow
    word = data["word"]

    game_state = session["game_state"]

    # Record the word as used
    if word not in game_state["used_words"]:
        game_state["used_words"].append(word)

    # In new flow, points are only awarded when timer runs out
    # We still update the team index for tracking who's turn it is
    current_team_idx = game_state["current_team"]
    
    # Check for win condition
    winner = None
    if game_state["teams"][0]["position"] >= game_state["board_length"]:
        winner = 0
    elif game_state["teams"][1]["position"] >= game_state["board_length"]:
        winner = 1

    # Save the updated state
    session["game_state"] = game_state

    response = {"success": True, "game_state": _sanitize_game_state(game_state)}

    if winner is not None:
        response["winner"] = game_state["teams"][winner]["name"]

    return jsonify(response)


@bp.route("/api/reset", methods=["POST"])
def reset_game():
    """Reset the game state."""
    if "game_state" in session:
        session.pop("game_state")
    return jsonify({"success": True})


@bp.route("/api/game_state", methods=["GET"])
def get_game_state():
    """Get the current game state."""
    if "game_state" not in session:
        return jsonify({"error": "Game not initialized", "success": False}), 400
    
    game_state = session["game_state"]
    return jsonify({"success": True, "game_state": _sanitize_game_state(game_state)})


@bp.route("/api/next_word", methods=["GET"])
def get_next_word():
    """Get a new word for the current turn."""
    if "game_state" not in session:
        return jsonify({"error": "Game not initialized", "success": False}), 400
    
    game_state = session["game_state"]
    
    # Get a random word that hasn't been used yet
    word = _get_random_word(game_state)
    if not word:
        # If we've exhausted all words, reset used words and try again
        game_state["used_words"] = []
        word = _get_random_word(game_state)
        
        if not word:
            return jsonify({"error": "No more words available", "success": False}), 500
    
    return jsonify({"success": True, "word": word})


@bp.route("/api/timer", methods=["GET"])
def get_timer_duration():
    """Get a random timer duration between 30 and 90 seconds."""
    # This creates unpredictability for players as they don't know how much time they have
    duration = random.randint(30, 90)
    return jsonify({"duration": duration})



def _load_words():
    """
    Load words from the JSON file.

    Returns:
        list: List of words/expressions, or empty list if loading fails
    """
    try:
        with open(current_app.config["GAME_DATA_PATH"], "r", encoding="utf-8") as file:
            data = json.load(file)
            return data.get("words", [])
    except (FileNotFoundError, json.JSONDecodeError) as e:
        current_app.logger.error(f"Error loading words: {e}")
        return []


def _get_random_word(game_state):
    """
    Get a random word that hasn't been used yet.

    Args:
        game_state: Current game state dictionary

    Returns:
        str: A random word, or None if no words are available
    """
    available_words = [
        w for w in game_state["available_words"] if w not in game_state["used_words"]
    ]

    if not available_words:
        return None

    return random.choice(available_words)


def _sanitize_game_state(game_state):
    """
    Create a version of the game state safe for client-side use.
    Removes sensitive data or data not needed by the client.

    Args:
        game_state: Complete game state dictionary

    Returns:
        dict: Sanitized game state for client use
    """
    return {
        "teams": game_state["teams"],
        "current_team": game_state["current_team"],
        "round": game_state["round"],
        "used_words_count": len(game_state["used_words"]),
        "available_words_count": len(game_state["available_words"]),
        "board_length": game_state["board_length"],
        # Do not include timeLeft or timer information - it should be hidden from players
    }
