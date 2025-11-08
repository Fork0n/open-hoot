<script setup lang="ts">
import Dither from '../components/Dither.vue'
</script>

<template>
  <div class="app-wrapper">
    <Dither class="background" />
    <div class="content">
      <h1 class="title">Open-Hoot</h1>
      <div class="simple" id="greet">
<!--        this is the like yk window inside the site so that the bg is visible and you still have contrast for ellements-->
        <h1 class="">Enter code : </h1>
        <input type="text" placeholder="xxx-xxx" />
        <button>Join</button>
        <h1>OR</h1>
        <button>Create Game</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-wrapper {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

/* the magic sauce */
.background {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* your page content stays above */
.content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.simple {
  background-color: #000;
  border-radius: 30px;
  padding: 2rem;
}

#greet {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 3rem;
  font-weight: bold;
}
</style>
