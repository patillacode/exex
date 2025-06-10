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
        this.fetchGameState()
            .then(() => {
                // After fetching game state, ensure the correct team is highlighted
                this.highlightCurrentTeam();
            })
            .catch(error => {
                console.error("Error initializing game:", error);
            });
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
     * @returns {Promise} A promise that resolves when the state is fetched
     */
    fetchGameState() {
        return fetch(this.config.apiUrls.gameState)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
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
                    
                    return data.game_state;
                } else {
                    throw new Error(data.error || 'Unknown error');
                }
            })
            .catch(error => {
                console.error('Error fetching game state:', error);
                this.showError('Error al cargar el estado del juego');
                throw error;
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
        
        // Highlight the current team
        this.highlightCurrentTeam();
        
        // Update the "Jugando" indicator
        const teamChangeEvent = new CustomEvent('team:changed', {
            detail: {
                teamIndex: this.gameState.currentTeam,
                teamName: this.teamManager.getCurrentTeamName()
            }
        });
        window.dispatchEvent(teamChangeEvent);
        
        // Notify that game state has been updated
        const stateEvent = new CustomEvent('game:stateUpdated', {
            detail: { 
                state: this.gameState
            }
        });
        window.dispatchEvent(stateEvent);
    }
    
    /**
     * Update the round status display
     */
    updateRoundStatus() {
        if (!this.elements.roundStatus) return;
        
        const currentTeam = this.teamManager.getCurrentTeamName();
        
        if (!this.gameState.isRoundActive) {
            this.elements.roundStatus.textContent = 'Ronda no iniciada';
            this.elements.roundStatus.style.fontWeight = 'normal';
        } else if (this.gameState.isTimerActive) {
            // If timer is active, it's this team's turn to guess
            this.elements.roundStatus.textContent = `Turno de ${currentTeam} para adivinar`;
            this.elements.roundStatus.style.fontWeight = 'bold';
            this.elements.roundStatus.style.color = '#2E3A59';
        } else if (this.gameState.isConfirmationNeeded) {
            // If confirmation is needed, show which team needs to confirm
            this.elements.roundStatus.textContent = `${currentTeam} - Confirmar palabra adivinada`;
            this.elements.roundStatus.style.fontWeight = 'bold';
            this.elements.roundStatus.style.color = '#5B8AF5';
        } else {
            // Default status
            this.elements.roundStatus.textContent = `Turno de ${currentTeam}`;
            this.elements.roundStatus.style.fontWeight = 'normal';
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
        
        // Show or hide confirmation instructions based on state
        const confirmationInstructions = document.getElementById('confirmation-instruction');
        if (confirmationInstructions) {
            if (this.gameState.isConfirmationNeeded) {
                confirmationInstructions.style.display = 'inline';
            } else {
                confirmationInstructions.style.display = 'none';
            }
        }
        
        // Make sure to highlight the correct team before showing overlay
        this.highlightCurrentTeam();
        
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
        
        // Make sure the confirm button is visible
        if (this.elements.confirmWordBtn) {
            this.elements.confirmWordBtn.style.display = 'block';
            this.elements.confirmWordBtn.classList.remove('pulse');
        }
        
        // Stop any sounds that might be playing from previous rounds
        this.stopAllSounds();

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
                
                // Set up and start timer
                this.timer.setDuration(timerData.duration);
                this.timer.start();
        
                // Update game state
                this.gameState.isRoundActive = true;
                this.gameState.isTimerActive = true;
                this.gameState.isConfirmationNeeded = false;
                
                // Make sure we're displaying the right team
                this.highlightCurrentTeam();
        
                // Show message with current team's name
                const currentTeam = this.teamManager.getCurrentTeamName();
                this.showMessage(`¡${currentTeam} está jugando!`);
                
                // Update round status
                if (this.elements.roundStatus) {
                    this.elements.roundStatus.textContent = `Turno de ${currentTeam} para adivinar`;
                    this.elements.roundStatus.style.fontWeight = 'bold';
                }
        
                // Update UI
                this.updateAllComponents();
                
                // Update the "Jugando" indicator to highlight current team
                const teamChangeEvent = new CustomEvent('team:changed', {
                    detail: {
                        teamIndex: this.gameState.currentTeam,
                        teamName: this.teamManager.getCurrentTeamName()
                    }
                });
                window.dispatchEvent(teamChangeEvent);
        
                // Ensure the confirm button is visible during the round
                if (this.elements.confirmWordBtn) {
                    this.elements.confirmWordBtn.style.display = 'block';
                }
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
            // This is the receiving team confirming they've seen the word
            const currentTeam = this.teamManager.getCurrentTeamName();
            this.showMessage(`${currentTeam}, ahora debes confirmar si la palabra fue adivinada correctamente`);
            
            // Update round status text
            if (this.elements.roundStatus) {
                this.elements.roundStatus.textContent = `${currentTeam} - Confirmar la palabra adivinada`;
                this.elements.roundStatus.style.fontWeight = 'bold';
                this.elements.roundStatus.style.color = '#5B8AF5';
            }
            
            // Update UI
            this.updateAllComponents();
            
            // Explicitly update team indicators
            const teamChangeEvent = new CustomEvent('team:changed', {
                detail: {
                    teamIndex: this.gameState.currentTeam,
                    teamName: this.teamManager.getCurrentTeamName()
                }
            });
            window.dispatchEvent(teamChangeEvent);
            
            // Make sure confirm button is prominently displayed
            if (this.elements.confirmWordBtn) {
                this.elements.confirmWordBtn.classList.add('pulse');
                this.elements.confirmWordBtn.style.display = 'block';
            }
        } else {
            // When a team has guessed a word and is passing the device
            this.gameState.previousWord = this.gameState.currentWord;
            this.gameState.isConfirmationNeeded = true;
            this.gameState.currentTeam = 1 - this.gameState.currentTeam;
            
            const nextTeam = this.teamManager.getCurrentTeamName();
            this.showMessage(`Pasa el dispositivo a ${nextTeam} para confirmar`);
            
            // Highlight the new current team
            this.highlightCurrentTeam();
            
            // Explicitly update team indicators
            const teamChangeEvent = new CustomEvent('team:changed', {
                detail: {
                    teamIndex: this.gameState.currentTeam,
                    teamName: this.teamManager.getCurrentTeamName()
                }
            });
            window.dispatchEvent(teamChangeEvent);
            
            // Update components including team highlighting
            this.updateAllComponents();
        }
    }
    
    /**
     * Handle word confirmation by the receiving team
     */
    handleWordConfirmed() {
        // Update game state - confirmation is no longer needed
        this.gameState.isConfirmationNeeded = false;
        
        // Disable confirmation button temporarily to prevent double clicks
        if (this.elements.confirmWordBtn) {
            this.elements.confirmWordBtn.disabled = true;
            this.elements.confirmWordBtn.textContent = "Cargando...";
        }
        
        // Play a success sound to acknowledge confirmation
        if (this.sounds.beep) {
            this.sounds.beep.currentTime = 0;
            this.sounds.beep.play().catch(e => console.warn('Could not play beep:', e));
        }
        
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
                    
                    // Update UI to show the new word and reset confirmation button
                    if (this.elements.confirmWordBtn) {
                        this.elements.confirmWordBtn.disabled = false;
                        this.elements.confirmWordBtn.textContent = "¡Confirmar Palabra Adivinada!";
                        this.elements.confirmWordBtn.style.display = 'block'; // Always visible during rounds
                        this.elements.confirmWordBtn.classList.remove('pulse'); // Remove pulsing effect
                    }
                    
                    // Update the round status to show it's this team's turn to guess
                    if (this.elements.roundStatus) {
                        const currentTeam = this.teamManager.getCurrentTeamName();
                        this.elements.roundStatus.textContent = `Turno de ${currentTeam} para adivinar`;
                        this.elements.roundStatus.style.fontWeight = 'bold';
                        this.elements.roundStatus.style.color = '#2E3A59';
                    }
                    
                    // Force an immediate update of team indicators
                    const team0Indicator = document.querySelector('#team-status-0 .current-team-indicator');
                    const team1Indicator = document.querySelector('#team-status-1 .current-team-indicator');
                    
                    if (team0Indicator && team1Indicator) {
                        team0Indicator.style.display = this.gameState.currentTeam === 0 ? 'block' : 'none';
                        team1Indicator.style.display = this.gameState.currentTeam === 1 ? 'block' : 'none';
                    }
                    
                    // Make sure we update team status highlighting
                    this.highlightCurrentTeam();
                    
                    // Dispatch team change event to update "Jugando" indicator
                    const teamChangeEvent = new CustomEvent('team:changed', {
                        detail: {
                            teamIndex: this.gameState.currentTeam,
                            teamName: this.teamManager.getCurrentTeamName()
                        }
                    });
                    window.dispatchEvent(teamChangeEvent);
                    
                    // Show a message confirming whose turn it is now
                    this.showMessage(`¡Es turno de ${this.teamManager.getCurrentTeamName()} para adivinar!`);
                    
                    // Update all components after team change
                    this.updateAllComponents();
                    
                    // Don't show the passing overlay - the team that confirmed now plays
                    // The passing happens after they guess their word
                }
            })
            .catch(error => {
                console.error('Error getting next word:', error);
                this.showError('Error al obtener la siguiente palabra');
                
                // Re-enable button in case of error
                if (this.elements.confirmWordBtn) {
                    this.elements.confirmWordBtn.disabled = false;
                    this.elements.confirmWordBtn.textContent = "¡Confirmar Palabra Adivinada!";
                }
            });
    }
    
    /**
     * Update timer UI based on timer events - no visual timer, just beeps
     * @param {Object} timerState - Current timer state
     */
    updateTimerUI(timerState) {
        // Don't update any visual UI for the timer - it's meant to be hidden
        // If the timer has been stopped (isStopped flag), stop any sounds
        if (timerState && timerState.isStopped) {
            this.stopAllSounds();
        }
        
        // Beeps are handled by the timer module
    }
    
    /**
     * Handle timer end
     */
    handleTimerEnd() {
        // Stop all sounds first
        this.stopAllSounds();
        
        // Play buzzer sound
        this.playBuzzer();
        
        // Update game state
        this.gameState.isTimerActive = false;
        this.gameState.isRoundActive = false;
        
        // Other team gets a point (but don't update UI yet - it will be updated when backend responds)
        const otherTeamIndex = 1 - this.gameState.currentTeam;
        
        // Tell the server that the timer ended (will award point to other team)
        fetch(this.config.apiUrls.nextTurn, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                timer_ended: true
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update game state from server
                Object.assign(this.gameState, data.game_state);
                
                // Update the scoreboard first
                this.gameBoard.update(this.gameState);
                
                // Now animate and celebrate the score change
                this.gameBoard.animateScoreChange(otherTeamIndex, true);
                
                // Check for win condition
                if (data.winner) {
                    this.showWinOverlay(data.winner);
                    return;
                }
                
                // For timer end, we DON'T switch teams - the opposing team gets both the point 
                // and the chance for an extra point, so we need to make sure currentTeam 
                // reflects the team that failed to guess in time
                this.gameState.currentTeam = 1 - otherTeamIndex;
                
                // Show the timer end overlay
                this.showTimerEndOverlay();
            }
        })
        .catch(error => {
            console.error('Error updating game state after timer end:', error);
            // Still show the overlay even if there's an error
            this.showTimerEndOverlay();
        });
    }
    
    /**
     * Show the timer end overlay
     */
    showTimerEndOverlay() {
        if (!this.elements.timerEndOverlay || !this.gameState.teams) return;
        
        // Set other team name (the one that gets a point and can get an extra point)
        const otherTeamIndex = 1 - this.gameState.currentTeam;
        if (this.gameState.teams[otherTeamIndex] && this.elements.otherTeamName) {
            this.elements.otherTeamName.textContent = this.gameState.teams[otherTeamIndex].name;
        }
        
        // Set other team name (the one that can get extra point)
        const currentTeamDisplay = document.getElementById('current-team-display');
        if (currentTeamDisplay && this.gameState.teams[otherTeamIndex]) {
            currentTeamDisplay.textContent = this.gameState.teams[otherTeamIndex].name;
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
        
        // When timer ends, the opposing team (who already got a point)
        // gets the chance for an extra point
        const otherTeamIndex = 1 - this.gameState.currentTeam;
        const currentTeamExtra = document.getElementById('current-team-extra');
        if (currentTeamExtra && this.gameState.teams[otherTeamIndex]) {
            currentTeamExtra.textContent = this.gameState.teams[otherTeamIndex].name;
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
        
        // The other team is the one getting the extra point
        const otherTeamIndex = 1 - this.gameState.currentTeam;
        
        if (correct) {
            // Award the extra point via API
            fetch(this.config.apiUrls.submitResult, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    extra_point: true,
                    word: this.gameState.currentWord
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update game state
                    Object.assign(this.gameState, data.game_state);
                    
                    // Update the scoreboard first
                    this.gameBoard.update(this.gameState);
                    
                    // Now animate and celebrate the score change
                    this.gameBoard.animateScoreChange(otherTeamIndex, true);
                    
                    // Check for winner
                    if (data.winner) {
                        this.showWinOverlay(data.winner);
                        return;
                    }
                    
                    // Show confirmation message
                    this.showMessage(`¡${this.gameState.teams[otherTeamIndex].name} ha obtenido un punto extra!`);
                    
                    // Start a new round if no winner
                    this.startNewRound();
                }
            })
            .catch(error => {
                console.error('Error submitting extra point result:', error);
                // Still start a new round even if there's an error
                this.startNewRound();
            });
        } else {
            // Start a new round without awarding a point
            this.showMessage(`${this.gameState.teams[otherTeamIndex].name} no obtuvo el punto adicional`);
            this.startNewRound();
        }
    }
    
    /**
     * Start a new round after timer end and extra point phase
     */
    startNewRound() {
        // Stop any sounds that might be playing
        this.stopAllSounds();
        
        // Hide any open overlays
        if (this.elements.timerEndOverlay) {
            this.elements.timerEndOverlay.classList.remove('active');
        }
        
        if (this.elements.extraPointOverlay) {
            this.elements.extraPointOverlay.classList.remove('active');
        }
        
        // Reset timer
        this.timer.reset();
        
        // After timer end + extra point attempt, we need to switch to the other team for the next round
        // This is because when timer ended, we didn't switch teams (to allow the opposing team to try for extra point)
        const otherTeamIndex = 1 - this.gameState.currentTeam;
        this.gameState.currentTeam = otherTeamIndex;
        
        // Fetch the latest game state to ensure we're in sync with the server
        fetch(this.config.apiUrls.gameState)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update local game state
                    Object.assign(this.gameState, data.game_state);
                    
                    // Ensure we have switched to the other team
                    this.gameState.currentTeam = otherTeamIndex;
                    
                    // Reset UI components
                    this.updateAllComponents();
                    
                    // Reset the round state
                    this.gameState.isRoundActive = false;
                    this.gameState.isTimerActive = false;
                    this.gameState.isConfirmationNeeded = false;
                    
                    // Reset the word display
                    this.wordDisplay.reset();
                    
                    // Show message about team change
                    this.showMessage(`Turno de ${this.teamManager.getCurrentTeamName()} para iniciar ronda`);
                }
            })
            .catch(error => {
                console.error('Error fetching game state:', error);
                // If fetch fails, still try to reset UI
                this.updateAllComponents();
                this.gameState.isRoundActive = false;
                this.gameState.isTimerActive = false;
                this.gameState.isConfirmationNeeded = false;
                this.wordDisplay.reset();
                
                // Show message about team change even on error
                this.showMessage(`Turno de ${this.teamManager.getCurrentTeamName()} para iniciar ronda`);
            });
    }
    
    /**
     * Show the win overlay
     * @param {string} winner - Name of the winning team
     */
    showWinOverlay(winner) {
        // Make sure all sounds stop before showing win overlay
        this.stopAllSounds();
        
        if (this.elements.winOverlay && this.elements.winnerName) {
            this.elements.winnerName.textContent = winner;
            this.elements.winOverlay.classList.add('active');
        }
    }
    
    /**
     * Reset the game
     */
    resetGame() {
        // First stop any sounds that might be playing
        this.stopAllSounds();
        
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
            const shouldDisplayStartBtn = !this.gameState.isRoundActive;
            this.elements.startRoundBtn.style.display = shouldDisplayStartBtn ? 'block' : 'none';
            
            // Ensure it's enabled
            this.elements.startRoundBtn.disabled = false;
            this.elements.startRoundBtn.textContent = "¡Iniciar Ronda!";
        }
        
        // Confirm word button - Always visible during active rounds
        if (this.elements.confirmWordBtn) {
            const shouldDisplayConfirmBtn = this.gameState.isRoundActive;
            this.elements.confirmWordBtn.style.display = shouldDisplayConfirmBtn ? 'block' : 'none';
            
            // Ensure it's enabled
            this.elements.confirmWordBtn.disabled = false;
            this.elements.confirmWordBtn.textContent = "¡Confirmar Palabra Adivinada!";
            
            // Add a pulse animation if confirmation is needed
            if (this.gameState.isConfirmationNeeded) {
                this.elements.confirmWordBtn.classList.add('pulse');
            } else {
                this.elements.confirmWordBtn.classList.remove('pulse');
            }
        }
        
        // Update team indicators first
        const team0Indicator = document.querySelector('#team-status-0 .current-team-indicator');
        const team1Indicator = document.querySelector('#team-status-1 .current-team-indicator');
        
        if (team0Indicator && team1Indicator) {
            team0Indicator.style.display = this.gameState.currentTeam === 0 ? 'block' : 'none';
            team1Indicator.style.display = this.gameState.currentTeam === 1 ? 'block' : 'none';
        }
        
        // Highlight the current team
        this.highlightCurrentTeam();
    }
    
    /**
     * Highlight the currently active team status box
     */
    highlightCurrentTeam() {
        // Get both team status elements
        const team0Status = document.getElementById('team-status-0');
        const team1Status = document.getElementById('team-status-1');
        
        if (!team0Status || !team1Status) return;
        
        // Reset styles first
        team0Status.style.border = "1px solid #E4E8F0";
        team1Status.style.border = "1px solid #E4E8F0";
        team0Status.style.backgroundColor = "#FFF";
        team1Status.style.backgroundColor = "#FFF";
        team0Status.style.boxShadow = "none";
        team1Status.style.boxShadow = "none";
        team0Status.style.fontWeight = "normal";
        team1Status.style.fontWeight = "normal";
        
        // Add transition for smoother style changes
        team0Status.style.transition = "all 0.3s ease";
        team1Status.style.transition = "all 0.3s ease";
        
        // Ensure we have both team names displayed correctly
        const team0Name = team0Status.querySelector('.team-name');
        const team1Name = team1Status.querySelector('.team-name');
        if (team0Name && this.gameState.teams && this.gameState.teams[0]) {
            team0Name.textContent = this.gameState.teams[0].name;
        }
        if (team1Name && this.gameState.teams && this.gameState.teams[1]) {
            team1Name.textContent = this.gameState.teams[1].name;
        }
        
        // Update the Jugando indicators
        const team0Indicator = document.querySelector('#team-status-0 .current-team-indicator');
        const team1Indicator = document.querySelector('#team-status-1 .current-team-indicator');
        if (team0Indicator && team1Indicator) {
            team0Indicator.style.display = this.gameState.currentTeam === 0 ? 'block' : 'none';
            team1Indicator.style.display = this.gameState.currentTeam === 1 ? 'block' : 'none';
        }
        
        // Apply highlight to current team
        if (this.gameState.currentTeam === 0) {
            team0Status.style.border = "2px solid #5B8AF5";
            team0Status.style.backgroundColor = "rgba(91, 138, 245, 0.1)";
            team0Status.style.boxShadow = "0 0 10px rgba(91, 138, 245, 0.3)";
            team0Status.style.fontWeight = "bold";
            
            // Additional CSS class for consistency
            team0Status.classList.add('current');
            team1Status.classList.remove('current');
        } else {
            team1Status.style.border = "2px solid #5B8AF5";
            team1Status.style.backgroundColor = "rgba(91, 138, 245, 0.1)";
            team1Status.style.boxShadow = "0 0 10px rgba(91, 138, 245, 0.3)";
            team1Status.style.fontWeight = "bold";
            
            // Additional CSS class for consistency
            team1Status.classList.add('current');
            team0Status.classList.remove('current');
        }
        
        // Dispatch team change event for other components to react
        const teamChangeEvent = new CustomEvent('team:changed', {
            detail: {
                teamIndex: this.gameState.currentTeam,
                teamName: this.teamManager.getCurrentTeamName()
            }
        });
        window.dispatchEvent(teamChangeEvent);
        
        // Update team name elements with correct team names
        const currentTeamStatus = this.gameState.currentTeam === 0 ? team0Status : team1Status;
        if (currentTeamStatus) {
            currentTeamStatus.setAttribute('aria-label', 'Current team');
        }
        
        // Log current team for debugging
        console.log("Current team updated:", this.gameState.currentTeam, this.teamManager.getCurrentTeamName());
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
     * Stop all sounds currently playing
     */
    stopAllSounds() {
        if (this.sounds.beep) {
            this.sounds.beep.pause();
            this.sounds.beep.currentTime = 0;
        }
        
        if (this.sounds.buzzer) {
            this.sounds.buzzer.pause();
            this.sounds.buzzer.currentTime = 0;
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
     * @param {string} message - Message to display
     * @param {number} duration - Time to display the message in ms
     */
    showMessage(message, duration = 3000) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-notification fade-in';
        messageDiv.innerHTML = `<p>${message}</p>`;
    
        // Remove any existing message
        const existingMessage = document.querySelector('.message-notification');
        if (existingMessage) {
            existingMessage.remove();
        }
    
        // Add the message to the game container
        const container = document.querySelector('.game-container');
        if (container) {
            container.insertBefore(messageDiv, container.firstChild);
            
            // Log for debugging
            console.log("Game message:", message);
            
            // Also update the round status to be consistent with messages
            const roundStatus = document.getElementById('round-status');
            if (roundStatus) {
                // Only update if the message contains team information
                if (message.includes('Turno de') || message.includes('está jugando')) {
                    roundStatus.textContent = message;
                    roundStatus.style.fontWeight = 'bold';
                    roundStatus.style.color = '#2E3A59';
                }
            }
        }
    
        // Auto-remove after duration
        setTimeout(() => {
            if (messageDiv && messageDiv.parentNode) {
                messageDiv.classList.remove('fade-in');
                messageDiv.classList.add('fade-out');
                setTimeout(() => {
                    if (messageDiv && messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 300);
            }
        }, duration);
    }
}

// Note: Initialization is handled by the main game.js file
// No need to initialize here again