const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');

app.use(express.static('public'));
app.get('/', (req, res) => res.sendFile(__dirname + '/views/index.html'));

const questions = JSON.parse(fs.readFileSync('questions.json'));
let players = {};
let totalPlayers = 0;
let scores = {};

function getRandomQuestions(count) {
  return questions.sort(() => 0.5 - Math.random()).slice(0, count);
}

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('playerJoined', (nickname) => {
    players[socket.id] = {
      name: nickname,
      score: 0,
      questions: getRandomQuestions(10),
      current: 0
    };
    totalPlayers++;
    socket.emit('startGame', players[socket.id].questions);
  });

socket.on('answer', (ans) => {
  const player = players[socket.id];
  if (!player) return;

  const question = player.questions[player.current];
  if (!question) return;

  const correct = question.answer;
  const userAnswer = ans.trim().toLowerCase();
  const correctAnswer = correct.trim().toLowerCase();

  console.log(`➡️ ${player.name} answered: "${userAnswer}", correct: "${correctAnswer}"`);

  let resultText = '❌Wrong!';
  if (userAnswer !== 'time-up' && userAnswer === correctAnswer) {
    player.score++;
    resultText = '✅Correct!';
  }

  socket.emit('feedback', { result: resultText, score: player.score });

  player.current++;

  if (player.current >= 10) {
    scores[socket.id] = player.score;
    socket.emit('gameOver');

    if (Object.keys(scores).length === Object.keys(players).length) {
      const ranked = Object.entries(players)
        .map(([id, p]) => ({ name: p.name, score: p.score }))
        .sort((a, b) => b.score - a.score);

      console.log("🏁 Final Scores:", ranked);
      io.emit('showResults', ranked);
    }

  } else {
    socket.emit('nextQuestion', player.questions[player.current]);
  }
});



 socket.on('disconnect', () => {
  console.log(`❌ Player disconnected: ${players[socket.id]?.name || socket.id}`);
  delete players[socket.id];
  delete scores[socket.id];
});


});

http.listen(3000, '0.0.0.0', () => {
  console.log("✅ Server running at http://192.168.241.191:3000");
});
