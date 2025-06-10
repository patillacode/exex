/**
 * Setup Module for Expresión Exprés
 * 
 * Handles the game setup functionality, including team creation
 * and game initialization.
 */

export default class SetupManager {
    /**
     * Initialize the setup manager
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            formSelector: '#setup-form',
            team1Selector: '#team1',
            team2Selector: '#team2',
            boardSizeSelector: '#board-size',
            boardSizeValueSelector: '#board-size-value',
            apiUrl: '/api/initialize',
            gameUrl: '/game',
            ...config
        };
        
        this.form = document.querySelector(this.config.formSelector);
        this.team1Input = document.querySelector(this.config.team1Selector);
        this.team2Input = document.querySelector(this.config.team2Selector);
        this.boardSizeSlider = document.querySelector(this.config.boardSizeSelector);
        this.boardSizeValue = document.querySelector(this.config.boardSizeValueSelector);
    }
    
    /**
     * Initialize the setup module
     */
    init() {
        if (!this.form) return;
        
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners for the form
     */
    setupEventListeners() {
        // Board size slider
        if (this.boardSizeSlider && this.boardSizeValue) {
            this.boardSizeSlider.addEventListener('input', () => {
                this.updateBoardSizeDisplay();
            });
        }
        
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }
    
    /**
     * Update the board size display based on slider value
     */
    updateBoardSizeDisplay() {
        this.boardSizeValue.textContent = `${this.boardSizeSlider.value} espacios`;
    }
    
    /**
     * Handle form submission
     */
    handleSubmit() {
        const team1 = this.team1Input.value.trim();
        const team2 = this.team2Input.value.trim();
        const boardSize = parseInt(this.boardSizeSlider.value);
        
        if (!team1 || !team2) {
            this.showError('Por favor, introduce nombres para ambos equipos.');
            return;
        }
        
        // Initialize the game
        this.initializeGame(team1, team2, boardSize);
    }
    
    /**
     * Show an error message
     * @param {string} message - Error message to display
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
        
        // Add the new error before the form
        this.form.parentNode.insertBefore(errorDiv, this.form);
    }
    
    /**
     * Show loading indicator
     * @param {string} message - Loading message to display
     */
    showLoading(message = 'Preparando el juego...') {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `<p>${message}</p>`;
        
        // Remove any existing loading indicator
        this.hideLoading();
        
        // Add the new loading indicator
        this.form.parentNode.appendChild(loadingIndicator);
    }
    
    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }
    
    /**
     * Initialize the game by calling the API
     * @param {string} team1 - Name of team 1
     * @param {string} team2 - Name of team 2
     * @param {number} boardSize - Size of the game board
     */
    initializeGame(team1, team2, boardSize) {
        this.showLoading();
        
        fetch(this.config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                teams: [team1, team2],
                boardLength: boardSize
            })
        })
        .then(response => response.json())
        .then(data => {
            this.hideLoading();
            
            if (data.success) {
                // Redirect to the game page
                window.location.href = this.config.gameUrl;
            } else {
                this.showError(data.error || 'Error al inicializar el juego');
            }
        })
        .catch(error => {
            this.hideLoading();
            this.showError('Error de conexión. Por favor, inténtalo de nuevo.');
            console.error('Error:', error);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const setupManager = new SetupManager();
    setupManager.init();
});