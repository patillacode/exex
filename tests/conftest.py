"""
Pytest configuration file for Expresión Exprés application tests.
"""

import os
import tempfile
import pytest
from app import create_app


@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    # Create a temporary file to isolate the database for each test
    db_fd, db_path = tempfile.mkstemp()
    
    # Create the app with test configuration
    app = create_app({
        'TESTING': True,
        'SECRET_KEY': 'test_secret_key',
        'WTF_CSRF_ENABLED': False,  # Disable CSRF protection in tests
    })
    
    # Create test words data
    with app.app_context():
        app.words = [
            "TestWord1",
            "TestWord2",
            "TestWord3",
            "TestWord4",
            "TestWord5"
        ]

    # Return the app for testing
    yield app
    
    # Close and remove the temporary file
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """A test CLI runner for the app."""
    return app.test_cli_runner()