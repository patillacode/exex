"""
Main routes for the Expresión Exprés application.

This module defines the primary routes for game setup, gameplay, and state management.

Game Flow:
1. Game setup occurs on the index page where teams are formed
2. Teams take turns guessing words
3. When a team guesses correctly, they pass the device to the other team
4. The receiving team confirms the word was guessed correctly
5. After confirming, they receive a new word to guess
6. This continues until the timer runs out
7. When timer runs out, the opposing team gets a point
8. First team to reach the end of the board wins
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
    """Initialize a new game with teams and the game board."""
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
        "is_round_active": False,
        "is_confirmation_needed": False,
        "current_word": None,
        "previous_word": None,
        "timer_active": False,
    }

    # Store in session
    session["game_state"] = game_state

    return jsonify({"success": True, "game_state": _sanitize_game_state(game_state)})


@bp.route("/api/next_turn", methods=["POST"])
def next_turn():
    """
    Move to the next turn without changing the round.

    This handles:
    - Normal turn transitions when passing the device
    - Timer end events (where other team gets points)
    - Updating the confirmation flags for proper UI flow
    """
    if "game_state" not in session:
        return jsonify({"error": "Game not initialized", "success": False}), 400

    game_state = session["game_state"]

    # Get request data to check if timer ended and point should be awarded
    data = request.get_json()
    timer_ended = data.get("timer_ended", False) if data else False

    # If timer ended, award point to the other team
    if timer_ended:
        # Award point to the other team (timer ran out)
        other_team_idx = 1 - game_state["current_team"]
        game_state["teams"][other_team_idx]["position"] += 1

        # Mark the current word as used
        current_word = game_state.get("current_word")
        if current_word and current_word not in game_state["used_words"]:
            game_state["used_words"].append(current_word)

        # For timer end, we don't switch teams yet - the team that failed to guess stays as current team
        # This is because the opposing team gets the point AND the chance for an extra point
        # We'll store a flag to indicate timer ended, so we can handle team transition later
        game_state["timer_ended"] = True
        game_state["is_confirmation_needed"] = False
    else:
        # This is a normal team switch (not timer ended)
        # Switch to the next team
        game_state["current_team"] = 1 - game_state["current_team"]

        # If we've gone through both teams, increment the round
        if game_state["current_team"] == 0:
            game_state["round"] += 1

        # Normal team switch - confirmation needed
        game_state["is_confirmation_needed"] = True
        # Reset timer ended flag if it was set
        game_state["timer_ended"] = False

    # Save the updated state
    session["game_state"] = game_state

    # Check for win condition
    winner = None
    if game_state["teams"][0]["position"] >= game_state["board_length"]:
        winner = 0
    elif game_state["teams"][1]["position"] >= game_state["board_length"]:
        winner = 1

    # Build response
    response = {"success": True, "game_state": _sanitize_game_state(game_state)}

    if winner is not None:
        response["winner"] = game_state["teams"][winner]["name"]

    # Return the sanitized game state without a new word
    # New words are fetched separately in the new game flow
    return jsonify(response)


@bp.route("/api/submit_result", methods=["POST"])
def submit_result():
    """
    Submit the result of a word guess.

    In the current game flow:
    - Regular word submissions mark the word as used
    - Extra point attempts can award an additional point to a team
    - Points are primarily awarded when timer runs out (handled by next_turn)
    """
    if "game_state" not in session:
        return jsonify({"error": "Game not initialized", "success": False}), 400

    data = request.get_json()
    if not data or "word" not in data:
        return jsonify({"error": "Invalid request data", "success": False}), 400

    word = data["word"]
    extra_point = data.get("extra_point", False)

    game_state = session["game_state"]

    # Record the word as used
    if word not in game_state["used_words"]:
        game_state["used_words"].append(word)

    # Update current and previous word tracking
    game_state["previous_word"] = game_state.get("current_word")

    # Track current team
    current_team_idx = game_state["current_team"]

    # If this is an extra point attempt, award point to the other team (which already got a point when timer ended)
    if extra_point:
        other_team_idx = 1 - current_team_idx
        game_state["teams"][other_team_idx]["position"] += 1

        # Reset confirmation needed after extra point
        game_state["is_confirmation_needed"] = False

        # Also reset round active flag
        game_state["is_round_active"] = False

        # Now that extra point has been processed, switch to the other team for next round
        game_state["current_team"] = other_team_idx
        game_state["timer_ended"] = False
    elif game_state.get("is_confirmation_needed", False):
        # If this is a confirmation, mark that it's been handled
        game_state["is_confirmation_needed"] = False

    # Check for win condition
    winner = None
    if game_state["teams"][0]["position"] >= game_state["board_length"]:
        winner = 0
    elif game_state["teams"][1]["position"] >= game_state["board_length"]:
        winner = 1

    # Save the updated state
    session["game_state"] = game_state

    # Build and return response
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
    """
    Get a new word for the current turn.

    Called after a team confirms the previous team's correct guess
    or at the start of the game. This endpoint also:
    - Updates the game state to track the current word
    - Resets the confirmation flag
    - Ensures the round is marked as active
    """
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

    # Update the current word in the game state
    game_state["current_word"] = word

    # If this is after a confirmation, turn off confirmation flag
    game_state["is_confirmation_needed"] = False

    # Ensure round is active and reset timer ended flag
    game_state["is_round_active"] = True
    game_state["timer_ended"] = False

    # Save updated state
    session["game_state"] = game_state

    return jsonify({"success": True, "word": word})


@bp.route("/api/timer", methods=["GET"])
def get_timer_duration():
    """
    Get a random timer duration between 30 and 90 seconds.

    This creates unpredictability for players as they don't know how much time they have.
    The randomness is part of the game's excitement - players need to guess quickly
    as they don't know exactly when the timer will end.
    """
    duration = random.randint(30, 90)

    # If game state exists, mark the round as active
    if "game_state" in session:
        game_state = session["game_state"]
        game_state["is_round_active"] = True
        session["game_state"] = game_state

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
        # Team information for displaying positions on board
        "teams": game_state["teams"],
        "current_team": game_state["current_team"],
        "round": game_state["round"],
        # Word counts for UI display purposes
        "used_words_count": len(game_state["used_words"]),
        "available_words_count": len(game_state["available_words"]),
        # Game board configuration
        "board_length": game_state["board_length"],
        # Game flow state flags
        "is_round_active": game_state.get("is_round_active", False),
        "is_confirmation_needed": game_state.get("is_confirmation_needed", False),
        "timer_ended": game_state.get("timer_ended", False),
        # Current and previous words for proper game flow
        "current_word": game_state.get("current_word"),
        "previous_word": game_state.get("previous_word"),
        # Game state tracking flag for timer end handling
        "timer_ended": game_state.get("timer_ended", False),
        # Do not include timeLeft or timer information - it should be hidden from players
        # This ensures the unpredictable timer aspect of the game works correctly
    }
