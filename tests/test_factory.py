"""
Tests for the Expresión Exprés application factory.
"""

from app import create_app


def test_config():
    """Test create_app without passing test config."""
    assert not create_app().testing
    assert create_app({"TESTING": True}).testing


def test_index(client):
    """Test the index route."""
    response = client.get('/')
    assert response.status_code == 200
    assert b'Expresi\xc3\xb3n Expr\xc3\xa9s' in response.data


def test_health_check(client):
    """Test health check endpoint."""
    response = client.get('/health')
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['status'] == 'healthy'
    assert 'timestamp' in json_data


def test_setup_get(client):
    """Test setup page GET."""
    response = client.get('/setup')
    assert response.status_code == 200
    assert b'Configuraci\xc3\xb3n del Juego' in response.data


def test_setup_post(client):
    """Test setup page POST."""
    response = client.post('/setup', data={
        'team1_name': 'Test Team 1',
        'team2_name': 'Test Team 2',
        'points_to_win': '5'
    }, follow_redirects=True)
    
    assert response.status_code == 200
    assert b'Test Team 1' in response.data
    assert b'Test Team 2' in response.data


def test_word_api_without_session(client):
    """Test word API endpoint without an initialized session."""
    response = client.get('/api/word')
    assert response.status_code == 400
    assert response.get_json()['error'] == 'Game not initialized'


def test_game_state_api_without_session(client):
    """Test game state API endpoint without an initialized session."""
    response = client.get('/api/game-state')
    assert response.status_code == 400
    assert response.get_json()['error'] == 'Game not initialized'