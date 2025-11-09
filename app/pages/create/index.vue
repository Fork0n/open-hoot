<script setup lang="ts">
import Dither from '../../components/Dither.vue'
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'

// ---- Firebase setup ----
const firebaseConfig = {
  apiKey: "AIzaSyAgzXYlC2J7QaYK-uCoIAinXpJfZOrQwrk",
  authDomain: "open-hoot.firebaseapp.com",
  projectId: "open-hoot",
  storageBucket: "open-hoot.firebasestorage.app",
  messagingSenderId: "741706643693",
  appId: "1:741706643693:web:96215007687744664af4e4",
  measurementId: "G-Y53QS3C4JX"
};
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const router = useRouter()

// ---- state ----
const gameCode = ref('')
const qrUrl = ref('')
const copied = ref(false)
const players = ref<any[]>([])
const qrExpanded = ref(false)
const gameStarted = ref(false)

// generate code: store unformatted in DB, display with dash
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
  return code
}

// format code for display: XXX-XXX
function formatCode(code: string) {
  return code.slice(0,3) + '-' + code.slice(3)
}

// create game doc + QR + watch players
async function createGame() {
  gameCode.value = generateCode()
  await setDoc(doc(db, 'games', gameCode.value), {
    createdAt: Date.now(),
    players: [],
    state: 'waiting', // waiting -> started
    currentQuestion: null
  })
  await generateQR()
  watchPlayers()
  history.replaceState(null, '', `?code=${gameCode.value}`) // sync URL
}

// generate QR once
async function generateQR() {
  const link = `https://openhoot.me/join?code=${gameCode.value}`
  qrUrl.value = await QRCode.toDataURL(link)
}

// watch for players joining in real time
function watchPlayers() {
  onSnapshot(doc(db, 'games', gameCode.value), (snap) => {
    if (snap.exists()) {
      const data = snap.data()
      players.value = data.players || []
      if (data.state === 'started' && !gameStarted.value) {
        gameStarted.value = true
        router.push(`/game/${gameCode.value}`) // move to quiz page
      }
    }
  })
}

// copy code
async function copyCode() {
  await navigator.clipboard.writeText(gameCode.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

// start game
async function startGame() {
  const gameRef = doc(db, 'games', gameCode.value)
  await updateDoc(gameRef, { state: 'started', currentQuestion: 0 })
}

onMounted(createGame)
</script>

<template>
  <div class="app-wrapper">
    <Dither class="background" />

    <div class="create-card">
      <!-- left -->
      <div class="left">
        <h1 class="title">Lobby</h1>
        <p class="subtitle">Share this code with your friends:</p>

        <div class="code-box" @click="copyCode">{{ formatCode(gameCode) }}</div>
        <p class="copy-feedback" v-if="copied">Copied!</p>

        <div class="qr-section" v-if="qrUrl">
          <img
              :src="qrUrl"
              alt="QR"
              :class="['qr', qrExpanded ? 'expanded' : '']"
              @click="qrExpanded = !qrExpanded"
          />
          <p class="qr-label">Click to enlarge</p>
        </div>

        <button class="btn start-btn" @click="startGame">Start Game</button>
      </div>

      <!-- right -->
      <div class="right">
        <h2>Players Joined</h2>
        <div v-if="players.length === 0" class="empty">Waiting for players...</div>
        <ul v-else class="player-list">
          <li v-for="(p, i) in players" :key="i">
            <img v-if="p.avatar" :src="p.avatar" alt="pfp" />
            <span>{{ p.username }}</span>
          </li>
        </ul>
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
  background-color: rgba(0, 0, 0, 0.85);
  border: 1px solid #333;
  border-radius: 20px;
  padding: 2.5rem;
  display: flex;
  flex-direction: row;
  gap: 3rem;
  width: 800px;
  box-shadow: 0 0 40px rgba(0,0,0,0.6);
  z-index: 1;
}

.left, .right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  background-color: #111;
  border: 2px solid #555;
  border-radius: 10px;
  padding: 0.6rem 1.3rem;
  cursor: pointer;
  transition: all 0.2s;
}

.code-box:hover {
  border-color: #777;
  background-color: #1a1a1a;
}

.copy-feedback {
  color: #00e676;
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
  box-shadow: 0 0 10px #00bcd4;
}

.qr.expanded {
  transform: scale(2);
  z-index: 10;
}

.qr-label {
  font-size: 0.8rem;
  color: #777;
}

.btn.start-btn {
  background-color: #000;
  color: white;
  border: 2px solid #555;
  border-radius: 10px;
  padding: 0.6rem 1.4rem;
  font-weight: 600;
  margin-top: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn.start-btn:hover {
  border-color: #888;
  background-color: #111;
}

/* right side */
.right {
  border-left: 1px solid #333;
  padding-left: 2rem;
  align-items: flex-start;
}

.right h2 {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 1rem;
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
  background-color: #111;
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

/* Dither background */
.background {
  position: absolute;
  inset: 0;
  z-index: 0;
}
</style>
