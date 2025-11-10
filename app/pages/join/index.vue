<script setup lang="ts">
import Dither from '../../components/Dither.vue'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { addPlayerToGame } from '../../lib/firebaseGame'

const route = useRoute()
const router = useRouter()
const code = (route.query.code as string) || ''

const username = ref('')
const selectedAvatar = ref(0)
const avatarList = ref<number[]>(Array.from({ length: 20 }, (_, i) => i))
const joining = ref(false)

const selectedAvatarImage = computed(() => `/avatars/av${selectedAvatar.value}.png`)

async function joinGame() {
  if (!username.value.trim()) {
    alert('Enter username')
    return
  }

  if (!code) {
    alert('No game code provided')
    return
  }

  joining.value = true
  try {
    const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('playerId', playerId)
    localStorage.setItem(`player-${code}-id`, playerId)

    await addPlayerToGame(code, playerId, username.value, selectedAvatarImage.value)

    router.push(`/game/${code}`)
  } catch (err) {
    console.error(err)
    alert('Failed to join game')
  } finally {
    joining.value = false
  }
}
</script>

<template>
  <div class="app-wrapper">
    <Dither class="background" />
    <div class="content">
      <h1 class="title">Join Game</h1>

      <div class="main-card">
        <div class="avatar-section">
          <h2>Choose Your Character</h2>

          <div class="avatar-preview-large">
            <img :src="selectedAvatarImage" :alt="`Avatar ${selectedAvatar}`" />
          </div>

          <div class="avatar-grid">
            <button
                v-for="(idx) in avatarList"
                :key="idx"
                class="avatar-item"
                :class="{ active: selectedAvatar === idx }"
                @click="selectedAvatar = idx"
                :title="`Avatar ${idx}`"
            >
              <img :src="`/avatars/av${idx}.png`" :alt="`Avatar ${idx}`" />
            </button>
          </div>

          <p class="avatar-counter">{{ selectedAvatar + 1 }} / {{ avatarList.length }}</p>
        </div>

        <div class="username-section">
          <h2>Your Name</h2>

          <div class="input-wrapper">
            <input
                v-model="username"
                type="text"
                placeholder="Enter your username"
                class="username-input"
                @keyup.enter="joinGame"
                maxlength="20"
            />
            <span class="char-count">{{ username.length }}/20</span>
          </div>

          <div class="preview-card">
            <div class="preview-title">Preview</div>
            <div class="preview-content">
              <img :src="selectedAvatarImage" :alt="username || 'Avatar'" class="preview-avatar" />
              <div class="preview-info">
                <p class="preview-name">{{ username || '...' }}</p>
                <p class="preview-status">Ready to play!</p>
              </div>
            </div>
          </div>

          <button
              class="btn-join"
              @click="joinGame"
              :disabled="joining || !username.trim()"
          >
            <span v-if="!joining">Join Game</span>
            <span v-else>Joining...</span>
          </button>

          <p class="code-display">Game Code: <strong>{{ code }}</strong></p>
        </div>
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

.background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  width: 100%;
}

.title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: center;
}

.main-card {
  background-color: rgba(0, 0, 0, 0.75);
  border: 2px solid #333;
  border-radius: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 2.5rem;
  width: 100%;
  max-width: 900px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  border-right: 1px solid #444;
  padding-right: 2rem;
}

.avatar-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.avatar-preview-large {
  width: 140px;
  height: 140px;
  border-radius: 15px;
  overflow: hidden;
  border: 3px solid #555;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #111;
}

.avatar-preview-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.8rem;
  width: 100%;
}

.avatar-item {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  border: 2px solid #555;
  background-color: #111;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-item:hover {
  border-color: #888;
  transform: scale(1.08);
}

.avatar-item.active {
  border: 3px solid #888;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.avatar-counter {
  color: #aaa;
  font-size: 0.9rem;
  margin: 0;
}

.username-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-left: 2rem;
}

.username-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.input-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
}

.username-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #555;
  border-radius: 10px;
  background-color: #111;
  color: white;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s;
}

.username-input:focus {
  border-color: #888;
}

.char-count {
  font-size: 0.8rem;
  color: #888;
  margin-top: 0.3rem;
  text-align: right;
}

.preview-card {
  background-color: rgba(255, 255, 255, 0.05);
  border: 2px solid #555;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.preview-title {
  font-size: 0.9rem;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preview-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.preview-avatar {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid #555;
}

.preview-info {
  flex: 1;
}

.preview-name {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: white;
  word-break: break-all;
}

.preview-status {
  font-size: 0.9rem;
  color: #2ecc71;
  margin: 0.3rem 0 0 0;
}

.btn-join {
  background-color: rgba(17, 17, 17, 0.9);
  color: white;
  border: 2px solid #555;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-join:hover:not(:disabled) {
  background-color: rgba(26, 26, 26, 0.9);
  border-color: #888;
  transform: translateY(-2px);
}

.btn-join:active:not(:disabled) {
  transform: translateY(0);
}

.btn-join:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.code-display {
  text-align: center;
  color: #888;
  font-size: 0.9rem;
  margin: 0;
}

.code-display strong {
  color: white;
  font-family: monospace;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .main-card {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .avatar-section {
    border-right: none;
    border-bottom: 1px solid #444;
    padding-right: 0;
    padding-bottom: 1.5rem;
  }

  .username-section {
    padding-left: 0;
  }

  .avatar-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .title {
    font-size: 2rem;
  }
}
</style>
