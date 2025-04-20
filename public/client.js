const socket = io();
let questions = [];
let currentQ = 0;
let timerInterval;

function joinGame() {
  const nickname = document.getElementById('nickname').value;
  if (nickname.trim() !== "") {
    socket.emit('playerJoined', nickname);
    document.getElementById('startScreen').classList.add('hidden');
  }
}

socket.on('startGame', (q) => {
  questions = q;
  currentQ = 0;
  showQuestion();
});

function showQuestion() {
  clearInterval(timerInterval); // 🔁 Always clear previous timer

  const q = questions[currentQ];
  const gameDiv = document.getElementById('game');
  gameDiv.classList.remove('hidden');

  gameDiv.innerHTML = `
    <h2>Question ${currentQ + 1}/10</h2>
    <div><img src="/images/${q.image}" width="250"></div>
    <div id="options">
      ${q.options.map(opt => `<button onclick="sendAnswer('${opt}')" class="option">${opt}</button>`).join('')}
    </div>
    <div id="timer">⏱️ Time left: <span id="time">10</span>s</div>
  `;
  startTimer();
}

function startTimer() {
  let timeLeft = 10;
  const timeSpan = document.getElementById('time');

  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeSpan) timeSpan.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      disableOptions(); // ⛔ Prevent user clicking after timeout
      sendAnswer("time-up");
    }
  }, 1000);
}

function disableOptions() {
  const buttons = document.querySelectorAll('.option');
  buttons.forEach(btn => btn.disabled = true);
}

function sendAnswer(ans) {
  clearInterval(timerInterval); // ✅ Stop timer once answer sent
  disableOptions(); // ⛔ Avoid multiple clicks
  socket.emit('answer', ans);
}

socket.on('feedback', (data) => {
  const sound = document.getElementById(data.result === "Correct!" ? 'correctSound' : 'wrongSound');
  if (sound) sound.play();

  const gameDiv = document.getElementById('game');
  gameDiv.innerHTML += `<p style="font-weight:bold">${data.result}</p>`;

  setTimeout(() => {
    currentQ++;
    if (currentQ < 10) {
      showQuestion();
    } else {
      document.getElementById('game').innerHTML = "<h2>Game Over. </h2>";
    }
  }, 1000);
});

socket.on('gameOver', () => {
  document.getElementById('game').innerHTML = "<h2>Game Over. Waiting for results... </h2>";
});

socket.on('showResults', (ranked) => {
  const winSound = document.getElementById('winSound');
  if (winSound) winSound.play();

  const resultDiv = document.getElementById('result');
  resultDiv.classList.remove('hidden');

  resultDiv.innerHTML = `
     <h2 style="color: white;">🏆 Final Results</h2>

    <ol>
      ${ranked.map((p, i) => 
        `<li>
          <strong>${i + 1}. ${p.name}</strong> — Score: <strong>${p.score}/10</strong> ${i === 0 ? '🥇' : ''}
        </li>`
      ).join('')}
    </ol>
  `;
});
