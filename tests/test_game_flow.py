"""
Tests for the game flow of Expresión Exprés.

These tests verify that the game flow works as expected,
including word selection, turn management, and scoring.
"""


class TestGameFlow:
    """Test suite for game flow functionality."""

    def test_complete_game_flow(self, client):
        """Test a complete game flow scenario."""
        # Set up the game
        client.post(
            "/setup",
            data={
                "team1_name": "Azul",
                "team2_name": "Rojo",
                "points_to_win": "3",  # Short game for testing
            },
            follow_redirects=True,
        )

        # Verify initial game state
        with client.session_transaction() as sess:
            assert sess["team1"]["name"] == "Azul"
            assert sess["team2"]["name"] == "Rojo"
            assert sess["points_to_win"] == 3
            assert sess["active_team"] == 1
            assert sess["game_state"] == "ready"

        # Get a word
        response = client.get("/api/word")
        assert response.status_code == 200
        word_data = response.get_json()
        assert "word" in word_data

        # Check game state after getting word
        with client.session_transaction() as sess:
            assert sess["game_state"] == "playing"
            assert sess["current_word"] == word_data["word"]

        # Team 1 guesses correctly
        response = client.post("/api/guess", json={"guessed": True})
        assert response.status_code == 200
        guess_data = response.get_json()
        assert guess_data["game_state"] == "guessed"

        # Team 2 confirms the guess
        response = client.post("/api/confirm")
        assert response.status_code == 200
        confirm_data = response.get_json()
        assert confirm_data["team1_points"] == 1
        assert confirm_data["active_team"] == 2
        assert confirm_data["game_state"] == "ready"

        # Team 2 gets a word
        response = client.get("/api/word")
        assert response.status_code == 200

        # Team 2 fails to guess (timer ends)
        response = client.post("/api/guess", json={"guessed": False})
        assert response.status_code == 200
        failed_guess_data = response.get_json()
        assert failed_guess_data["game_state"] == "timer_ended"
        assert failed_guess_data["team1_points"] == 2  # Team 1 gets a point

        # Team 1 attempts extra point and succeeds
        response = client.post("/api/extra-point", json={"guessed": True})
        assert response.status_code == 200
        extra_point_data = response.get_json()
        assert extra_point_data["team1_points"] == 3  # Team 1 gets extra point

        # Check if game is over (Team 1 should have won)
        assert extra_point_data["winner"] == 1

        # Reset the game
        response = client.post("/api/reset")
        assert response.status_code == 200

        # Verify reset state
        with client.session_transaction() as sess:
            assert sess["team1"]["points"] == 0
            assert sess["team2"]["points"] == 0
            assert sess["active_team"] == 1
            assert sess["game_state"] == "ready"

    def test_word_selection(self, client):
        """Test that words are selected properly and not repeated until all used."""
        # Set up the game
        client.post(
            "/setup",
            data={
                "team1_name": "Team A",
                "team2_name": "Team B",
                "points_to_win": "10",
            },
        )

        # Get several words and track them
        used_words = set()
        for _ in range(5):  # Our test app has 5 test words
            response = client.get("/api/word")
            word = response.get_json()["word"]
            used_words.add(word)

            # Confirm the word to move to next turn
            client.post("/api/guess", json={"guessed": True})
            client.post("/api/confirm")

        # We should have seen 5 unique words
        assert len(used_words) == 5

        # Get one more word - it should be from the original set
        # because we've used all available words
        response = client.get("/api/word")
        word = response.get_json()["word"]
        assert word in used_words

        # Check that used_words was reset
        with client.session_transaction() as sess:
            assert len(sess["used_words"]) == 1

    def test_game_state_api(self, client):
        """Test the game state API endpoint."""
        # Set up the game
        client.post(
            "/setup", data={"team1_name": "X", "team2_name": "Y", "points_to_win": "7"}
        )

        # Get game state
        response = client.get("/api/game-state")
        assert response.status_code == 200

        state = response.get_json()
        assert state["team1"]["name"] == "X"
        assert state["team2"]["name"] == "Y"
        assert state["points_to_win"] == 7
        assert state["active_team"] == 1
        assert state["game_state"] == "ready"
        assert state["current_word"] is None
