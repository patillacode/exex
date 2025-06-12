"""
Game logic module for Expresión Exprés.

This module contains core game logic and state management functions
for the Expresión Exprés word-guessing game.
"""

import json
import random
from datetime import datetime
from typing import Any, Dict, List, Optional


class GameState:
    """Manages the state for an Expresión Exprés game session."""

    def __init__(
        self, team1: str, team2: str, words: List[str], target_score: int = 10
    ):
        """
        Initialize a new game state.

        Args:
            team1: Name of the first team
            team2: Name of the second team
            words: List of words/expressions for the game
            target_score: Points needed to win the game
        """
        self.teams = [{"name": team1, "score": 0}, {"name": team2, "score": 0}]
        self.current_team_index = 0
        self.target_score = target_score
        self.available_words = words
        self.used_words = []
        self.round_number = 1
        self.current_word = None
        self.previous_word = None
        self.game_phase = "pre_round"  # pre_round, guessing, confirming, extra_point
        self.created_at = datetime.now()

    def get_random_word(self) -> Optional[str]:
        """
        Get a random word that hasn't been used yet.

        Returns:
            A random word, or None if all words have been used
        """
        available_words = [
            word for word in self.available_words if word not in self.used_words
        ]

        if not available_words:
            return None

        return random.choice(available_words)

    def mark_word_used(self, word: str) -> None:
        """
        Mark a word as used.

        Args:
            word: The word to mark as used
        """
        if word and word not in self.used_words:
            self.used_words.append(word)

    def award_point(self, team_index: int) -> bool:
        """
        Award a point to the specified team and check for winner.

        Args:
            team_index: Index of the team (0 or 1)

        Returns:
            True if this team has won the game, False otherwise
        """
        if team_index not in [0, 1]:
            raise ValueError("Team index must be 0 or 1")

        self.teams[team_index]["score"] += 1

        # Check if this team has won
        return self.teams[team_index]["score"] >= self.target_score

    def switch_team(self) -> None:
        """Switch to the other team."""
        self.current_team_index = 1 - self.current_team_index

    def get_opposing_team_index(self) -> int:
        """Get the index of the team that's not currently playing."""
        return 1 - self.current_team_index

    def next_round(self) -> None:
        """Advance to the next round."""
        self.round_number += 1

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert game state to a dictionary for serialization.

        Returns:
            Dictionary representation of the game state
        """
        return {
            "teams": self.teams,
            "current_team_index": self.current_team_index,
            "target_score": self.target_score,
            "used_words": self.used_words,
            "available_words": self.available_words,
            "round_number": self.round_number,
            "current_word": self.current_word,
            "previous_word": self.previous_word,
            "game_phase": self.game_phase,
            "created_at": self.created_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GameState":
        """
        Create a GameState instance from a dictionary.

        Args:
            data: Dictionary containing game state data

        Returns:
            A GameState instance
        """
        # Create an instance with required parameters
        teams = data["teams"]
        game_state = cls(
            team1=teams[0]["name"],
            team2=teams[1]["name"],
            words=data["available_words"],
            target_score=data["target_score"],
        )

        # Update remaining properties
        game_state.teams = teams
        game_state.current_team_index = data["current_team_index"]
        game_state.used_words = data["used_words"]
        game_state.round_number = data["round_number"]
        game_state.current_word = data["current_word"]
        game_state.previous_word = data["previous_word"]
        game_state.game_phase = data["game_phase"]
        game_state.created_at = datetime.fromisoformat(data["created_at"])

        return game_state


def generate_timer_duration() -> int:
    """
    Generate a random timer duration between 30 and 90 seconds.

    Returns:
        Random duration in seconds
    """
    return random.randint(30, 90)


def load_words_from_file(file_path: str) -> List[str]:
    """
    Load words/expressions from a JSON file.

    Args:
        file_path: Path to the JSON file

    Returns:
        List of words/expressions

    Raises:
        FileNotFoundError: If the file doesn't exist
        json.JSONDecodeError: If the file isn't valid JSON
    """
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)
        return data.get("words", [])


def get_client_game_state(game_state: GameState) -> Dict[str, Any]:
    """
    Create a version of the game state safe for client-side use.

    Args:
        game_state: Game state object

    Returns:
        Dictionary with relevant game state for the client
    """
    state_dict = game_state.to_dict()

    # Create a simplified version with only what the client needs
    return {
        "teams": state_dict["teams"],
        "current_team_index": state_dict["current_team_index"],
        "target_score": state_dict["target_score"],
        "round_number": state_dict["round_number"],
        "current_word": state_dict["current_word"],
        "previous_word": state_dict["previous_word"],
        "game_phase": state_dict["game_phase"],
        "words_remaining": len(state_dict["available_words"])
        - len(state_dict["used_words"]),
        "words_used": len(state_dict["used_words"]),
    }
