<script setup lang="ts">
import Dither from '../../components/Dither.vue'
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const code = route.query.code || ''

const username = ref('')
const selectedAvatar = ref(0)
const avatarList = ref<string[]>([])

for(let i=0;i<20;i++) avatarList.value.push(`../../../public/avatars/av${i}.png`)

const selectedAvatarImage = computed(() => avatarList.value[selectedAvatar.value] || '')

function joinGame() {
  if(!username.value) return alert('Enter username')
  alert(`Joining ${code} as ${username.value}`)
}

</script>

<template>
  <div class="app-wrapper">
    <Dither class="background" />
    <div class="content">
      <h1 class="title">Join Game</h1>
      <div class="card join-layout">
        <div class="left-panel">
          <h2>Choose Avatar</h2>
          <div class="avatars">
            <img v-for="(av,i) in avatarList" :key="i" :src="av" :class="['avatar', selectedAvatar===i?'selected':'']"
                 @click="selectedAvatar=i"/>
          </div>
        </div>
        <div class="right-panel">
          <input placeholder="Enter Username" v-model="username"/>
          <div class="avatar-preview">
            <img v-if="selectedAvatarImage" :src="selectedAvatarImage" />
          </div>
          <button class="btn" @click="joinGame">Join Game</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
