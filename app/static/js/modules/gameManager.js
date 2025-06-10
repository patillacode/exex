/**
 * Game Manager Module for Expresión Exprés
 * 
 * Main module that coordinates game flow, state management,
 * and interaction between different game components.
 */

import GameBoard from './gameBoard.js';
import TimerManager from './timer.js';
import WordDisplay from './wordDisplay.js';
import TeamManager from './teamManager.js';

export default class GameManager {
    /**
     * Initialize the game manager
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            apiUrls: {
                gameState: '/api/game_state',
                nextTurn: '/api/next_turn',
                nextWord: '/api/next_word',
                timer: '/api/timer',
                submitResult: '/api/submit_result',
                reset: '/api/reset',
                passingDelay: 500 // ms to wait during device passing
            },
            selectors: {
                turnOverlay: '#turn-overlay',
                currentTeamName: '#current-team-name',
                turnCountdown: '#turn-countdown',
                readyBtn: '#ready-btn',
                winOverlay: '#win-overlay',
                winnerName: '#winner-name',
                playAgainBtn: '#play-again-btn',
                resetGameBtn: '#reset-game-btn',
                startRoundBtn: '#start-round-btn',
                confirmWordBtn: '#confirm-word-btn',
                roundStatus: '#round-status',
                timerEndOverlay: '#timer-end-overlay',
                otherTeamName: '#other-team-name',
                tryGuessBtn: '#try-guess-btn',
                skipGuessBtn: '#skip-guess-btn',
                extraPointOverlay: '#extra-point-overlay',
                revealedWord: '#revealed-word',
                correctGuessBtn: '#correct-guess-btn',
                wrongGuessBtn: '#wrong-guess-btn'
            },
            ...config
        };
        
        // Game state
        this.gameState = {
            teams: [],
            currentTeam: 0,
            round: 1,
            boardLength: 10,
            currentWord: null,
            previousWord: null,
            isTimerActive: false,
            isRoundActive: false,
            isConfirmationNeeded: false,
            extraPointAwarded: false
        };
        
        // Initialize components
        this.gameBoard = new GameBoard();
        this.timer = new TimerManager({
            onTick: this.updateTimerUI.bind(this),
            onComplete: this.handleTimerEnd.bind(this),
            onBeep: this.playBeep.bind(this)
        });
        this.wordDisplay = new WordDisplay();
        this.teamManager = new TeamManager();
        
        // DOM elements
        this.elements = {};
        this.initElements();
        
        // Audio elements
        this.sounds = {
            beep: new Audio('/static/sounds/beep.mp3'),
            buzzer: new Audio('/static/sounds/buzzer.mp3')
        };
        
        // Configure audio
        this.sounds.beep.volume = 0.7;
        this.sounds.buzzer.volume = 0.8;
    }
    
    /**
     * Initialize DOM elements
     */
    initElements() {
        // Get all elements defined in selectors
        Object.entries(this.config.selectors).forEach(([key, selector]) => {
            this.elements[key] = document.querySelector(selector);
        });
    }
    
    /**
     * Initialize the game
     */
    init() {
        this.setupEventListeners();
        this.fetchGameState();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Ready button (confirm device has been passed)
        if (this.elements.readyBtn) {
            this.elements.readyBtn.addEventListener('click', this.handleDevicePassed.bind(this));
        }
        
        // Start round button
        if (this.elements.startRoundBtn) {
            this.elements.startRoundBtn.addEventListener('click', this.startRound.bind(this));
        }
        
        // Confirm word button (for the receiving team)
        if (this.elements.confirmWordBtn) {
            this.elements.confirmWordBtn.addEventListener('click', this.handleWordConfirmed.bind(this));
        }
        
        // Reset game button
        if (this.elements.resetGameBtn) {
            this.elements.resetGameBtn.addEventListener('click', this.resetGame.bind(this));
        }
        
        // Play again button
        if (this.elements.playAgainBtn) {
            this.elements.playAgainBtn.addEventListener('click', this.resetGame.bind(this));
        }
        
        // Extra point attempt buttons
        if (this.elements.tryGuessBtn) {
            this.elements.tryGuessBtn.addEventListener('click', this.showExtraPointOverlay.bind(this));
        }
        
        if (this.elements.skipGuessBtn) {
            this.elements.skipGuessBtn.addEventListener('click', this.startNewRound.bind(this));
        }
        
        // Extra point result buttons
        if (this.elements.correctGuessBtn) {
            this.elements.correctGuessBtn.addEventListener('click', () => this.handleExtraPointResult(true));
        }
        
        if (this.elements.wrongGuessBtn) {
            this.elements.wrongGuessBtn.addEventListener('click', () => this.handleExtraPointResult(false));
        }
    }
    
    /**
     * Fetch the current game state from the server
     */
    fetchGameState() {
        fetch(this.config.apiUrls.gameState)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update local game state
                    Object.assign(this.gameState, data.game_state);
                    
                    // Update all components
                    this.updateAllComponents();
                    
                    // Show turn overlay if needed
                    if (!this.gameState.isTimerActive) {
                        this.showTurnOverlay();
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching game state:', error);
                this.showError('Error al cargar el estado del juego');
            });
    }
    
    /**
     * Update all game components based on current state
     */
    updateAllComponents() {
        // Update game board
        this.gameBoard.update(this.gameState);
        
        // Update team display
        this.teamManager.update(this.gameState);
        
        // Update round status
        this.updateRoundStatus();
        
        // Update button visibility based on game state
        this.updateButtonVisibility();

        // Update the word display if needed
        if (this.gameState.currentWord) {
            this.wordDisplay.setWord(this.gameState.currentWord);
        }
    }
    
    /**
     * Update the round status display
     */
    updateRoundStatus() {
        if (!this.elements.roundStatus) return;
        
        if (!this.gameState.isRoundActive) {
            this.elements.roundStatus.textContent = 'Ronda no iniciada';
        } else {
            const currentTeam = this.teamManager.getCurrentTeamName();
            
            if (this.gameState.isConfirmationNeeded) {
                this.elements.roundStatus.textContent = `${currentTeam} - Confirmar palabra adivinada`;
            } else {
                this.elements.roundStatus.textContent = `Turno de ${currentTeam}`;
            }
        }
    }
    
    /**
     * Update button visibility based on game state
     */
    updateButtonVisibility() {
        // Start round button
        if (this.elements.startRoundBtn) {
            this.elements.startRoundBtn.style.display = 
                this.gameState.isRoundActive ? 'none' : 'block';
        }
        
        // Confirm word button
        if (this.elements.confirmWordBtn) {
            this.elements.confirmWordBtn.style.display = 
                (this.gameState.isRoundActive && this.gameState.isConfirmationNeeded) ? 'block' : 'none';
        }
    }
    
    /**
     * Show the turn overlay for device passing
     */
    showTurnOverlay() {
        if (!this.elements.turnOverlay || !this.gameState.teams) return;
        
        // Set the current team name
        const currentTeam = this.gameState.teams[this.gameState.currentTeam];
        if (currentTeam && this.elements.currentTeamName) {
            this.elements.currentTeamName.textContent = currentTeam.name;
        }
        
        // Show the overlay
        this.elements.turnOverlay.classList.add('active');
        
        // Start the countdown
        this.startTurnCountdown();
    }
    
    /**
     * Start countdown for turn transition
     */
    startTurnCountdown() {
        if (!this.elements.turnCountdown) return;
        
        let countdown = 3;
        this.elements.turnCountdown.textContent = countdown;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            this.elements.turnCountdown.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                // Keep overlay visible, user must click "ready"
            }
        }, 1000);
    }
    
    /**
     * Start a new round
     */
    startRound() {
        // Reset any game state from previous rounds
        this.gameState.isConfirmationNeeded = false;
        
        // Hide the start button immediately to prevent double-clicks
        if (this.elements.startRoundBtn) {
            this.elements.startRoundBtn.disabled = true;
            this.elements.startRoundBtn.textContent = "Cargando...";
        }

        // Get a word and timer duration
        Promise.all([
            fetch(this.config.apiUrls.nextWord).then(res => res.json()),
            fetch(this.config.apiUrls.timer).then(res => res.json())
        ])
        .then(([wordData, timerData]) => {
            if (wordData.success) {
                // Store the word
                this.gameState.currentWord = wordData.word;
                this.gameState.previousWord = null;
                
                // Display the word
                this.wordDisplay.setWord(wordData.word);
                
                // Set up timer
                this.timer.setDuration(timerData.duration);
                
                // Start the timer
                this.timer.start();
                
                // Update game state
                this.gameState.isRoundActive = true;
                this.gameState.isTimerActive = true;
                this.gameState.isConfirmationNeeded = false;
                
                // Update UI
                this.updateAllComponents();

                // No messages needed
            }
        })
        .catch(error => {
            console.error('Error starting round:', error);
            this.showError('Error al comenzar la ronda');
            
            // Re-enable the button in case of error
            if (this.elements.startRoundBtn) {
                this.elements.startRoundBtn.disabled = false;
                this.elements.startRoundBtn.textContent = "¡Iniciar Ronda!";
            }
        });
    }
    
    /**
     * Handle the device being passed between teams
     */
    handleDevicePassed() {
        // Hide the overlay
        if (this.elements.turnOverlay) {
            this.elements.turnOverlay.classList.remove('active');
        }
        
        if (this.gameState.isConfirmationNeeded) {
            // Don't get a new word yet, just update the UI to show confirmation is needed
            this.updateAllComponents();

            // No messages needed
        } else {
            // When a team has guessed a word and is passing the device:
            // 1. Store the current word as the previous word before getting a new one
            this.gameState.previousWord = this.gameState.currentWord;
            
            // 2. Set confirmation flag so next team will see confirmation button
            this.gameState.isConfirmationNeeded = true;
            
            // 3. Switch to the other team
            this.gameState.currentTeam = 1 - this.gameState.currentTeam;
            
            // 4. Update UI with the current team and word (confirmation button should appear)
            this.updateAllComponents();

            // No messages needed
        }
    }
    
    /**
     * Handle word confirmation by the receiving team
     */
    handleWordConfirmed() {
        // Update game state - confirmation is no longer needed
        this.gameState.isConfirmationNeeded = false;
        
        // Get a new word for this team
        fetch(this.config.apiUrls.nextWord)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Mark the previous word as guessed in the server
                    this.submitWordResult(true, this.gameState.previousWord);
                    
                    // Update the current word
                    this.gameState.currentWord = data.word;
                    this.wordDisplay.setWord(data.word);
                    
                    // Update UI to show the new word and hide confirmation button
                    this.updateAllComponents();
                    
                    // No messages needed
                    
                    // Don't show the passing overlay - the team that confirmed now plays
                    // The passing happens after they guess their word
                }
            })
            .catch(error => {
                console.error('Error getting next word:', error);
                this.showError('Error al obtener la siguiente palabra');
            });
    }
    
    /**
     * Update timer UI based on timer events - no visual timer, just beeps
     * @param {Object} timerState - Current timer state
     */
    updateTimerUI(timerState) {
        // Don't update any visual UI for the timer - it's meant to be hidden
        // Beeps are handled by the timer module
    }
    
    /**
     * Handle timer end
     */
    handleTimerEnd() {
        // Play buzzer sound
        this.playBuzzer();
        
        // Update game state
        this.gameState.isTimerActive = false;
        this.gameState.isRoundActive = false;
        
        // Other team gets a point
        const otherTeamIndex = 1 - this.gameState.currentTeam;
        this.gameState.teams[otherTeamIndex].position += 1;
        
        // Show animation for the team getting a point
        this.gameBoard.celebrateToken(otherTeamIndex);
        
        // Update the board
        this.gameBoard.update(this.gameState);
        
        // Check for win condition
        if (this.gameState.teams[otherTeamIndex].position >= this.gameState.boardLength) {
            this.showWinOverlay(this.gameState.teams[otherTeamIndex].name);
            return;
        }
        
        // Show the timer end overlay
        this.showTimerEndOverlay();
    }
    
    /**
     * Show the timer end overlay
     */
    showTimerEndOverlay() {
        if (!this.elements.timerEndOverlay || !this.gameState.teams) return;
        
        // Set other team name (the one that gets a point)
        const otherTeamIndex = 1 - this.gameState.currentTeam;
        if (this.gameState.teams[otherTeamIndex] && this.elements.otherTeamName) {
            this.elements.otherTeamName.textContent = this.gameState.teams[otherTeamIndex].name;
        }
        
        // Show the overlay
        this.elements.timerEndOverlay.classList.add('active');
    }
    
    /**
     * Show the extra point attempt overlay
     */
    showExtraPointOverlay() {
        // Hide the timer end overlay
        if (this.elements.timerEndOverlay) {
            this.elements.timerEndOverlay.classList.remove('active');
        }
        
        // Set the revealed word
        if (this.elements.revealedWord && this.gameState.currentWord) {
            this.elements.revealedWord.textContent = this.gameState.currentWord;
        }
        
        // Show the extra point overlay
        if (this.elements.extraPointOverlay) {
            this.elements.extraPointOverlay.classList.add('active');
        }
    }
    
    /**
     * Submit word result to the server
     * @param {boolean} success - Whether the guess was successful
     * @param {string} word - The word that was guessed (defaults to current word)
     */
    submitWordResult(success, word = null) {
        const wordToSubmit = word || this.gameState.currentWord;
        if (!wordToSubmit) return;
        
        fetch(this.config.apiUrls.submitResult, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                success: success,
                word: wordToSubmit
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update game state
                Object.assign(this.gameState, data.game_state);
                
                // For the initial round start or after word confirmations
                // We don't need to modify team or confirmation flag here
                // as that's handled in handleDevicePassed and handleWordConfirmed
                
                // Update UI components
                this.updateAllComponents();
                
                // Check for winner
                if (data.winner) {
                    // Stop timer if a team has won
                    this.timer.stop();
                    this.gameState.isTimerActive = false;
                    this.gameState.isRoundActive = false;
                    
                    this.showWinOverlay(data.winner);
                }
            }
        })
        .catch(error => {
            console.error('Error submitting result:', error);
            this.showError('Error al enviar el resultado');
        });
    }
    
    /**
     * Handle the result of the extra point attempt
     * @param {boolean} correct - Whether the guess was correct
     */
    handleExtraPointResult(correct) {
        // Hide the extra point overlay
        if (this.elements.extraPointOverlay) {
            this.elements.extraPointOverlay.classList.remove('active');
        }
        
        if (correct) {
            // Award the extra point
            const otherTeamIndex = 1 - this.gameState.currentTeam;
            this.gameState.teams[otherTeamIndex].position += 1;
            
            // Update the board
            this.gameBoard.update(this.gameState);
            
            // Check for win condition
            if (this.gameState.teams[otherTeamIndex].position >= this.gameState.boardLength) {
                this.showWinOverlay(this.gameState.teams[otherTeamIndex].name);
                return;
            }
        }
        
        // Start a new round
        this.startNewRound();
    }
    
    /**
     * Start a new round after timer end and extra point phase
     */
    startNewRound() {
        // Hide any open overlays
        if (this.elements.timerEndOverlay) {
            this.elements.timerEndOverlay.classList.remove('active');
        }
        
        if (this.elements.extraPointOverlay) {
            this.elements.extraPointOverlay.classList.remove('active');
        }
        
        // Reset timer
        this.timer.reset();
        
        // Reset UI components
        this.updateAllComponents();
        
        // Reset the round state
        this.gameState.isRoundActive = false;
        this.gameState.isTimerActive = false;
        this.gameState.isConfirmationNeeded = false;
    }
    
    /**
     * Show the win overlay
     * @param {string} winner - Name of the winning team
     */
    showWinOverlay(winner) {
        if (this.elements.winOverlay && this.elements.winnerName) {
            this.elements.winnerName.textContent = winner;
            this.elements.winOverlay.classList.add('active');
        }
    }
    
    /**
     * Reset the game
     */
    resetGame() {
        fetch(this.config.apiUrls.reset, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Redirect to setup page
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('Error resetting game:', error);
            this.showError('Error al reiniciar el juego');
        });
    }
    
    /**
     * Update button visibility based on the current game state
     */
    updateButtonVisibility() {
        // Start round button
        if (this.elements.startRoundBtn) {
            this.elements.startRoundBtn.style.display = 
                this.gameState.isRoundActive ? 'none' : 'block';
        }
        
        // Confirm word button - ALWAYS visible during active rounds
        if (this.elements.confirmWordBtn) {
            // Always show the button during active rounds
            this.elements.confirmWordBtn.style.display = 
                this.gameState.isRoundActive ? 'block' : 'none';
        }
    }
    
    /**
     * Play the beep sound
     */
    playBeep() {
        if (this.sounds.beep) {
            this.sounds.beep.currentTime = 0;
            this.sounds.beep.play().catch(e => console.warn('Could not play beep:', e));
        }
    }
    
    /**
     * Play the buzzer sound
     */
    playBuzzer() {
        if (this.sounds.buzzer) {
            this.sounds.buzzer.currentTime = 0;
            this.sounds.buzzer.play().catch(e => console.warn('Could not play buzzer:', e));
        }
    }
    
    /**
     * Show an error message
     * @param {string} message - The error message to display
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<p>${message}</p>`;
        
        // Remove any existing error
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add the error to the game container
        const container = document.querySelector('.game-container');
        if (container) {
            container.insertBefore(errorDiv, container.firstChild);
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
    
    /**
     * Show a general message to the user (for guidance)
     * Function kept for API compatibility but doesn't display messages
     */
    showMessage(message, duration = 3000) {
        // No messages displayed
        return;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on game page
    if (document.querySelector('.game-container')) {
        const gameManager = new GameManager();
        gameManager.init();
    }
});