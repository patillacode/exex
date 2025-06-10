/**
 * Timer Module for Expresión Exprés
 * 
 * Provides timer functionality with variable duration and
 * accelerating beep frequency for the game.
 */

class ExexTimer {
    /**
     * Create a new timer instance
     * 
     * @param {Object} options - Configuration options
     * @param {Function} options.onTick - Callback for each timer tick
     * @param {Function} options.onComplete - Callback when timer completes
     * @param {Function} options.onBeep - Callback when beep should sound
     */
    constructor(options = {}) {
        this.options = {
            onTick: options.onTick || function() {},
            onComplete: options.onComplete || function() {},
            onBeep: options.onBeep || function() {}
        };
        
        this.timeLeft = 0;
        this.timerInterval = null;
        this.beepInterval = null;
        this.initialDuration = 0;
        this.running = false;
        this.beepRate = 1000; // Starting beep rate in ms
    }
    
    /**
     * Start the timer
     * 
     * @param {number} duration - Duration in seconds
     */
    start(duration) {
        // Validate input
        if (typeof duration !== 'number' || duration <= 0) {
            console.error('Invalid duration provided to timer');
            return;
        }
        
        // Reset any existing timer
        this.stop();
        
        // Initialize timer state
        this.initialDuration = duration;
        this.timeLeft = duration;
        this.running = true;
        this.beepRate = 1000; // Reset to initial beep rate
        
        // Start the main timer - updates 10 times per second
        this.timerInterval = setInterval(() => {
            this.timeLeft = Math.max(0, this.timeLeft - 0.1);
            
            // Call the tick callback
            this.options.onTick({
                timeLeft: this.timeLeft,
                initialDuration: this.initialDuration,
                percentageLeft: (this.timeLeft / this.initialDuration) * 100
            });
            
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
        
        this.running = false;
    }
    
    /**
     * Timer completed
     */
    complete() {
        this.stop();
        this.timeLeft = 0;
        this.options.onComplete();
    }
    
    /**
     * Start the beeping pattern
     */
    startBeeping() {
        // Initial beep
        this.options.onBeep();
        
        // Clear any existing interval
        if (this.beepInterval) {
            clearInterval(this.beepInterval);
        }
        
        // Set up beeping interval
        this.beepInterval = setInterval(() => {
            this.options.onBeep();
            
            // Update the interval if beep rate has changed
            if (this.running) {
                clearInterval(this.beepInterval);
                this.startBeeping();
            }
        }, this.beepRate);
    }
    
    /**
     * Update the beep rate based on time remaining
     */
    updateBeepRate() {
        const percentRemaining = this.timeLeft / this.initialDuration;
        
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
     * Get the current state of the timer
     * 
     * @returns {Object} Timer state
     */
    getState() {
        return {
            timeLeft: this.timeLeft,
            initialDuration: this.initialDuration,
            percentageLeft: (this.timeLeft / this.initialDuration) * 100,
            running: this.running
        };
    }
    
    /**
     * Check if the timer is running
     * 
     * @returns {boolean} True if timer is running
     */
    isRunning() {
        return this.running;
    }
}

// Export as global if not in module environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExexTimer;
}