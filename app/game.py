"""
Game logic module for Expresión Exprés.

This module contains the core game logic and state management functions
for the Expresión Exprés game.
"""

import json
import random
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


class WordManager:
    """Manages the game's word collection, selection, and tracking."""

    def __init__(self, words_data: List[str]):
        """
        Initialize the word manager.

        Args:
            words_data: List of words/expressions for the game
        """
        self.all_words = words_data
        self.used_words: List[str] = []

    def get_random_word(self) -> Optional[str]:
        """
        Get a random word that hasn't been used yet.

        Returns:
            A random word, or None if all words have been used
        """
        available_words = [w for w in self.all_words if w not in self.used_words]

        if not available_words:
            return None

        return random.choice(available_words)

    def mark_word_used(self, word: str) -> None:
        """
        Mark a word as used.

        Args:
            word: The word to mark as used
        """
        if word not in self.used_words and word in self.all_words:
            self.used_words.append(word)

    def reset(self) -> None:
        """Reset the used words list."""
        self.used_words = []

    @property
    def available_count(self) -> int:
        """Get the count of available words."""
        return len(self.all_words) - len(self.used_words)


@dataclass
class Team:
    """Represents a team in the game."""

    name: str
    position: int = 0

    def advance(self) -> None:
        """Move the team forward one position on the board."""
        self.position += 1


@dataclass
class GameState:
    """
    Represents the complete state of an Expresión Exprés game.

    This class manages the game's state including teams, positions,
    current turn, and game progression.
    """

    teams: List[Team] = field(default_factory=list)
    current_team_index: int = 0
    round_number: int = 1
    board_length: int = 10
    word_manager: Optional[WordManager] = None
    created_at: datetime = field(default_factory=datetime.now)

    @classmethod
    def create_new_game(
        cls, team1_name: str, team2_name: str, words: List[str], board_length: int = 10
    ) -> "GameState":
        """
        Create a new game with the given team names and words.

        Args:
            team1_name: Name of the first team
            team2_name: Name of the second team
            words: List of words/expressions for the game
            board_length: Number of spaces on the board

        Returns:
            A new GameState instance
        """
        teams = [Team(team1_name), Team(team2_name)]
        word_manager = WordManager(words)

        return cls(
            teams=teams,
            current_team_index=0,
            round_number=1,
            board_length=board_length,
            word_manager=word_manager,
        )

    def next_turn(self) -> None:
        """
        Advance to the next team's turn.

        This method switches the current team and updates the round number
        if necessary.
        """
        self.current_team_index = 1 - self.current_team_index  # Toggle between 0 and 1

        # If we've gone through both teams, increment the round
        if self.current_team_index == 0:
            self.round_number += 1

    def current_team(self) -> Team:
        """Get the currently active team."""
        return self.teams[self.current_team_index]

    def other_team(self) -> Team:
        """Get the team that's not currently active."""
        return self.teams[1 - self.current_team_index]

    def handle_turn_result(self, success: bool, word: str) -> Optional[Team]:
        """
        Process the result of a turn and check for a winner.

        Args:
            success: Whether the current team guessed correctly
            word: The word that was in play

        Returns:
            The winning team if the game is over, otherwise None
        """
        # Mark the word as used
        if self.word_manager:
            self.word_manager.mark_word_used(word)

        # Update positions based on result
        if success:
            # Current team advances
            self.current_team().advance()
        else:
            # Other team advances
            self.other_team().advance()

        # Check for winner
        for team in self.teams:
            if team.position >= self.board_length:
                return team

        return None

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the game state to a dictionary for serialization.

        Returns:
            Dictionary representation of the game state
        """
        return {
            "teams": [
                {"name": team.name, "position": team.position} for team in self.teams
            ],
            "current_team": self.current_team_index,
            "round": self.round_number,
            "board_length": self.board_length,
            "used_words": self.word_manager.used_words if self.word_manager else [],
            "available_words_count": self.word_manager.available_count
            if self.word_manager
            else 0,
            "created_at": self.created_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any], words: List[str]) -> "GameState":
        """
        Create a GameState instance from a dictionary.

        Args:
            data: Dictionary containing game state data
            words: List of all words/expressions for the game

        Returns:
            A GameState instance
        """
        teams = [Team(t["name"], t["position"]) for t in data["teams"]]

        word_manager = WordManager(words)
        word_manager.used_words = data.get("used_words", [])

        return cls(
            teams=teams,
            current_team_index=data["current_team"],
            round_number=data["round"],
            board_length=data["board_length"],
            word_manager=word_manager,
            created_at=datetime.fromisoformat(data["created_at"]),
        )


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
