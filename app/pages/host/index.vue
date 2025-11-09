<script setup lang="ts">
import Dither from '../../components/Dither.vue'
import { ref } from 'vue'

const questionList = ref([
  {question:'What is 2+2?', ans:['1','2','3','4'], correct:3},
  {question:'Capital of France?', ans:['London','Paris','Berlin','Rome'], correct:1},
])

const currentQ = ref(0)

function nextQuestion() {
  if(currentQ.value<questionList.value.length-1) currentQ.value++
}

</script>

<template>
  <div class="app-wrapper">
    <Dither class="background" />
    <div class="content">
      <div class="card question-panel">
        <h2>{{ questionList[currentQ].question }}</h2>
        <div class="flex-col">
          <button class="btn" v-for="(a,i) in questionList[currentQ].ans" :key="i">{{ a }}</button>
        </div>
        <button class="btn" @click="nextQuestion">Next Question</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* reuse question-panel, card, btn, neon glow styles */
</style>
