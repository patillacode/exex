"""
Game routes for Expresión Exprés.

This module contains all route handlers for game functionalities including
game setup, word management, turn processing, and score tracking.
"""

import random
from flask import render_template, session, request, jsonify, current_app, redirect, url_for
from app.routes.game import bp


@bp.route('/')
def index():
    """Render the game home page."""
    return render_template('index.html')


@bp.route('/setup', methods=['GET', 'POST'])
def setup():
    """Handle game setup."""
    if request.method == 'POST':
        # Get team names and points to win from form
        team1_name = request.form.get('team1_name', 'Team 1')
        team2_name = request.form.get('team2_name', 'Team 2')
        
        try:
            points_to_win = int(request.form.get('points_to_win', 10))
            # Ensure points_to_win is between 1 and 20
            points_to_win = max(1, min(20, points_to_win))
        except ValueError:
            points_to_win = 10
            
        # Initialize game session
        session.clear()
        session['team1'] = {'name': team1_name, 'points': 0}
        session['team2'] = {'name': team2_name, 'points': 0}
        session['points_to_win'] = points_to_win
        session['active_team'] = 1  # Team 1 starts
        session['used_words'] = []
        session['current_word'] = None
        session['game_state'] = 'ready'  # States: ready, playing, guessed, confirming, timer_ended
        
        return redirect(url_for('game.play'))
        
    return render_template('setup.html')


@bp.route('/play')
def play():
    """Render the main game play screen."""
    if 'team1' not in session or 'team2' not in session:
        return redirect(url_for('game.setup'))
        
    return render_template('play.html',
                          team1=session['team1'],
                          team2=session['team2'],
                          points_to_win=session['points_to_win'],
                          active_team=session['active_team'],
                          game_state=session['game_state'])


@bp.route('/api/word', methods=['GET'])
def get_word():
    """Get a new random word for the active team."""
    if 'team1' not in session or 'team2' not in session:
        return jsonify({'error': 'Game not initialized'}), 400
        
    # Get all available words
    all_words = current_app.words
    used_words = session.get('used_words', [])
    
    # Filter out already used words
    available_words = [word for word in all_words if word not in used_words]
    
    # If we've used all words, reset used_words
    if not available_words:
        available_words = all_words
        session['used_words'] = []
    
    # Select random word
    word = random.choice(available_words)
    
    # Update session
    session['current_word'] = word
    session['used_words'] = used_words + [word]
    session['game_state'] = 'playing'
    
    return jsonify({'word': word})


@bp.route('/api/guess', methods=['POST'])
def process_guess():
    """Process a team's guess."""
    if 'team1' not in session or 'team2' not in session:
        return jsonify({'error': 'Game not initialized'}), 400
        
    guessed = request.json.get('guessed', False)
    active_team = session['active_team']
    
    # Update game state based on guess
    if guessed:
        session['game_state'] = 'guessed'
    else:
        # Timer ran out
        session['game_state'] = 'timer_ended'
        
        # Give point to opposing team
        opposing_team = 2 if active_team == 1 else 1
        session[f'team{opposing_team}']['points'] += 1
    
    # Check for winner
    winner = None
    if session['team1']['points'] >= session['points_to_win']:
        winner = 1
    elif session['team2']['points'] >= session['points_to_win']:
        winner = 2
    
    return jsonify({
        'status': 'success',
        'game_state': session['game_state'],
        'team1_points': session['team1']['points'],
        'team2_points': session['team2']['points'],
        'winner': winner
    })


@bp.route('/api/confirm', methods=['POST'])
def confirm_guess():
    """Confirm a correct guess and award point."""
    if 'team1' not in session or 'team2' not in session:
        return jsonify({'error': 'Game not initialized'}), 400
        
    if session['game_state'] != 'guessed':
        return jsonify({'error': 'Invalid game state'}), 400
    
    active_team = session['active_team']
    
    # Award point to active team
    session[f'team{active_team}']['points'] += 1
    
    # Switch active team
    session['active_team'] = 2 if active_team == 1 else 1
    
    # Reset game state
    session['game_state'] = 'ready'
    session['current_word'] = None
    
    # Check for winner
    winner = None
    if session['team1']['points'] >= session['points_to_win']:
        winner = 1
    elif session['team2']['points'] >= session['points_to_win']:
        winner = 2
    
    return jsonify({
        'status': 'success',
        'game_state': session['game_state'],
        'active_team': session['active_team'],
        'team1_points': session['team1']['points'],
        'team2_points': session['team2']['points'],
        'winner': winner
    })


@bp.route('/api/extra-point', methods=['POST'])
def extra_point():
    """Process the opposing team's attempt to guess for an extra point."""
    if 'team1' not in session or 'team2' not in session:
        return jsonify({'error': 'Game not initialized'}), 400
        
    if session['game_state'] != 'timer_ended':
        return jsonify({'error': 'Invalid game state'}), 400
    
    guessed = request.json.get('guessed', False)
    active_team = session['active_team']
    opposing_team = 2 if active_team == 1 else 1
    
    # If opposing team guessed correctly, award extra point
    if guessed:
        session[f'team{opposing_team}']['points'] += 1
    
    # Switch active team
    session['active_team'] = opposing_team
    
    # Reset game state
    session['game_state'] = 'ready'
    session['current_word'] = None
    
    # Check for winner
    winner = None
    if session['team1']['points'] >= session['points_to_win']:
        winner = 1
    elif session['team2']['points'] >= session['points_to_win']:
        winner = 2
    
    return jsonify({
        'status': 'success',
        'game_state': session['game_state'],
        'active_team': session['active_team'],
        'team1_points': session['team1']['points'],
        'team2_points': session['team2']['points'],
        'winner': winner
    })


@bp.route('/api/reset', methods=['POST'])
def reset_game():
    """Reset the game but keep team names."""
    if 'team1' not in session or 'team2' not in session:
        return jsonify({'error': 'Game not initialized'}), 400
    
    team1_name = session['team1']['name']
    team2_name = session['team2']['name']
    points_to_win = session['points_to_win']
    
    # Reset game state
    session['team1'] = {'name': team1_name, 'points': 0}
    session['team2'] = {'name': team2_name, 'points': 0}
    session['points_to_win'] = points_to_win
    session['active_team'] = 1  # Team 1 starts
    session['used_words'] = []
    session['current_word'] = None
    session['game_state'] = 'ready'
    
    return jsonify({
        'status': 'success', 
        'message': 'Game reset successfully'
    })


@bp.route('/api/game-state', methods=['GET'])
def game_state():
    """Get the current game state."""
    if 'team1' not in session or 'team2' not in session:
        return jsonify({'error': 'Game not initialized'}), 400
        
    return jsonify({
        'team1': session['team1'],
        'team2': session['team2'],
        'points_to_win': session['points_to_win'],
        'active_team': session['active_team'],
        'game_state': session['game_state'],
        'current_word': session['current_word']
    })