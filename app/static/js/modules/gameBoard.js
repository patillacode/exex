/**
 * Game Board Module for Expresión Exprés
 * 
 * Handles the game board visualization, token movement,
 * and board-related UI updates.
 */

export default class GameBoard {
    /**
     * Initialize the game board
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            boardPathSelector: '#board-path',
            token0Selector: '#team-token-0',
            token1Selector: '#team-token-1',
            ...config
        };
        
        this.boardPath = document.querySelector(this.config.boardPathSelector);
        this.token0 = document.querySelector(this.config.token0Selector);
        this.token1 = document.querySelector(this.config.token1Selector);
        
        this.boardLength = 10; // Default board length
    }
    
    /**
     * Update the game board based on game state
     * @param {Object} gameState - Current game state
     */
    update(gameState) {
        if (!gameState || !this.boardPath) return;
        
        this.boardLength = gameState.board_length || this.boardLength;
        
        // Generate board spaces
        this.generateBoardSpaces();
        
        // Update token positions
        this.updateTokenPositions(gameState.teams);
    }
    
    /**
     * Generate board spaces
     */
    generateBoardSpaces() {
        // Clear existing spaces
        this.boardPath.innerHTML = '';
        
        // Generate board spaces
        for (let i = 0; i <= this.boardLength; i++) {
            const space = document.createElement('div');
            space.className = 'board-space';
            
            if (i === 0) {
                space.classList.add('start');
            } else if (i === this.boardLength) {
                space.classList.add('finish');
            }
            
            this.boardPath.appendChild(space);
        }
    }
    
    /**
     * Update token positions on the board
     * @param {Array} teams - Array of team objects with positions
     */
    updateTokenPositions(teams) {
        if (!teams || !teams.length) return;
        
        // Calculate position percentage
        const spaceWidth = 100 / this.boardLength;
        
        // Update each token position
        if (this.token0 && teams[0]) {
            const position = teams[0].position * spaceWidth;
            this.token0.style.left = `${position}%`;
        }
        
        if (this.token1 && teams[1]) {
            const position = teams[1].position * spaceWidth;
            this.token1.style.left = `${position}%`;
        }
    }
    
    /**
     * Animate token movement and celebrate scoring
     * @param {number} teamIndex - Index of the team (0 or 1)
     * @param {number} fromPosition - Starting position
     * @param {number} toPosition - Ending position
     * @param {boolean} celebrate - Whether to celebrate after moving
     * @returns {Promise} A promise that resolves when animation is complete
     */
    animateTokenMovement(teamIndex, fromPosition, toPosition, celebrate = false) {
        return new Promise((resolve) => {
            const token = teamIndex === 0 ? this.token0 : this.token1;
            if (!token) {
                resolve();
                return;
            }
            
            const spaceWidth = 100 / this.boardLength;
            const fromPercent = fromPosition * spaceWidth;
            const toPercent = toPosition * spaceWidth;
            
            // Set initial position
            token.style.left = `${fromPercent}%`;
            
            // Add transition end listener
            const handleTransitionEnd = () => {
                token.removeEventListener('transitionend', handleTransitionEnd);
                resolve();
            };
            
            token.addEventListener('transitionend', handleTransitionEnd);
            
            // Trigger animation by setting new position after a short delay
            setTimeout(() => {
                token.style.left = `${toPercent}%`;
                
                // If celebration is requested, do it after the movement
                if (celebrate) {
                    token.addEventListener('transitionend', () => {
                        this.celebrateToken(teamIndex, false);
                    }, { once: true });
                }
            }, 50);
        });
    }
    
    /**
     * Create a celebration animation when a team wins or scores points
     * @param {number} teamIndex - Index of the team that gets points
     * @param {boolean} isWin - Whether this is a win celebration (longer) or point celebration
     */
    celebrateToken(teamIndex, isWin = false) {
        const token = teamIndex === 0 ? this.token0 : this.token1;
        if (!token) return;
        
        // Add celebration class
        token.classList.add('celebrating');
        
        // Remove after animation completes
        setTimeout(() => {
            token.classList.remove('celebrating');
        }, isWin ? 3000 : 1800);
        
        return new Promise(resolve => setTimeout(resolve, isWin ? 3000 : 1800));
    }
}