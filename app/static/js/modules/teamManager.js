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
        }
        
        // Update position
        const positionElement = element.querySelector(this.config.positionSelector);
        if (positionElement) {
            positionElement.textContent = team.position;
        }
        
        // Highlight current team
        if (index === this.currentTeamIndex) {
            element.classList.add(this.config.currentTeamClass);
        } else {
            element.classList.remove(this.config.currentTeamClass);
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
        return 'Equipo';
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
        return 'Equipo';
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
     * @returns {string} - Announcement message
     */
    announceCurrentTeam() {
        return `Turno de ${this.getCurrentTeamName()}`;
    }
}