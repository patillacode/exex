#!/usr/bin/env python
"""
Expresión Exprés Game - Entry Point

This script starts the Flask application for the Expresión Exprés game.
"""

import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    # Use environment variable PORT if available (for deployment compatibility)
    # Otherwise use default port 5000
    port = int(os.environ.get('PORT', 5000))
    
    # In development, enable debug mode and allow connections from any host
    if os.environ.get('FLASK_ENV') == 'development':
        app.run(host='0.0.0.0', port=port, debug=True)
    else:
        app.run(host='0.0.0.0', port=port)