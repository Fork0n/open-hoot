<script setup lang="ts">
import Dither from '../components/Dither.vue'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { createGameDoc, checkGameExists } from '../lib/firebaseGame'

const router = useRouter()
const code = ref(Array(6).fill(''))
const loading = ref(false)

async function createGame() {
  if (loading.value) return
  loading.value = true
  try {
    const newCode = await createGameDoc()
    // navigate to create page with code query (replace or push is OK)
    router.push(`/create?code=${newCode}`)
  } catch (err) {
    console.error(err)
    alert('Failed to create game.')
  } finally {
    loading.value = false
  }
}

async function joinGame() {
  const joinedCode = formattedCode.value
  if (joinedCode.length < 7) {
    alert('Please enter a full 6-digit code.')
    return
  }
  const exists = await checkGameExists(joinedCode.replace('-', ''))
  if (!exists) {
    alert('Game not found.')
    return
  }
  router.push(`/join?code=${joinedCode.replace('-', '')}`)
}

function onInput(e: Event, index: number) {
  const target = e.target as HTMLInputElement
  let val = target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1)
  code.value[index] = val
  if (val && index < 5) {
    const next = document.getElementById(`digit-${index + 1}`) as HTMLInputElement
    next?.focus()
  }
}

function onKeyDown(e: KeyboardEvent, index: number) {
  if (e.key === 'Backspace' && !code.value[index] && index > 0) {
    const prev = document.getElementById(`digit-${index - 1}`) as HTMLInputElement
    prev?.focus()
  }
}

const formattedCode = computed(() => {
  return code.value.slice(0, 3).join('') + '-' + code.value.slice(3).join('')
})
</script>

<template>
  <div class="app-wrapper">
    <Dither class="background" />

    <div class="content">
      <h1 class="title">Open-Hoot</h1>

      <div class="card">
        <h2>Enter code:</h2>

        <div class="digit-inputs">
          <input
              v-for="(digit, i) in code.slice(0, 3)"
              :key="i"
              :id="`digit-${i}`"
              maxlength="1"
              type="text"
              v-model="code[i]"
              @input="onInput($event, i)"
              @keydown="onKeyDown($event, i)"
              class="digit-box"
          />
          <span class="dash">-</span>
          <input
              v-for="(digit, i) in code.slice(3, 6)"
              :key="i + 3"
              :id="`digit-${i + 3}`"
              maxlength="1"
              type="text"
              v-model="code[i + 3]"
              @input="onInput($event, i + 3)"
              @keydown="onKeyDown($event, i + 3)"
              class="digit-box"
          />
        </div>

        <button class="btn join-btn" @click="joinGame">Join Game</button>
        <div class="divider">OR</div>
        <button type="button" @click="createGame" class="btn create" :disabled="loading">
          {{ loading ? 'Creating...' : 'Create Game' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* styles unchanged */
.app-wrapper {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  color: white;
}

.background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: center;
}

.card {
  background-color: rgba(0, 0, 0, 0.7);
  border: 1px solid #333;
  border-radius: 20px;
  padding: 2rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  min-width: 320px;
}

h2 {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

/* Digit inputs */
.digit-inputs {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}

.digit-box {
  width: 2.8rem;
  height: 3rem;
  text-align: center;
  font-size: 1.5rem;
  text-transform: uppercase;
  border: 2px solid #555;
  border-radius: 10px;
  background-color: #111;
  color: white;
  outline: none;
  transition: border 0.2s;
}

.digit-box:focus {
  border-color: #888;
}

.dash {
  font-size: 1.5rem;
  margin: 0 0.3rem;
  user-select: none;
}

/* Buttons (black & white) */
.btn {
  background-color: #111;
  color: white;
  border: 2px solid #555;
  border-radius: 10px;
  padding: 0.6rem 1.4rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 150px;
  text-align: center;
}

.btn:hover {
  border-color: #888;
  background-color: #222;
}

.divider {
  margin: 0.5rem 0;
  font-weight: 600;
  color: #aaa;
  text-align: center;
}
</style>
