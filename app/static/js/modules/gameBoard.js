/**
 * Score Display Module for Expresión Exprés
 * 
 * Handles the team score display, animations, and updates.
 * Simplified from previous game board implementation to focus on scores.
 */

export default class GameBoard {
    /**
     * Initialize the score display
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            team0ScoreSelector: '#team0-score',
            team1ScoreSelector: '#team1-score',
            team0StatusSelector: '#team-status-0',
            team1StatusSelector: '#team-status-1',
            ...config
        };
        
        // Find score elements
        this.team0ScoreEl = document.querySelector(this.config.team0ScoreSelector);
        this.team1ScoreEl = document.querySelector(this.config.team1ScoreSelector);
        
        // Find team status containers
        this.team0StatusEl = document.querySelector(this.config.team0StatusSelector);
        this.team1StatusEl = document.querySelector(this.config.team1StatusSelector);
        
        this.boardLength = 10; // Default win threshold
    }
    
    /**
     * Update the score display based on game state
     * @param {Object} gameState - Current game state
     */
    update(gameState) {
        if (!gameState) return;
        
        this.boardLength = gameState.board_length || this.boardLength;
        
        // Update score displays
        this.updateScores(gameState.teams);
        
        // Update progress indicators
        this.updateProgressBars(gameState.teams);
    }
    
    /**
     * Update the score displays
     * @param {Array} teams - Array of team objects with positions
     */
    updateScores(teams) {
        if (!teams || !teams.length) return;
        
        // Update team 0 score
        if (this.team0ScoreEl && teams[0]) {
            this.team0ScoreEl.textContent = teams[0].position;
        }
        
        // Update team 1 score
        if (this.team1ScoreEl && teams[1]) {
            this.team1ScoreEl.textContent = teams[1].position;
        }
    }
    
    /**
     * Update progress indicators showing how close teams are to winning
     * @param {Array} teams - Array of team objects with positions
     */
    updateProgressBars(teams) {
        if (!teams || !teams.length) return;
        
        // Get or create progress bars
        let team0Progress = this.team0StatusEl ? this.team0StatusEl.querySelector('.team-progress') : null;
        let team1Progress = this.team1StatusEl ? this.team1StatusEl.querySelector('.team-progress') : null;
        
        // Create progress bars if they don't exist
        if (this.team0StatusEl && !team0Progress) {
            team0Progress = document.createElement('div');
            team0Progress.className = 'team-progress';
            this.team0StatusEl.appendChild(team0Progress);
        }
        
        if (this.team1StatusEl && !team1Progress) {
            team1Progress = document.createElement('div');
            team1Progress.className = 'team-progress';
            this.team1StatusEl.appendChild(team1Progress);
        }
        
        // Update progress bar widths
        if (team0Progress && teams[0]) {
            const percentage = (teams[0].position / this.boardLength) * 100;
            team0Progress.style.width = `${Math.min(percentage, 100)}%`;
        }
        
        if (team1Progress && teams[1]) {
            const percentage = (teams[1].position / this.boardLength) * 100;
            team1Progress.style.width = `${Math.min(percentage, 100)}%`;
        }
    }
    
    /**
     * Animate a score change with visual effects
     * @param {number} teamIndex - Index of the team (0 or 1)
     * @param {boolean} celebrate - Whether to add celebration animation
     */
    animateScoreChange(teamIndex, celebrate = false) {
        const scoreEl = teamIndex === 0 ? this.team0ScoreEl : this.team1ScoreEl;
        const statusEl = teamIndex === 0 ? this.team0StatusEl : this.team1StatusEl;
        
        if (!scoreEl || !statusEl) return;
        
        // Flash effect on the score
        scoreEl.classList.add('score-flash');
        
        // Add celebration effect if requested
        if (celebrate) {
            statusEl.classList.add('celebrating');
        }
        
        // Remove classes after animation completes
        setTimeout(() => {
            scoreEl.classList.remove('score-flash');
            if (celebrate) {
                statusEl.classList.remove('celebrating');
            }
        }, 1500);
    }
    
    /**
     * Create a celebration animation when a team wins
     * @param {number} teamIndex - Index of the team that wins
     * @returns {Promise} Promise that resolves when animation completes
     */
    celebrateWin(teamIndex) {
        const statusEl = teamIndex === 0 ? this.team0StatusEl : this.team1StatusEl;
        if (!statusEl) return Promise.resolve();
        
        statusEl.classList.add('win-celebrating');
        
        return new Promise(resolve => {
            setTimeout(() => {
                statusEl.classList.remove('win-celebrating');
                resolve();
            }, 3000);
        });
    }
}