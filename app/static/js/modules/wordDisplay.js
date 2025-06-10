/**
 * Word Display Module for Expresión Exprés
 * 
 * Handles displaying the current word during gameplay.
 * In the updated game flow, words are always visible
 * (except during the extra point phase).
 */

export default class WordDisplay {
    /**
     * Initialize the word display manager
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            wordElementSelector: '#current-word',
            wordHiddenClass: 'word-hidden',
            ...config
        };
        
        // DOM elements
        this.wordElement = document.querySelector(this.config.wordElementSelector);
        
        // State
        this.currentWord = null;
    }
    
    /**
     * Set the current word
     * @param {string} word - The word to display
     */
    setWord(word) {
        this.currentWord = word;
        
        if (this.wordElement) {
            this.wordElement.textContent = word;
            // Always make sure the word is visible
            this.wordElement.classList.remove(this.config.wordHiddenClass);
        }
    }
    
    /**
     * Show the word
     */
    showWord() {
        if (this.wordElement) {
            this.wordElement.classList.remove(this.config.wordHiddenClass);
        }
    }
    
    /**
     * Hide the word
     */
    hideWord() {
        if (this.wordElement) {
            this.wordElement.classList.add(this.config.wordHiddenClass);
        }
    }
    
    /**
     * Reset the word display
     */
    reset() {
        this.currentWord = null;
        
        if (this.wordElement) {
            this.wordElement.textContent = 'Esperando nueva ronda...';
            // Make sure the word is visible when reset
            this.wordElement.classList.remove(this.config.wordHiddenClass);
        }
    }
    
    /**
     * Get the current word
     * @returns {string|null} - The current word
     */
    getCurrentWord() {
        return this.currentWord;
    }
}