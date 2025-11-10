<script setup lang="ts">
import Dither from '../../components/Dither.vue'
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'
import { doc, onSnapshot } from 'firebase/firestore'
import { useRoute, useRouter } from 'vue-router'
import { db, setQuizUrl, startGame } from '../../lib/firebaseGame'

const gameCode = ref('')
const qrUrl = ref('')
const copied = ref(false)
const players = ref<any[]>([])
const qrExpanded = ref(false)
const quizUrl = ref('')
const loading = ref(false)
const quizLoaded = ref(false)

const route = useRoute()
const router = useRouter()

function formatCode(code: string) {
  if (code.length !== 6) return code
  return `${code.slice(0, 3)}-${code.slice(3)}`
}

async function generateQR() {
  const joinLink = `https://openhoot.app/join?code=${gameCode.value}`
  qrUrl.value = await QRCode.toDataURL(joinLink, { width: 400 })
}

function watchPlayers() {
  const gameRef = doc(db, 'games', gameCode.value)
  onSnapshot(gameRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data()
      players.value = data?.players || []
    }
  })
}

async function copyCode() {
  await navigator.clipboard.writeText(formatCode(gameCode.value))
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

async function loadQuiz() {
  if (!quizUrl.value.trim()) {
    alert('Please enter a quiz URL')
    return
  }

  loading.value = true
  try {
    await setQuizUrl(gameCode.value, quizUrl.value)
    quizLoaded.value = true
  } catch (err) {
    console.error(err)
    alert('Failed to load quiz. Make sure the URL is valid.')
  } finally {
    loading.value = false
  }
}

async function startGameNow() {
  if (!quizLoaded.value) {
    alert('Please load a quiz first')
    return
  }

  try {
    await startGame(gameCode.value)
    // Mark this user as host
    localStorage.setItem(`host-${gameCode.value}`, 'true')
    router.push(`/host/${gameCode.value}`)
  } catch (err) {
    console.error(err)
    alert('Failed to start game')
  }
}

onMounted(async () => {
  const code = route.query.code as string
  if (!code) {
    alert('No game code provided')
    router.push('/')
    return
  }

  gameCode.value = code
  await generateQR()
  watchPlayers()
})
</script>

<template>
  <div class="app-wrapper">
    <Dither class="background" />

    <div class="create-card">
      <!-- Left: Players List -->
      <div class="left">
        <h2>Players Joined</h2>
        <ul v-if="players.length > 0" class="player-list">
          <li v-for="p in players" :key="p.id">
            <img :src="p.avatar" :alt="p.username" />
            <span>{{ p.username }}</span>
          </li>
        </ul>
        <p v-else class="empty">No players yet...</p>
      </div>

      <!-- Right: Game Controls -->
      <div class="right">
        <h1 class="title">Game Created!</h1>
        <p class="subtitle">Share this code with players</p>

        <div class="code-box" @click="copyCode">
          {{ formatCode(gameCode) }}
        </div>
        <p v-if="copied" class="copy-feedback">✓ Copied!</p>

        <div class="qr-section">
          <img
              :src="qrUrl"
              alt="QR Code"
              :class="['qr', { expanded: qrExpanded }]"
              @click="qrExpanded = !qrExpanded"
          />
          <p class="qr-label">Scan to join</p>
        </div>

        <div class="quiz-section">
          <h3>Load Quiz</h3>
          <input
              v-model="quizUrl"
              type="text"
              placeholder="Enter quiz JSON URL"
              class="quiz-input"
              :disabled="quizLoaded"
          />
          <button
              @click="loadQuiz"
              class="load-btn"
              :disabled="loading || quizLoaded"
          >
            {{ loading ? 'Loading...' : quizLoaded ? '✓ Quiz Loaded' : 'Load Quiz' }}
          </button>
        </div>

        <button
            @click="startGameNow"
            class="btn start-btn"
            :disabled="!quizLoaded"
        >
          Start Game
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-wrapper {
  position: relative;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Inter', sans-serif;
  color: white;
  overflow: hidden;
}

.create-card {
  background-color: rgba(0, 0, 0, 0.75);
  border: 1px solid #333;
  border-radius: 20px;
  padding: 2.5rem;
  display: flex;
  flex-direction: row;
  gap: 3rem;
  width: 800px;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.6);
  z-index: 1;
}

.left,
.right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.left {
  border-right: 1px solid #333;
  padding-right: 2rem;
  align-items: flex-start;
}

.left h2 {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.title {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #aaa;
  margin-bottom: 1.5rem;
  text-align: center;
}

.code-box {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 0.2rem;
  background-color: rgba(17, 17, 17, 0.9);
  border: 2px solid #555;
  border-radius: 10px;
  padding: 0.6rem 1.3rem;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}

.code-box:hover {
  border-color: #777;
  background-color: rgba(26, 26, 26, 0.9);
}

.copy-feedback {
  color: #2ecc71;
  margin-top: 0.5rem;
}

.qr-section {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.qr {
  width: 140px;
  height: 140px;
  border-radius: 10px;
  border: 2px solid #555;
  background-color: white;
  padding: 4px;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.qr:hover {
  box-shadow: 0 0 10px #555;
}

.qr.expanded {
  transform: scale(4);
  z-index: 10;
}

.qr-label {
  font-size: 0.8rem;
  color: #777;
}

.quiz-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-top: 1.5rem;
}

.quiz-section h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.quiz-input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #555;
  border-radius: 10px;
  background-color: rgba(17, 17, 17, 0.9);
  color: white;
  font-size: 0.9rem;
  outline: none;
}

.quiz-input:focus {
  border-color: #888;
}

.quiz-input:disabled {
  opacity: 0.6;
}

.load-btn {
  background-color: rgba(17, 17, 17, 0.9);
  color: white;
  border: 2px solid #555;
  border-radius: 10px;
  padding: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.load-btn:hover:not(:disabled) {
  border-color: #888;
  background-color: rgba(26, 26, 26, 0.9);
}

.load-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.start-btn {
  background-color: rgba(17, 17, 17, 0.9);
  color: white;
  border: 2px solid #555;
  border-radius: 10px;
  padding: 0.8rem 1.4rem;
  font-weight: 600;
  margin-top: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.btn.start-btn:hover:not(:disabled) {
  border-color: #888;
  background-color: rgba(26, 26, 26, 0.9);
}

.btn.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty {
  color: #888;
  font-size: 0.95rem;
}

.player-list {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

.player-list li {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.8rem;
  background-color: rgba(17, 17, 17, 0.8);
  border: 1px solid #333;
  border-radius: 10px;
  padding: 0.4rem 0.7rem;
}

.player-list li img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

.background {
  position: absolute;
  inset: 0;
  z-index: 0;
}
</style>
