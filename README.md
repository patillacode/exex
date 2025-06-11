# Expresión Exprés (ExEx) Web App

A web-based implementation of the word-guessing party game "Expresión Exprés". This application allows players to enjoy the game using a shared mobile device which gets passed between teams.

## 📋 About the Game

Expresión Exprés is a Spanish word-guessing party game where:

- Two teams compete to guess words or expressions
- A clue-giver must describe a word to their teammate without using certain types of clues
- Teams advance on a game board based on correct guesses
- A timer with accelerating beeps adds pressure to each turn
- The first team to reach the finish line wins

## ✨ Features

- Mobile-first responsive design
- In-game timer with accelerating beep frequency
- Visual board for tracking team progress
- Word selection from a curated Spanish expression list
- Simple touch interface for easy gameplay during parties
- Responsive UI that works on mobile devices and desktop browsers
- CSRF protection for security

## 🛠️ Tech Stack

- **Backend**: Flask (Python 3.10+)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Security**: Flask-WTF for CSRF protection
- **Containerization**: Docker & Docker Compose
- **Data Storage**: JSON file (in-memory session)
- **Testing**: pytest with coverage reports

## 🚀 Getting Started

### Prerequisites

- Python 3.10 or higher
- Docker and Docker Compose (optional, for containerized deployment)

### Method 1: Using Make (Recommended)

The project includes a Makefile with helpful commands for development:

1. Clone this repository
   ```bash
   git clone <repository-url>
   cd exex
   ```

2. Install dependencies and create a virtual environment
   ```bash
   make install
   ```

3. Run the application
   ```bash
   make run
   ```

4. Run tests (optional)
   ```bash
   make test
   ```

5. Open your browser and navigate to `http://localhost:5000`

### Method 2: Manual Setup

1. Clone this repository
   ```bash
   git clone <repository-url>
   cd exex
   ```

2. Create and activate a virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Run the application
   ```bash
   python run.py
   ```

5. Open your browser and navigate to `http://localhost:5000`

### Method 3: Docker Deployment

1. Build and run with Docker Compose
   ```bash
   docker-compose up --build
   ```
   or use the Make command:
   ```bash
   make docker-up
   ```

2. Access the application at `http://localhost:5000`

## 🔍 Sound Files

Before playing, you need to add two sound files to the application:

1. Create or download a `beep.mp3` file (short beep sound, <0.5 seconds)
2. Create or download a `buzzer.mp3` file (buzzer sound, 1-2 seconds)
3. Place both files in the `app/static/sounds/` directory
4. You can find free sounds at sites like [Freesound](https://freesound.org/)

## 🎮 How to Play

1. **Setup**: Enter names for two teams and set the number of points to win
2. **Turn Flow**:
   - The active team taps "Ver Palabra" (Show Word)
   - The clue-giver describes the word to their teammate
   - The guesser tries to identify the word before the timer runs out
   - Tap "¡Adivinado!" (Guessed) if successful, or wait for the timer to end
3. **Advancement**:
   - If guessed correctly, the team advances one point
   - If time runs out, the opposing team advances one point
   - The opposing team can try to guess the missed word for an extra point
4. **Winning**: The first team to reach the target number of points wins

## 🔧 Project Structure

```
/exex
  /app                    # Flask application
    /routes               # Application routes organized by feature
    /static               # Static assets 
      /css                # Stylesheets
      /js                 # JavaScript files
      /sounds             # Sound files for game (beep.mp3 & buzzer.mp3)
      /images             # Image assets
    /templates            # HTML templates
    __init__.py          # Flask app initialization
    words.json           # Game words/expressions
  /tests                  # Test suite
  Dockerfile              # Docker configuration
  docker-compose.yml      # Docker Compose configuration
  Makefile                # Development commands
  requirements.txt        # Python dependencies
  run.py                  # Application entry point
```

## 📝 Development Plan

See [development-plan.md](development-plan.md) for the full implementation roadmap.

## 📜 Game Rules

- **Forbidden Clues**: No rhymes, no word roots, no part of the word
- **Duration**: Random timer between 30-90 seconds with accelerating beeps
- **Turn Taking**: Teams alternate turns, starting player describes word
- **Device Passing**: The device should be passed between teams

## 📱 Browser Compatibility

The application is optimized for:
- Chrome/Safari on iOS
- Chrome on Android
- Modern desktop browsers (Chrome, Firefox, Safari, Edge)

## 🧪 Testing

Run the test suite using:
```bash
make test
```

Or with coverage report:
```bash
make coverage
```

## 🔒 Security Features

- CSRF protection on all forms and API endpoints
- Session-based game state management
- Input validation and sanitization

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.