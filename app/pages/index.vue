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

    <a href="https://github.com/Fork0n/open-hoot" target="_blank" class="github-link" title="View on GitHub">
      <svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
    </a>

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
.app-wrapper {
  position: fixed;
  inset: 0;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  color: white;
}

.background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.github-link {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10;
  color: white;
  opacity: 0.7;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.github-link:hover {
  opacity: 1;
  transform: scale(1.1);
  background-color: rgba(0, 0, 0, 0.7);
  border-color: rgba(255, 255, 255, 0.3);
}

.content {
  position: relative;
  z-index: 1;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
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

.digit-inputs {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}

.digit-box {
  width: 3rem;
  height: 3.5rem;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  text-transform: uppercase;
  border: 2px solid #555;
  border-radius: 10px;
  background-color: #111;
  color: white;
  outline: none;
  transition: border 0.2s;
  padding: 0;
  line-height: 3.5rem;
  box-sizing: border-box;
}

.digit-box:focus {
  border-color: #888;
}

.dash {
  font-size: 1.5rem;
  margin: 0 0.3rem;
  user-select: none;
  font-weight: 700;
}

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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.divider {
  margin: 0.5rem 0;
  font-weight: 600;
  color: #aaa;
  text-align: center;
}
</style>
