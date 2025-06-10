/**
 * Team Manager Module for Expresión Exprés
 * 
 * Handles team information display, highlighting the current team,
 * and updating team status during game play.
 */

export default class TeamManager {
    /**
     * Initialize the team manager
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            team0StatusSelector: '#team-status-0',
            team1StatusSelector: '#team-status-1',
            currentTeamClass: 'current',
            nameSelector: '.team-name',
            positionSelector: '.position-value',
            ...config
        };
        
        // DOM elements
        this.team0Status = document.querySelector(this.config.team0StatusSelector);
        this.team1Status = document.querySelector(this.config.team1StatusSelector);
        
        // State
        this.teams = [];
        this.currentTeamIndex = 0;
    }
    
    /**
     * Update the team display based on game state
     * @param {Object} gameState - Current game state
     */
    update(gameState) {
        if (!gameState || !gameState.teams) return;
        
        this.teams = gameState.teams;
        this.currentTeamIndex = gameState.currentTeam;
        
        this.updateTeamDisplay();
    }
    
    /**
     * Update team display elements
     */
    updateTeamDisplay() {
        // Exit if no teams data or DOM elements
        if (!this.teams.length || (!this.team0Status && !this.team1Status)) return;
        
        // Update team 0
        if (this.team0Status && this.teams[0]) {
            this.updateSingleTeam(this.team0Status, this.teams[0], 0);
        }
        
        // Update team 1
        if (this.team1Status && this.teams[1]) {
            this.updateSingleTeam(this.team1Status, this.teams[1], 1);
        }
        
        // Add title attribute for longer team names
        const teamNameElements = document.querySelectorAll('.team-name');
        teamNameElements.forEach(el => {
            if (el.textContent.length > 12) { // Add tooltip for longer names
                el.title = el.textContent;
            }
        });
    }
    
    /**
     * Update a single team's display
     * @param {HTMLElement} element - Team status element
     * @param {Object} team - Team data
     * @param {number} index - Team index
     */
    updateSingleTeam(element, team, index) {
        // Update name
        const nameElement = element.querySelector(this.config.nameSelector);
        if (nameElement) {
            nameElement.textContent = team.name;
            
            // Adjust font size for long team names
            if (team.name.length > 15) {
                nameElement.style.fontSize = '0.85rem';
            } else if (team.name.length > 10) {
                nameElement.style.fontSize = '0.95rem';
            } else {
                nameElement.style.fontSize = '1rem';
            }
        }
        
        // Update position (score)
        const positionElement = element.querySelector(this.config.positionSelector);
        if (positionElement) {
            positionElement.textContent = team.position;
            // Update the actual score element too if it exists
            const scoreElement = index === 0 ? document.getElementById('team0-score') : document.getElementById('team1-score');
            if (scoreElement) {
                scoreElement.textContent = team.position;
            }
        }
        
        // Highlight current team
        if (index === this.currentTeamIndex) {
            element.classList.add(this.config.currentTeamClass);
            // Add vibrant styling to highlight current team
            element.style.fontWeight = 'bold';
            element.style.border = '2px solid #5B8AF5';
            element.style.backgroundColor = 'rgba(91, 138, 245, 0.1)';
            element.style.boxShadow = '0 0 10px rgba(91, 138, 245, 0.3)';
        } else {
            element.classList.remove(this.config.currentTeamClass);
            element.style.fontWeight = 'normal';
            element.style.border = '1px solid #E4E8F0';
            element.style.backgroundColor = '#FFF';
            element.style.boxShadow = 'none';
        }
    }
    
    /**
     * Get the current team name
     * @returns {string} - Name of the current team
     */
    getCurrentTeamName() {
        if (this.teams && this.teams[this.currentTeamIndex]) {
            return this.teams[this.currentTeamIndex].name;
        }
        return this.currentTeamIndex === 0 ? 'Equipo 1' : 'Equipo 2';
    }
    
    /**
     * Get the name of the team at the specified index
     * @param {number} index - Team index
     * @returns {string} - Team name
     */
    getTeamName(index) {
        if (this.teams && this.teams[index]) {
            return this.teams[index].name;
        }
        return index === 0 ? 'Equipo 1' : 'Equipo 2';
    }
    
    /**
     * Check if the team has reached the winning position
     * @param {number} index - Team index
     * @param {number} boardLength - Length of the game board
     * @returns {boolean} - Whether the team has won
     */
    hasTeamWon(index, boardLength) {
        if (this.teams && this.teams[index]) {
            return this.teams[index].position >= boardLength;
        }
        return false;
    }
    
    /**
     * Announce the current team's turn
     * @param {string} [activity=''] - Optional activity description
     * @returns {string} - Announcement message
     */
    announceCurrentTeam(activity = '') {
        const teamName = this.getCurrentTeamName();
        if (activity) {
            return `${teamName} - ${activity}`;
        }
        return `Turno de ${teamName}`;
    }
    
    /**
     * Get the other (non-current) team 
     * @returns {Object|null} - The other team object or null if not available
     */
    getOtherTeam() {
        const otherIndex = 1 - this.currentTeamIndex;
        if (this.teams && this.teams[otherIndex]) {
            return this.teams[otherIndex];
        }
        return null;
    }
    
    /**
     * Get the other (non-current) team's name
     * @returns {string} - Name of the other team
     */
    getOtherTeamName() {
        const otherIndex = 1 - this.currentTeamIndex;
        if (this.teams && this.teams[otherIndex]) {
            return this.teams[otherIndex].name;
        }
        return this.currentTeamIndex === 0 ? 'Equipo 2' : 'Equipo 1';
    }
}