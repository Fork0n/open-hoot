// app/lib/firebaseGame.ts
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'

// Firebase setup
const firebaseConfig = {
    apiKey: "AIzaSyAgzXYlC2J7QaYK-uCoIAinXpJfZOrQwrk",
    authDomain: "open-hoot.firebaseapp.com",
    projectId: "open-hoot",
    storageBucket: "open-hoot.firebasestorage.app",
    messagingSenderId: "741706643693",
    appId: "1:741706643693:web:96215007687744664af4e4",
    measurementId: "G-Y53QS3C4JX"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Generate plain 6-char code
export function generateGameCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

// Create game document with simple uniqueness retry
export async function createGameDoc(): Promise<string> {
    const maxAttempts = 8
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const code = generateGameCode()
        const ref = doc(db, 'games', code)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
            await setDoc(ref, {
                createdAt: Date.now(),
                players: [],
                state: 'waiting',
                currentQuestion: null,
                quizUrl: null,
                quiz: null,
                scores: {},
                streaks: {},
                answered: {}
            })
            return code
        }
    }
    throw new Error('Failed to generate a unique game code.')
}

// Check existence
export async function checkGameExists(code: string) {
    const ref = doc(db, 'games', code)
    const snap = await getDoc(ref)
    return snap.exists()
}

// Update game with quiz URL and initialize quiz data
export async function setQuizUrl(gameCode: string, quizUrl: string) {
    const gameRef = doc(db, 'games', gameCode)
    const quiz = await fetchQuiz(quizUrl)
    await updateDoc(gameRef, {
        quizUrl,
        quiz,
        currentQuestion: 0
    })
}

// Fetch quiz from URL
export async function fetchQuiz(url: string) {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch quiz')
    return response.json()
}

// Submit answer
export async function submitAnswer(gameCode: string, playerId: string, answerIndex: number, timeMs: number) {
    const gameRef = doc(db, 'games', gameCode)
    const snap = await getDoc(gameRef)
    const data = snap.data()
    const quiz = data?.quiz
    const currentQ = data?.currentQuestion ?? 0
    const correctIndex = quiz?.[currentQ]?.correct

    const isCorrect = answerIndex === correctIndex
    const scores = data?.scores || {}
    const streaks = data?.streaks || {}
    const answered = data?.answered || {}

    let points = 0
    if (isCorrect) {
        const speedBonus = Math.max(0, 1000 - Math.floor(timeMs / 10))
        const currentStreak = (streaks[playerId] || 0) + 1
        const streakBonus = currentStreak > 1 ? currentStreak * 50 : 0
        points = 100 + speedBonus + streakBonus
        streaks[playerId] = currentStreak
    } else {
        streaks[playerId] = 0
    }

    scores[playerId] = (scores[playerId] || 0) + points
    answered[playerId] = true

    await updateDoc(gameRef, { scores, streaks, answered })
}
