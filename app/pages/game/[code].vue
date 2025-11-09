<!-- app/pages/game/[code].vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db, setQuizUrl } from '../../lib/firebaseGame'

const route = useRoute()
const router = useRouter()
const gameCode = ref('')
const isHost = ref(false)
const quiz = ref<any[]>([])
const currentQuestion = ref(0)
const players = ref<any[]>([])
const scores = ref<Record<string, number>>({})
const answered = ref<Record<string, boolean>>({})
const showResults = ref(false)
const gameState = ref('')
const quizUrl = ref('')

const colors = ['red', 'blue', 'yellow', 'purple']
const colorNames: Record<string, string> = {
  red: '#E74C3C',
  blue: '#3498DB',
  yellow: '#F1C40F',
  purple: '#9B59B6'
}

const currentQ = computed(() => quiz.value?.[currentQuestion.value])
const correctAnswer = computed(() => currentQ.value?.answers?.[currentQ.value?.correct] || '')
const answeredCount = computed(() => Object.values(answered.value).filter(Boolean).length)

onMounted(async () => {
  gameCode.value = route.params.code as string
  const playerId = localStorage.getItem('playerId') || `player-${Date.now()}`
  localStorage.setItem('playerId', playerId)
  isHost.value = localStorage.getItem(`host-${gameCode.value}`) === 'true'

  const gameRef = doc(db, 'games', gameCode.value)
  onSnapshot(gameRef, (snap) => {
    const data = snap.data()
    quiz.value = data?.quiz || []
    currentQuestion.value = data?.currentQuestion ?? 0
    players.value = data?.players || []
    scores.value = data?.scores || {}
    answered.value = data?.answered || {}
    gameState.value = data?.state || 'waiting'
    quizUrl.value = data?.quizUrl || ''

    if (gameState.value === 'finished') {
      showResults.value = true
    }
  })
})

async function loadQuiz() {
  try {
    if (!quizUrl.value) {
      alert('Please enter a quiz URL')
      return
    }
    await setQuizUrl(gameCode.value, quizUrl.value)
  } catch (err) {
    console.error(err)
    alert('Failed to load quiz')
  }
}

async function nextQuestion() {
  if (currentQuestion.value < quiz.value.length - 1) {
    const gameRef = doc(db, 'games', gameCode.value)
    await updateDoc(gameRef, {
      currentQuestion: currentQuestion.value + 1,
      answered: {}
    })
  } else {
    const gameRef = doc(db, 'games', gameCode.value)
    await updateDoc(gameRef, { state: 'finished' })
  }
}

const topPlayers = computed(() => {
  return Object.entries(scores.value)
      .map(([id, score]) => ({ id, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
})
</script>

<template>
  <div class="game-wrapper" v-if="isHost">
    <div v-if="!quiz.length" class="host-setup">
      <h1>Host Setup</h1>
      <input v-model="quizUrl" type="text" placeholder="Enter quiz JSON URL" class="input-field" />
      <button @click="loadQuiz" class="btn-primary">Load Quiz</button>
    </div>

    <div v-else-if="!showResults" class="host-view">
      <div class="question-header">
        <h2>{{ currentQ?.question }}</h2>
        <p class="question-counter">Question {{ currentQuestion + 1 }}/{{ quiz.length }}</p>
      </div>

      <img v-if="currentQ?.img" :src="currentQ.img" alt="Question image" class="question-image" />

      <div class="answers-grid">
        <div
            v-for="(answer, i) in currentQ?.answers"
            :key="i"
            class="answer-box"
            :style="{ backgroundColor: colorNames[colors[i]] }"
        >
          {{ answer }}
        </div>
      </div>

      <div class="players-info">
        <p>Players answered: {{ answeredCount }}/{{ players.length }}</p>
      </div>

      <button @click="nextQuestion" class="btn-next">Next Question</button>
    </div>

    <div v-else class="results-view">
      <h1>Game Over!</h1>
      <div class="leaderboard">
        <h2>Top 3 Players</h2>
        <div v-for="(player, i) in topPlayers" :key="i" class="leaderboard-item">
          <span class="rank">{{ i + 1 }}</span>
          <span class="player-id">{{ player.id }}</span>
          <span class="player-score">{{ player.score }} pts</span>
        </div>
      </div>
      <button @click="router.push('/')" class="btn-primary">Back to Home</button>
    </div>
  </div>

  <div class="game-wrapper" v-else>
    <div v-if="!quiz.length" class="loading">
      <p>Waiting for host to load quiz...</p>
    </div>

    <div v-else-if="!showResults" class="player-view">
      <div class="question-info">
        <h3>{{ currentQ?.question }}</h3>
        <p class="score">Your Score: {{ scores[localStorage.getItem('playerId') || ''] || 0 }}</p>
      </div>

      <div class="player-answers">
        <button
            v-for="(answer, i) in currentQ?.answers"
            :key="i"
            class="answer-button"
            :style="{ backgroundColor: colorNames[colors[i]] }"
            @click="() => {}"
        >
          {{ answer }}
        </button>
      </div>
    </div>

    <div v-else class="results-view">
      <h1>Game Over!</h1>
      <div class="leaderboard">
        <h2>Top 3 Players</h2>
        <div v-for="(player, i) in topPlayers" :key="i" class="leaderboard-item">
          <span class="rank">{{ i + 1 }}</span>
          <span class="player-id">{{ player.id }}</span>
          <span class="player-score">{{ player.score }} pts</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
  color: white;
  padding: 2rem;
  font-family: 'Inter', sans-serif;
}

.host-setup, .host-view, .player-view, .results-view {
  max-width: 1000px;
  margin: 0 auto;
}

.host-setup {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  margin-top: 4rem;
}

.input-field {
  width: 100%;
  max-width: 500px;
  padding: 1rem;
  border: 2px solid #555;
  border-radius: 10px;
  background-color: #111;
  color: white;
  font-size: 1rem;
}

.btn-primary {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background-color: #2980b9;
  transform: scale(1.05);
}

.question-header {
  text-align: center;
  margin-bottom: 2rem;
}

.question-header h2 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.question-counter {
  color: #aaa;
  font-size: 1.1rem;
}

.question-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 10px;
  margin-bottom: 2rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.answers-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.answer-box {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  border-radius: 15px;
  text-align: center;
  padding: 2rem;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  min-height: 150px;
}

.players-info {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.2rem;
  color: #aaa;
}

.btn-next {
  width: 100%;
  background-color: #27ae60;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-next:hover {
  background-color: #229954;
}

.player-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.question-info {
  text-align: center;
  margin-bottom: 3rem;
}

.question-info h3 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.score {
  font-size: 1.5rem;
  color: #2ecc71;
}

.player-answers {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  width: 100%;
  max-width: 600px;
}

.answer-button {
  aspect-ratio: 1;
  font-size: 1.3rem;
  font-weight: 700;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 120px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.answer-button:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
}

.answer-button:active {
  transform: scale(0.95);
}

.results-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 2rem;
}

.results-view h1 {
  font-size: 3.5rem;
  margin-bottom: 2rem;
}

.leaderboard {
  background-color: rgba(0, 0, 0, 0.7);
  border: 2px solid #3498db;
  border-radius: 15px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
}

.leaderboard h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: rgba(52, 152, 219, 0.1);
  border-radius: 10px;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.leaderboard-item:nth-child(1) .rank {
  color: #f39c12;
  font-weight: 700;
  font-size: 1.5rem;
}

.leaderboard-item:nth-child(2) .rank {
  color: #95a5a6;
  font-weight: 700;
  font-size: 1.5rem;
}

.leaderboard-item:nth-child(3) .rank {
  color: #cd7f32;
  font-weight: 700;
  font-size: 1.5rem;
}

.rank {
  font-weight: 700;
  font-size: 1.3rem;
  min-width: 40px;
}

.player-id {
  flex: 1;
  margin-left: 1rem;
}

.player-score {
  color: #2ecc71;
  font-weight: 700;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-size: 1.5rem;
}
</style>
