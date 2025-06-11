The current project will be a web app to play Expresión Exprés

The original rules of the game cna be found in the  `rules.txt` file.

The game will be played on a single mobile device that is passed between two teams.
Each team will take turns guessing words or expressions,
with a timer that increases in frequency as time runs out.

The game will feature a simple interface for word display and confirmation of guesses.

The game flow should be like this

```markdown
Game Flow Explanation

1. **Game Start**:
   - Teams are named (e.g., Team 1 and Team 2)
   - number of points to win is set
   - The "Start Round" button initiates the first round

2. **First Team's Turn**:
   - Team 1 gets a random word to guess
   - The timer starts with one beep sound every two seconds, this will be two times each second, then three times and then the buzzer sound when the time runs out.
   - The team tries to guess the word before the timer runs out

3. **Passing the Device**:
   - When Team 1 guesses correctly, they pass the device to Team 2
   - Team 2 sees the word recently guessed by Team 1 and a "Confirm Word" button
   - Team 2 confirms that Team 1 guessed correctly by pressing the button

4. **Next Turn**:
   - After confirming, Team 2 gets a new word to guess
   - They try to guess before the timer runs out
   - If successful, they pass back to Team 1 who confirms

This back and forth happens a few times, as many as the teams can guess, one at a time, passing the device.
Each time the "confirm word" button is pressed a new turn is played, while the timer keeps going.

5. **Timer Runs Out**:
   - When a team doesn't guess before the timer ends, all sounds stop (the buzzer is the last sound to play)
   - The opposing team gets one point automatically.
   - The opposing team can try to guess the word the current team didn't guess for an extra point (maximum 2 points can be won per round)

6. **Extra Point Attempt**:
   - The opposing team makes their guess
   - If correct, they get an additional point
   - If not, no extra point is awarded

7. **Game Continues**:
   - Rounds continue until one team reaches the number of points defined at the beginning
   - First team to reach the number of points, wins.
```
