<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, nextQuestion as nextQuestionFn, endGame as endGameFn } from '../../lib/firebaseGame'
import Dither from '../../components/Dither.vue'

const route = useRoute()
const router = useRouter()
const gameCode = ref((route.params.code as string) || '')
const quiz = ref<any[]>([])
const currentQuestion = ref(0)
const players = ref<any[]>([])
const scores = ref<Record<string, number>>({})
const answered = ref<Record<string, number>>({})
const showResults = ref(false)
const gameState = ref('waiting')
const timeLeft = ref(20)
const timerInterval = ref<number | null>(null)

const colors = ['#9b59b6', '#e74c3c', '#f39c12', '#2ecc71']

const currentQ = computed(() => quiz.value?.[currentQuestion.value])
const answeredCount = computed(() => Object.keys(answered.value).length)

const topPlayers = computed(() => {
  return players.value
      .map(p => ({ ...p, score: scores.value[p.id] || 0 }))
      .sort((a, b) => b.score - a.score)
})

let unsubscribe: (() => void) | null = null

watch(answeredCount, (newCount) => {
  if (gameState.value === 'started' && newCount === players.value.length && players.value.length > 0) {
    setTimeout(() => nextQuestion(), 1000)
  }
})

watch(currentQuestion, () => {
  resetTimer()
})

function resetTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  timeLeft.value = 20
  timerInterval.value = window.setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval.value!)
      nextQuestion()
    }
  }, 1000)
}

onMounted(async () => {
  const isHost = localStorage.getItem(`host-${gameCode.value}`)
  if (!isHost) {
    router.push('/')
    return
  }

  const ref = doc(db, 'games', gameCode.value)
  unsubscribe = onSnapshot(ref, (snap) => {
    if (!snap.exists()) return
    const data = snap.data()

    quiz.value = data?.quiz || []
    currentQuestion.value = data?.currentQuestion ?? 0
    players.value = data?.players || []
    scores.value = data?.scores || {}
    answered.value = data?.answered || {}
    gameState.value = data?.state || 'waiting'
    showResults.value = data?.state === 'ended'

    if (gameState.value === 'started' && !timerInterval.value) {
      resetTimer()
    }
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  if (timerInterval.value) clearInterval(timerInterval.value)
})

async function nextQuestion() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
  try {
    await nextQuestionFn(gameCode.value, currentQuestion.value, quiz.value.length)
  } catch (err) {
    console.error(err)
  }
}

async function endGame() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
  try {
    await endGameFn(gameCode.value)
  } catch (err) {
    console.error(err)
  }
}
</script>

<template>
  <div class="game-wrapper">
    <Dither class="background" />

    <div v-if="showResults" class="results-view">
      <h1>🎉 Game Over!</h1>

      <div class="leaderboard">
        <h2>Final Leaderboard</h2>
        <div v-if="topPlayers.length === 0" class="no-players">
          No players found
        </div>
        <div
            v-else
            v-for="(player, index) in topPlayers"
            :key="player.id"
            class="leaderboard-item"
            :class="{
            'rank-1': index === 0,
            'rank-2': index === 1,
            'rank-3': index === 2
          }"
        >
          <span class="rank">{{ index + 1 }}</span>
          <img :src="player.avatar" :alt="player.username" class="leaderboard-avatar" />
          <span class="player-username">{{ player.username }}</span>
          <span class="player-score">{{ player.score }} pts</span>
        </div>
      </div>
    </div>

    <div v-else-if="gameState === 'started'" class="host-view">
      <div class="question-view">
        <div class="question-header">
          <div class="header-top">
            <span class="question-counter">Question {{ currentQuestion + 1 }} / {{ quiz.length }}</span>
            <span class="timer" :class="{ warning: timeLeft <= 5 }">{{ timeLeft }}s</span>
          </div>
          <h2>{{ currentQ?.question }}</h2>
        </div>

        <div v-if="currentQ?.img" class="image-container">
          <img :src="currentQ.img" alt="Question" class="question-image" />
        </div>

        <div class="answers-grid">
          <div
              v-for="(answer, index) in currentQ?.answers"
              :key="index"
              class="answer-box"
              :style="{ backgroundColor: colors[index] }"
          >
            <span class="answer-text">{{ answer }}</span>
          </div>
        </div>
      </div>

      <div class="players-info">
        <p>{{ answeredCount }} / {{ players.length }} answered</p>
      </div>
    </div>

    <div v-else class="host-view">
      <h2>Waiting for game to start...</h2>
    </div>
  </div>
</template>

<style scoped>
.game-wrapper {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  color: white;
  padding: 2rem;
  overflow: hidden;
}

.background {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.host-view, .results-view {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1400px;
}

.question-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: calc(100vh - 8rem);
}

.question-header {
  background-color: rgba(0, 0, 0, 0.8);
  padding: 1.5rem;
  border-radius: 15px;
  border: 2px solid #333;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-counter {
  font-size: 1.2rem;
  color: #aaa;
  font-weight: 600;
}

.timer {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2ecc71;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 0.5rem 1rem;
  border-radius: 10px;
  min-width: 60px;
  text-align: center;
}

.timer.warning {
  color: #e74c3c;
}

.question-header h2 {
  font-size: 2rem;
  margin: 0;
  line-height: 1.3;
}

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.question-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 15px;
  border: 2px solid #333;
}

.answers-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.answer-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border-radius: 15px;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  text-align: center;
  min-height: 100px;
}

.answer-text {
  word-break: break-word;
}

.players-info {
  background-color: rgba(0, 0, 0, 0.8);
  padding: 1rem;
  text-align: center;
  border-radius: 10px;
  border: 1px solid #333;
  margin-top: 1rem;
}

.players-info p {
  font-size: 1.1rem;
  margin: 0;
}

.results-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem;
}

.results-view h1 {
  font-size: 3rem;
  margin: 0;
  text-align: center;
}

.leaderboard {
  background-color: rgba(0, 0, 0, 0.8);
  border: 2px solid #333;
  border-radius: 15px;
  padding: 2rem;
  width: 100%;
}

.leaderboard h2 {
  text-align: center;
  margin: 0 0 1.5rem 0;
  font-size: 1.8rem;
}

.no-players {
  text-align: center;
  color: #aaa;
  padding: 2rem;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.leaderboard-item.rank-1 {
  background-color: rgba(243, 156, 18, 0.2);
  border: 2px solid #f39c12;
}

.leaderboard-item.rank-2 {
  background-color: rgba(149, 165, 166, 0.2);
  border: 2px solid #95a5a6;
}

.leaderboard-item.rank-3 {
  background-color: rgba(205, 127, 50, 0.2);
  border: 2px solid #cd7f32;
}

.rank {
  font-weight: 700;
  font-size: 1.5rem;
  min-width: 40px;
}

.leaderboard-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #555;
}

.player-username {
  flex: 1;
  font-weight: 600;
}

.player-score {
  color: #2ecc71;
  font-weight: 700;
}
</style>
