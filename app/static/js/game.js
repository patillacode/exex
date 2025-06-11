/**
 * Expresión Exprés - Game JavaScript
 * 
 * This file handles the game logic including:
 * - Timer management with increasing beep frequency
 * - Word display and team turn management
 * - Game state transitions
 * - Point tracking and winner detection
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the game page
  const gameContainer = document.querySelector('.game-container');
  if (!gameContainer) {
    // Not on the game page, exit early
    return;
  }
  
  // Game elements
  const gameScreens = document.querySelectorAll('.game-screen');
  
  // Game control buttons
  const showWordBtn = document.getElementById('show-word-btn');
  const wordGuessedBtn = document.getElementById('word-guessed-btn');
  const confirmWordBtn = document.getElementById('confirm-word-btn');
  const extraPointGuessedBtn = document.getElementById('extra-point-guessed-btn');
  const extraPointMissedBtn = document.getElementById('extra-point-missed-btn');
  const playAgainBtn = document.getElementById('play-again-btn');
  
  // Game state and score elements
  const currentWordElement = document.getElementById('current-word');
  const guessedWordElement = document.getElementById('guessed-word');
  const missedWordElement = document.getElementById('missed-word');
  const team1ProgressEl = document.querySelector('.team1-progress');
  const team2ProgressEl = document.querySelector('.team2-progress');
  
  // Game state
  let gameState = 'ready'; // States: ready, playing, guessed, timer_ended, win
  let timerActive = false;
  let currentWord = '';
  let activeTeam = 1;
  let timerInterval;
  let beepSound;
  let buzzerSound;
  
  // Timer configuration
  const minBeepInterval = 100; // ms between beeps at fastest
  const maxBeepInterval = 2000; // ms between beeps at start
  // Use commented line below for actual gameplay (~30-90 seconds)
  // const timerDuration = Math.floor(Math.random() * (90 - 30 + 1)) + 30; // 30-90 seconds
  // Use shorter time for testing (5-10 seconds)
  const timerDuration = Math.floor(Math.random() * (10 - 5 + 1)) + 5; // 5-10 seconds
  let timerStartTime;
  let nextBeepTime;
  let beepInterval = maxBeepInterval;
  let beepPhase = 1; // 1, 2, 3 (number of beeps per interval)
  
  // Points to win
  const pointsToWin = parseInt(gameContainer.dataset.pointsToWin) || 10;
  
  // Initialize game
  initGame();
  
  /**
   * Initialize the game
   */
  function initGame() {
    // Show the appropriate screen based on game state
    updateGameScreen(gameState);
    
    // Add event listeners to buttons
    showWordBtn.addEventListener('click', startTurn);
    wordGuessedBtn.addEventListener('click', handleWordGuessed);
    confirmWordBtn.addEventListener('click', confirmWordGuessed);
    extraPointGuessedBtn.addEventListener('click', () => handleExtraPoint(true));
    extraPointMissedBtn.addEventListener('click', () => handleExtraPoint(false));
    playAgainBtn.addEventListener('click', resetGame);
    
    // Preload audio
    preloadSounds();
  }
  
  /**
   * Preload game sounds
   */
  function preloadSounds() {
    // Create audio elements but don't play them yet
    const beepAudio = new Audio('/static/sounds/beep.mp3');
    const buzzerAudio = new Audio('/static/sounds/buzzer.mp3');
    
    // Preload by forcing a load event
    beepAudio.load();
    buzzerAudio.load();
  }
  
  /**
   * Update which game screen is displayed based on game state
   */
  function updateGameScreen(state) {
    // Hide all screens first
    gameScreens.forEach(screen => {
      screen.classList.remove('active');
    });
    
    // Find and show the appropriate screen
    let activeScreen;
    if (state === 'timer_ended') {
      activeScreen = document.querySelector('.game-screen.game-timer-ended');
    } else {
      activeScreen = document.querySelector(`.game-screen[data-state="${state}"]`);
    }
    
    if (activeScreen) {
      activeScreen.classList.add('active');
    } else if (state === 'win') {
      // Show win screen as a special case
      const winScreen = document.querySelector('.game-screen[data-state="win"]');
      if (winScreen) winScreen.classList.add('active');
    }
    
    // Update progress bars
    updateProgressBars();
  }
  
  /**
   * Update the progress bars based on current points
   */
  function updateProgressBars() {
    // Get current team points from API
    apiCall('/api/game-state')
      .then(data => {
        const team1Points = data.team1.points;
        const team2Points = data.team2.points;
        
        // Update progress bars
        team1ProgressEl.style.width = `${(team1Points / pointsToWin) * 100}%`;
        team2ProgressEl.style.width = `${(team2Points / pointsToWin) * 100}%`;
        
        // Update team score displays
        document.querySelector('.team-1 .team-score').textContent = `${team1Points} puntos`;
        document.querySelector('.team-2 .team-score').textContent = `${team2Points} puntos`;
        
        // Update active team visual indication
        document.querySelector('.team-1').classList.toggle('active', data.active_team === 1);
        document.querySelector('.team-2').classList.toggle('active', data.active_team === 2);
        
        // Set active team for timer logic
        activeTeam = data.active_team;
      })
      .catch(error => {
        console.error('Error fetching game state:', error);
      });
  }
  
  /**
   * Start a team's turn
   */
  function startTurn() {
    // Get a new word from the API
    apiCall('/api/word')
      .then(data => {
        currentWord = data.word;
        currentWordElement.textContent = currentWord;
        guessedWordElement.textContent = currentWord;
        missedWordElement.textContent = currentWord;
        
        // Update game state
        gameState = 'playing';
        updateGameScreen(gameState);
        
        // Start the timer
        startTimer();
      })
      .catch(error => {
        console.error('Error starting turn:', error);
      });
  }
  
  /**
   * Start the timer with accelerating beeps
   */
  function startTimer() {
    if (timerActive) return;
    
    timerActive = true;
    const timerBeepsEl = document.querySelector('.timer-beeps');
    timerStartTime = Date.now();
    let lastBeepTime = 0;
    
    // Calculate a random timer duration (in ms)
    // Use the timerDuration defined earlier and convert to ms
    const actualTimerDuration = timerDuration * 1000;
    
    // Reset timer visual
    if (timerBeepsEl) {
      timerBeepsEl.style.width = '0%';
    }
    
    // Start timer interval
    timerInterval = setInterval(() => {
      const elapsedTime = Date.now() - timerStartTime;
      const progress = Math.min(elapsedTime / actualTimerDuration, 1);
      
      // Update timer visual
      if (timerBeepsEl) {
        timerBeepsEl.style.width = `${progress * 100}%`;
      }
      
      // Calculate current beep interval based on progress
      const currentBeepInterval = maxBeepInterval - (progress * (maxBeepInterval - minBeepInterval));
      
      // Show elapsed time in console for debugging
      if (progress % 0.1 < 0.01) {
        console.log(`Timer: ${Math.round(progress * 100)}% (${Math.round(elapsedTime/1000)}s)`);
      }
      
      // Determine beep phase based on progress
      if (progress < 0.5) {
        beepPhase = 1; // One beep per interval
      } else if (progress < 0.8) {
        beepPhase = 2; // Two beeps per interval
      } else {
        beepPhase = 3; // Three beeps per interval
      }
      
      // Play beeps at appropriate times
      if (Date.now() - lastBeepTime > currentBeepInterval) {
        playBeep(beepPhase);
        lastBeepTime = Date.now();
      }
      
      // End timer when time is up
      if (progress >= 1) {
        endTimer(false);
        clearInterval(timerInterval);
      }
    }, 100); // Update every 100ms for smooth progress
  }
  
  /**
   * Play beep sound(s) based on the current phase
   * @param {number} phase - How many beeps to play (1-3)
   */
  function playBeep(phase) {
    try {
      if (!beepSound) {
        beepSound = new Audio('/static/sounds/beep.mp3');
      }
      
      // Play the beep
      beepSound.play().catch(e => console.log('Error playing beep:', e));
    } catch (error) {
      console.error('Could not play beep sound', error);
    }
    
    // Play additional beeps if in higher phases
    if (phase > 1) {
      setTimeout(() => {
        beepSound.currentTime = 0;
        beepSound.play().catch(e => console.log('Error playing beep:', e));
      }, 150);
    }
    
    if (phase > 2) {
      setTimeout(() => {
        beepSound.currentTime = 0;
        beepSound.play().catch(e => console.log('Error playing beep:', e));
      }, 300);
    }
  }
  
  /**
   * Play buzzer sound when timer ends
   */
  function playBuzzer() {
    try {
      if (!buzzerSound) {
        buzzerSound = new Audio('/static/sounds/buzzer.mp3');
      }
      buzzerSound.play().catch(e => console.log('Error playing buzzer:', e));
    } catch (error) {
      console.error('Could not play buzzer sound', error);
      // Continue with game flow even if sound fails
      console.log('Timer ended anyway - continuing game flow');
    }
  }
  
  /**
   * End the timer
   * @param {boolean} guessed - Whether the word was guessed correctly
   */
  function endTimer(guessed) {
    if (!timerActive) return;
    
    // Stop the timer
    timerActive = false;
    clearInterval(timerInterval);
    
    // Stop beep sounds
    if (beepSound) {
      beepSound.pause();
      beepSound.currentTime = 0;
    }
    
    if (!guessed) {
      // Play buzzer if time ran out
      playBuzzer();
      
      // Notify the server that time ran out
      apiCall('/api/guess', {
        method: 'POST',
        body: { guessed: false }
      })
      .then(data => {
        gameState = 'timer_ended';
        updateGameScreen(gameState);
        updateProgressBars();
        
        // Check if a team has won
        if (data.winner) {
          showWinnerScreen(data.winner);
        }
      })
      .catch(error => {
        console.error('Error sending guess result:', error);
      });
    }
  }
  
  /**
   * Handle when a word is guessed correctly
   */
  function handleWordGuessed() {
    endTimer(true);
    
    apiCall('/api/guess', {
      method: 'POST',
      body: { guessed: true }
    })
    .then(data => {
      gameState = 'guessed';
      updateGameScreen(gameState);
    })
    .catch(error => {
      console.error('Error sending guess result:', error);
    });
  }
  
  /**
   * Confirm that the word was guessed correctly
   */
  function confirmWordGuessed() {
    apiCall('/api/confirm', {
      method: 'POST'
    })
    .then(data => {
      gameState = 'ready';
      updateGameScreen(gameState);
      
      // Check if a team has won
      if (data.winner) {
        showWinnerScreen(data.winner);
      }
    })
    .catch(error => {
      console.error('Error confirming guess:', error);
    });
  }
  
  /**
   * Handle extra point attempt after timer ends
   * @param {boolean} guessed - Whether the opposing team guessed the word
   */
  function handleExtraPoint(guessed) {
    apiCall('/api/extra-point', {
      method: 'POST',
      body: { guessed }
    })
    .then(data => {
      gameState = 'ready';
      updateGameScreen(gameState);
      
      // Check if a team has won
      if (data.winner) {
        showWinnerScreen(data.winner);
      }
    })
    .catch(error => {
      console.error('Error processing extra point:', error);
    });
  }
  
  /**
   * Show the winner screen
   * @param {number} winnerTeamNumber - The team number that won (1 or 2)
   */
  function showWinnerScreen(winnerTeamNumber) {
    gameState = 'win';
    
    // Get the winning team name from API
    apiCall('/api/game-state')
      .then(data => {
        const winnerTeam = winnerTeamNumber === 1 ? data.team1 : data.team2;
        document.getElementById('winner-team-name').textContent = winnerTeam.name;
        document.getElementById('team1-final-score').textContent = data.team1.points;
        document.getElementById('team2-final-score').textContent = data.team2.points;
        
        updateGameScreen('win');
        
        // Show celebration effects
        showConfetti();
      })
      .catch(error => {
        console.error('Error getting winner details:', error);
      });
  }
  
  /**
   * Reset the game to play again
   */
  function resetGame() {
    apiCall('/api/reset', {
      method: 'POST'
    })
    .then(data => {
      gameState = 'ready';
      updateGameScreen(gameState);
    })
    .catch(error => {
      console.error('Error resetting game:', error);
    });
  }
  
  /**
   * Show confetti animation for the winner
   */
  function showConfetti() {
    const confettiContainer = document.getElementById('confetti');
    if (!confettiContainer) return;
    
    const colors = ['#4285f4', '#34a853', '#fbbc05', '#ea4335'];
    
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.style.width = `${Math.random() * 10 + 5}px`;
      confetti.style.height = `${Math.random() * 10 + 5}px`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.position = 'absolute';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.top = `${-20 - Math.random() * 100}px`;
      confetti.style.opacity = Math.random() + 0.5;
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      
      const animationDuration = Math.random() * 3 + 2;
      const horizontalMovement = Math.random() * 100 - 50;
      
      confetti.style.animation = `
        confetti-fall ${animationDuration}s ease-in forwards,
        confetti-shake ${Math.random() * 2 + 1}s ease-in-out infinite alternate
      `;
      
      confetti.style.animationDelay = `${Math.random() * 3}s`;
      
      confettiContainer.appendChild(confetti);
      
      // Remove confetti after animation completes
      setTimeout(() => {
        confetti.remove();
      }, animationDuration * 1000 + 3000);
    }
  }
});

/**
 * Utility function for making API calls
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise} - Promise with the response data
 */
async function apiCall(url, options = {}) {
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRFToken': getCsrfToken()
    },
    credentials: 'same-origin'
  };
  
  const fetchOptions = { ...defaultOptions, ...options };
  
  if (fetchOptions.body && typeof fetchOptions.body === 'object') {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }
  
  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

/**
 * Get CSRF token from the page
 * @returns {string} - CSRF token
 */
function getCsrfToken() {
  // Try to get from meta tag first (most secure)
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }
  
  // Fallback to getting from a form input
  const csrfInput = document.querySelector('input[name="csrf_token"]');
  if (csrfInput) {
    return csrfInput.value;
  }
  
  // Return empty string if not found
  return '';
}