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

## 🛠️ Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Containerization**: Docker
- **Data Storage**: JSON file (in-memory)

## 🚀 Getting Started

### Prerequisites

- Python 3.10 or higher
- Docker and Docker Compose (optional, for containerized deployment)

### Local Development

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

### Docker Deployment

1. Build and run with Docker Compose
   ```bash
   docker-compose up --build
   ```

2. Access the application at `http://localhost:5000`

## 🎮 How to Play

1. **Setup**: Enter names for two teams and customize the board size if desired
2. **Turn Flow**:
   - The active team taps "Ver Palabra" (Show Word)
   - The clue-giver describes the word to their teammate
   - The guesser tries to identify the word before the timer runs out
   - Tap "¡Adivinado!" (Guessed) if successful, or wait for the timer to end
3. **Advancement**:
   - If guessed correctly, the team advances one space
   - If time runs out, the opposing team advances one space
4. **Winning**: The first team to reach the final space wins

## 🔧 Project Structure

```
/exex
  /app                    # Flask application
    /static               # Static assets (CSS, JS, sounds)
    /templates            # HTML templates
    words.json            # Game words/expressions
  Dockerfile              # Docker configuration
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

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.