"""
Basic tests for the Expresión Exprés Flask application.
"""

import json
import os
import sys
import unittest

# Add the parent directory to the path so we can import the app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app


class ExexTestCase(unittest.TestCase):
    """Test case for the Expresión Exprés application."""

    def setUp(self):
        """Set up test client and app config."""
        self.app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "test",
                "GAME_DATA_PATH": os.path.join(
                    os.path.dirname(__file__), "../app/words.json"
                ),
            }
        )
        self.client = self.app.test_client()
        # self.client.testing = True

    def test_index_page(self):
        """Test that the index page loads correctly."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Expresi\xc3\xb3n Expr\xc3\xa9s", response.data)

    def test_game_initialization(self):
        """Test game initialization API."""
        response = self.client.post(
            "/api/initialize",
            data=json.dumps({"teams": ["Team1", "Team2"], "boardLength": 15}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertIn("game_state", data)
        self.assertEqual(len(data["game_state"]["teams"]), 2)
        self.assertEqual(data["game_state"]["teams"][0]["name"], "Team1")
        self.assertEqual(data["game_state"]["board_length"], 15)

    def test_timer_endpoint(self):
        """Test that the timer endpoint returns a valid duration."""
        response = self.client.get("/api/timer")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("duration", data)
        self.assertTrue(30 <= data["duration"] <= 90)

    def test_game_reset(self):
        """Test game reset functionality."""
        # First initialize a game
        self.client.post(
            "/api/initialize",
            data=json.dumps({"teams": ["TeamA", "TeamB"]}),
            content_type="application/json",
        )
        
        # Then reset it
        response = self.client.post("/api/reset")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        
        # Try to access the game page, should redirect or show error
        with self.client.session_transaction() as sess:
            self.assertNotIn("game_state", sess)

    def test_game_state_endpoint(self):
        """Test the game state API endpoint."""
        # First, try without initializing a game
        response = self.client.get("/api/game_state")
        self.assertEqual(response.status_code, 400)
        
        # Initialize a game
        self.client.post(
            "/api/initialize",
            data=json.dumps({"teams": ["Team1", "Team2"]}),
            content_type="application/json",
        )
        
        # Now game state should return properly
        response = self.client.get("/api/game_state")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertIn("game_state", data)
        self.assertEqual(len(data["game_state"]["teams"]), 2)
        
        # Ensure the game state includes the required fields for the new game flow
        game_state = data["game_state"]
        self.assertIn("teams", game_state)
        self.assertIn("current_team", game_state)
        self.assertIn("round", game_state)
        self.assertIn("board_length", game_state)

    def test_next_word_endpoint(self):
        """Test the next word API endpoint."""
        # First, try without initializing a game
        response = self.client.get("/api/next_word")
        self.assertEqual(response.status_code, 400)
        
        # Initialize a game
        self.client.post(
            "/api/initialize",
            data=json.dumps({"teams": ["Team1", "Team2"]}),
            content_type="application/json",
        )
        
        # Get a word
        response = self.client.get("/api/next_word")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        self.assertIn("word", data)
        self.assertIsInstance(data["word"], str)
        self.assertTrue(len(data["word"]) > 0)
        
        # Get multiple words to test word selection doesn't repeat
        first_word = data["word"]
        
        # Get several words and ensure no duplicates in sequence
        words = [first_word]
        for _ in range(5):
            response = self.client.get("/api/next_word")
            self.assertEqual(response.status_code, 200)
            data = json.loads(response.data)
            self.assertTrue(data["success"])
            # Should not be the same as the immediately previous word
            self.assertNotEqual(data["word"], words[-1])
            words.append(data["word"])

    def test_submit_result(self):
        """Test submitting a word result."""
        # Initialize a game
        self.client.post(
            "/api/initialize",
            data=json.dumps({"teams": ["Team1", "Team2"]}),
            content_type="application/json",
        )
        
        # Get a word first
        response = self.client.get("/api/next_word")
        data = json.loads(response.data)
        word = data["word"]
        
        # Submit result for the word
        response = self.client.post(
            "/api/submit_result",
            data=json.dumps({"success": True, "word": word}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data["success"])
        
        # Verify the word is marked as used
        response = self.client.get("/api/game_state")
        data = json.loads(response.data)
        self.assertEqual(data["game_state"]["used_words_count"], 1)
        
        # Check that team switch happened
        self.assertEqual(data["game_state"]["current_team"], 1)  # Switched from 0 to 1


if __name__ == "__main__":
    unittest.main()
