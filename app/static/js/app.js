/**
 * Expresión Exprés - Main Application JavaScript
 * 
 * Common functionality used across the application
 */

document.addEventListener('DOMContentLoaded', () => {
  // Fix for iOS Safari 100vh issue
  fixIOSViewportHeight();

  // Add active class to current section in navigation (if present)
  highlightCurrentNavItem();
  
  // Register service worker for PWA support (if supported by browser)
  registerServiceWorker();
});

/**
 * Fix for iOS Safari's 100vh viewport issue
 * This sets a CSS variable that can be used instead of 100vh
 */
function fixIOSViewportHeight() {
  const setViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  // Set the height initially
  setViewportHeight();
  
  // Reset on resize
  window.addEventListener('resize', () => {
    setViewportHeight();
  });
}

/**
 * Highlight the current navigation item based on the current URL
 */
function highlightCurrentNavItem() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('nav a');
  
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}

/**
 * Register service worker for PWA support
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/static/js/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
}

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
      'X-Requested-With': 'XMLHttpRequest'
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
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

/**
 * Load and play a sound
 * @param {string} soundName - Name of the sound file (without extension)
 * @param {boolean} loop - Whether to loop the sound
 * @returns {HTMLAudioElement} - The audio element
 */
function playSound(soundName, loop = false) {
  const audio = new Audio(`/static/sounds/${soundName}.mp3`);
  audio.loop = loop;
  
  // Handle promise returned by audio.play()
  const playPromise = audio.play();
  
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.error('Error playing sound:', error);
    });
  }
  
  return audio;
}

/**
 * Stop and reset a sound
 * @param {HTMLAudioElement} audioElement - The audio element to stop
 */
function stopSound(audioElement) {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }
}