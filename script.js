const playButton = document.getElementById("play");
const landingPage = document.getElementById("landing-page");
const gamePage = document.getElementById("game-page");

const ROWS = 6;
const COLS = 5;
let currentRow = 0;
let currentCol = 0;
let isGameOver = false;

let WORDS = [];
let WORDSET = null; // we will use set because to check if the guess is in the word list or not (Set.has() is faster than Array.includes() in bigger files)
let secretWord = "";
let wordsLoaded = false;

let toastTimeout;

let isAnimating = false;

function updateKeyboard(letter, state){

    letter = letter.toUpperCase();

    const keyEl = document.querySelector(`.key[data-key="${letter}"]`);

    if(!keyEl) return;

    if(keyEl.classList.contains("correct")) return;

    if(keyEl.classList.contains("present") && state === "absent") return;

    keyEl.classList.remove("correct", "present", "absent");
    keyEl.classList.add(state);
}

function createKeyboard(){
    
    const keyboard = document.getElementById("keyboard");

    keyboard.innerHTML = "";

    const rows = [
        ["Q","W","E","R","T","Y","U","I","O","P"],
        ["A","S","D","F","G","H","J","K","L"],
        ["ENTER","Z","X","C","V","B","N","M","⌫"]
    ];

    rows.forEach((letters, idx) => {

        const rowDiv = document.createElement("div");

        rowDiv.classList.add("kb-row", `row-${idx+1}`);

        letters.forEach((letter) => {

            const btn = document.createElement("button");
            btn.classList.add("key");

            if(letter === "ENTER" || letter === "⌫"){
                btn.classList.add("big");
            }

            btn.textContent = letter;

            btn.dataset.key = letter;

            rowDiv.appendChild(btn);
        });

        keyboard.appendChild(rowDiv);

    });

}

function handleInput(key){

    if(isGameOver) return;
    if(isAnimating) return;

    if(gamePage.style.display !== "block") return;

    if(/^[A-Z]$/.test(key)) {
        if(currentCol < COLS && currentRow < ROWS){
            const tile = getTile(currentRow, currentCol);

            tile.textContent = key;
            currentCol++;
        }
        return;
    }

    if(key === "BACKSPACE"){
        if(currentCol > 0){
            currentCol--;
            const tile = getTile(currentRow, currentCol);
            tile.textContent = "";
        }
        return;
    }

    if (key === "ENTER") {
    if (currentCol < COLS) {
      showToast("Not enough letters"); // remove
      return;
    }

    const guess = getCurrentGuess();

    if(!isValidWord(guess)){
        showToast("Not in Word List");
        return;
    }

    const states = evaluateGuess(guess, secretWord);

    revealRow(currentRow, states);

    if(guess === secretWord){
        isGameOver = true;
        showEndModal("You Win! 🎉", "Play again or exit?");
        return;
    }

    // Move to next row
    currentRow++;
    currentCol = 0;

    // End if out of rows
    if (currentRow >= ROWS) {
      isGameOver = true;
      showEndModal("Game Over 😭", `The word was: ${secretWord.toUpperCase()}`);
      return;

    }
  }

}

async function loadWordList(){

    const res = await fetch("wordlist.txt");
    const text = await res.text();
    WORDS = text.split("\n").map(w => w.trim().toLowerCase()).filter(w => w.length === 5);
    WORDSET = new Set(WORDS);
    wordsLoaded = true;
}

function pickSecretWord(){

    const index = Math.floor(Math.random() * WORDS.length);
    secretWord = WORDS[index];
}

function isValidWord(word){

    return WORDSET.has(word.toLowerCase());

}

function getCurrentGuess(){
    let guess = "";
    for(let c = 0; c < COLS; c++){
        const tile = getTile(currentRow, c);
        guess += (tile.textContent || "").toLowerCase();

    }
    return guess;
}

function evaluateGuess(guess, secret){

    guess = guess.toLowerCase();
    secret = secret.toLowerCase();

    const states = Array(COLS).fill("absent");

    const freq = {};
    for (const ch of secret) freq[ch] = (freq[ch] || 0) + 1;


    //this is for green(correct letter)
    for(let i = 0; i < COLS; i++){
        if(guess[i] === secret[i]){
            states[i] = "correct";
            freq[guess[i]]--;
        }
    }

    //this is for yellow(correct letter but incorrect position) and gray(incorrect letter)
    for(let i = 0; i<COLS; i++){
        if(states[i] === "correct") continue;

        const ch = guess[i];

        if(freq[ch] > 0){
            states[i] = "present"; // yellow
            freq[ch]--;
        } else {
            states[i] = "absent"; // gray
        }
    }

    return states;
}

function revealRow(row, states){

    isAnimating = true;

    for(let c = 0; c < COLS; c++){

        const tile = getTile(row, c);

        setTimeout(() => {

            tile.classList.remove("flip");
            void tile.offsetWidth;

            tile.classList.add("flip");

            setTimeout(() => {
                tile.classList.remove("correct", "present", "absent");
                tile.classList.add(states[c]);

                updateKeyboard(tile.textContent, states[c]);
            }, 300)
        }, c * 250);
    }

    setTimeout(() => {
        isAnimating = false;
    }, (COLS - 1) * 250 + 650);
}


function showToast(message){
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.remove("hidden");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.add("hidden");
    }, 1500);
}


playButton.addEventListener("click", () => {
  landingPage.style.display = "none";
  gamePage.style.display = "block";

  currentRow = 0;
  currentCol = 0;
  isGameOver = false;
  isAnimating = false;

  createKeyboard();

  if (!wordsLoaded) {
    loadWordList().then(() => {
      pickSecretWord();
      createGameBoard();
    });
  } else {
    pickSecretWord();
    createGameBoard();
  }
});


function createGameBoard(){

    const gameBoard = document.getElementById("game-board");
    gameBoard.innerHTML = "";

    for(let i = 0; i < ROWS; i++){
        for( let j = 0; j < COLS; j++){
            const tile = document.createElement("div");
            tile.dataset.row = i;
            tile.dataset.col = j;
            tile.classList.add("cell");
            gameBoard.appendChild(tile);
        }
    }
}

function getTile(row, col) {
  return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}



document.addEventListener("keydown", (e) => {
  if (gamePage.style.display !== "block") return;

  const k = e.key;

  if (/^[a-zA-Z]$/.test(k)) handleInput(k.toUpperCase());
  else if (k === "Backspace") handleInput("BACKSPACE");
  else if (k === "Enter") handleInput("ENTER");
});

document.getElementById("keyboard").addEventListener("click", (e) => {

    if(!e.target.classList.contains("key")) return;
    const key = e.target.dataset.key;
    if(key === "⌫") {
        handleInput("BACKSPACE");
    } else {
        handleInput(key);
    }

});

function showEndModal(title, message) {
  document.getElementById("end-title").textContent = title;
  document.getElementById("end-message").textContent = message;
  document.getElementById("end-modal").classList.remove("hidden");
}

function hideEndModal() {
  document.getElementById("end-modal").classList.add("hidden");
}

function resetBoardUI() {
  // clear tiles
  document.querySelectorAll(".cell").forEach(tile => {
    tile.textContent = "";
    tile.classList.remove("correct", "present", "absent", "flip");
  });

  // clear keyboard colors
  document.querySelectorAll(".key").forEach(k => {
    k.classList.remove("correct", "present", "absent");
  });
}

function startNewGame() {
  currentRow = 0;
  currentCol = 0;
  isGameOver = false;
  isAnimating = false;

  const board = document.getElementById("game-board");
  board.style.opacity = "0";
  setTimeout(() => {
    pickSecretWord();
    resetBoardUI();
    hideEndModal();
    board.style.opacity = "1";
  }, 150);
}

document.getElementById("play-again").addEventListener("click", () => {
  startNewGame();
});

document.getElementById("exit").addEventListener("click", () => {
  hideEndModal();
  startNewGame();
  gamePage.style.display = "none";
  landingPage.style.display = "block";

});

