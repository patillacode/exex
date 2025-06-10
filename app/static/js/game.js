/**
 * Main Game Module for Expresión Exprés
 * 
 * This file loads and initializes the appropriate modules based on the current page.
 */

// Import modules
import SetupManager from './modules/setup.js';
import GameManager from './modules/gameManager.js';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Determine which page we're on and initialize appropriate module
  if (document.querySelector('.game-container')) {
    // We're on the game page, initialize the game manager
    const gameManager = new GameManager();
    gameManager.init();
  } else if (document.querySelector('#setup-form')) {
    // We're on the setup page, initialize the setup manager
    const setupManager = new SetupManager();
    setupManager.init();
  }
});