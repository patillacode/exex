/**
 * Timer Manager Module for Expresión Exprés
 * 
 * Handles timer functionality with variable duration,
 * accelerating beep frequency, and visual feedback.
 */

export default class TimerManager {
    /**
     * Initialize the timer manager
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            // We keep the selectors for compatibility but don't use them visually
            timerProgressSelector: '#timer-progress',
            timerTextSelector: '#timer-text',
            dangerThreshold: 25, // Percentage when timer turns red
            warningThreshold: 50, // Percentage when timer turns yellow
            dangerClass: 'danger',
            warningClass: 'warning',
            baseClass: 'timer-progress',
            onTick: null, // Callback for timer tick
            onComplete: null, // Callback for timer completion
            onBeep: null, // Callback for when beep should sound
            ...config
        };
        
        // DOM elements - not used visually in the new game flow
        this.timerProgress = null;
        this.timerText = null;
        
        // Timer state
        this.duration = 0;
        this.timeLeft = 0;
        this.timerInterval = null;
        this.beepInterval = null;
        this.beepRate = 1000; // Starting beep rate in ms
        this.isRunning = false;
    }
    
    /**
     * Set the timer duration
     * @param {number} seconds - Duration in seconds
     */
    setDuration(seconds) {
        this.duration = seconds;
        this.timeLeft = seconds;
        
        // Update display
        this.updateTimerDisplay();
        this.resetProgressBar();
    }
    
    /**
     * Start the timer
     */
    start() {
        if (this.isRunning || this.timeLeft <= 0) return;
        
        // Reset any existing intervals
        this.stop();
        
        // Set running state
        this.isRunning = true;
        
        // Start the main timer - updates 10 times per second
        this.timerInterval = setInterval(() => {
            // Decrease time by 0.1 seconds
            this.timeLeft = Math.max(0, this.timeLeft - 0.1);
            
            // Update display
            this.updateTimerDisplay();
            
            // Check if timer has ended
            if (this.timeLeft <= 0) {
                this.complete();
            } else {
                // Update beep frequency based on time left
                this.updateBeepRate();
            }
        }, 100);
        
        // Start beeping
        this.startBeeping();
    }
    
    /**
     * Stop the timer
     */
    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (this.beepInterval) {
            clearInterval(this.beepInterval);
            this.beepInterval = null;
        }
        
        this.isRunning = false;
        
        // Notify for cleanup (stop sounds etc.)
        if (typeof this.config.onBeep === 'function') {
            this.config.onTick({
                timeLeft: this.timeLeft,
                initialDuration: this.duration,
                percentageLeft: (this.timeLeft / this.duration) * 100,
                isStopped: true
            });
        }
    }
    
    /**
     * Reset the timer UI without changing the duration
     */
    reset() {
        // Stop any running timer (which also cleans up intervals)
        this.stop();
        
        // Reset time left to duration
        this.timeLeft = this.duration;
        this.isRunning = false;
        
        // Reset UI
        this.updateTimerDisplay();
        this.resetProgressBar();
        
        // Reset beep rate
        this.beepRate = 1000;
    }
    
    /**
     * Handle timer completion
     */
    complete() {
        // Stop timer first (which also cleans up intervals)
        this.stop();
        
        // Set time to 0
        this.timeLeft = 0;
        this.isRunning = false;
        
        // Call the completion callback
        if (typeof this.config.onComplete === 'function') {
            this.config.onComplete();
        }
    }
    
    /**
     * Start the beeping pattern
     */
    startBeeping() {
        if (!this.isRunning) {
            return; // Don't start beeping if timer isn't running
        }
        
        // Initial beep
        if (typeof this.config.onBeep === 'function') {
            this.config.onBeep();
        }
        
        // Clear any existing interval
        if (this.beepInterval) {
            clearInterval(this.beepInterval);
            this.beepInterval = null;
        }
        
        // Set up beeping interval
        this.beepInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(this.beepInterval);
                this.beepInterval = null;
                return;
            }
            
            if (typeof this.config.onBeep === 'function') {
                this.config.onBeep();
            }
            
            // Update the interval if beep rate has changed
            if (this.isRunning) {
                clearInterval(this.beepInterval);
                this.startBeeping();
            }
        }, this.beepRate);
    }
    
    /**
     * Trigger a beep sound
     */
    triggerBeep() {
        if (typeof this.config.onBeep === 'function') {
            this.config.onBeep();
        }
    }
    
    /**
     * Update the beep rate based on time remaining
     */
    updateBeepRate() {
        const percentRemaining = this.timeLeft / this.duration;
        
        // Gradually increase frequency as time passes
        if (percentRemaining < 0.25) {
            this.beepRate = 200; // Very rapid at the end (5 beeps per second)
        } else if (percentRemaining < 0.5) {
            this.beepRate = 400; // Faster in the middle (2.5 beeps per second)
        } else if (percentRemaining < 0.75) {
            this.beepRate = 700; // Slightly faster (about 1.4 beeps per second)
        }
    }
    
    /**
     * Format time in seconds to MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} - Formatted time string
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    /**
     * Update the timer display
     * 
     * In the new game flow, we don't show the timer visually,
     * but we still track it internally for beeps and game state
     */
    updateTimerDisplay() {
        // No visual timer update - the timer is hidden from players
        // We keep the internal state updated but don't show it
        
        // Call tick callback for internal tracking
        if (typeof this.config.onTick === 'function') {
            this.config.onTick({
                timeLeft: this.timeLeft,
                initialDuration: this.duration,
                percentageLeft: (this.timeLeft / this.duration) * 100,
                formatted: this.formatTime(this.timeLeft)
            });
        }
    }
    
    /**
     * Reset the progress bar to full (not visible in new game flow)
     */
    resetProgressBar() {
        // Progress bar is not shown in the new game flow
        // This method is kept for compatibility but doesn't update UI
    }
    
    /**
     * Check if the timer is currently running
     * @returns {boolean} - Whether the timer is running
     */
    isTimerRunning() {
        return this.isRunning;
    }
    
    /**
     * Get the current timer state
     * @returns {Object} - Current timer state
     */
    getTimerState() {
        return {
            duration: this.duration,
            timeLeft: this.timeLeft,
            percentageLeft: (this.timeLeft / this.duration) * 100,
            isRunning: this.isRunning,
            formatted: this.formatTime(this.timeLeft)
        };
    }
}