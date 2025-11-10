import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'

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

export function generateGameCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
}

export async function createGameDoc(): Promise<string> {
    const code = generateGameCode()
    const gameRef = doc(db, 'games', code)
    await setDoc(gameRef, {
        code,
        state: 'waiting',
        players: [],
        scores: {},
        streaks: {},
        answered: {},
        quiz: [],
        currentQuestion: 0,
        createdAt: Date.now()
    })
    return code
}

export async function checkGameExists(code: string): Promise<boolean> {
    const normalizedCode = code.toUpperCase().replace(/-/g, '')
    const gameRef = doc(db, 'games', normalizedCode)
    const snap = await getDoc(gameRef)
    return snap.exists()
}

export async function setQuizUrl(gameCode: string, quizUrl: string) {
    const normalizedCode = gameCode.toUpperCase().replace(/-/g, '')
    const gameRef = doc(db, 'games', normalizedCode)
    const quiz = await fetchQuiz(quizUrl)
    await updateDoc(gameRef, { quiz })
}

export async function startGame(gameCode: string) {
    const normalizedCode = gameCode.toUpperCase().replace(/-/g, '')
    const gameRef = doc(db, 'games', normalizedCode)
    await updateDoc(gameRef, {
        state: 'started',
        currentQuestion: 0,
        answered: {}
    })
}

export async function fetchQuiz(url: string) {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch quiz')
    return await res.json()
}

export async function addPlayerToGame(gameCode: string, playerId: string, username: string, avatar: string) {
    const normalizedCode = gameCode.toUpperCase().replace(/-/g, '')
    const gameRef = doc(db, 'games', normalizedCode)
    await updateDoc(gameRef, {
        players: arrayUnion({ id: playerId, username, avatar })
    })
}

export async function submitAnswer(gameCode: string, playerId: string, answerIndex: number, timeMs: number) {
    const normalizedCode = gameCode.toUpperCase().replace(/-/g, '')
    const gameRef = doc(db, 'games', normalizedCode)
    const snap = await getDoc(gameRef)

    if (!snap.exists()) {
        throw new Error('Game not found')
    }

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
        const basePoints = 1000
        const timeBonus = Math.max(0, 500 - Math.floor(timeMs / 40))
        streaks[playerId] = (streaks[playerId] || 0) + 1
        const streakBonus = streaks[playerId] * 100
        points = basePoints + timeBonus + streakBonus
    } else {
        streaks[playerId] = 0
    }

    scores[playerId] = (scores[playerId] || 0) + points
    answered[playerId] = answerIndex

    await updateDoc(gameRef, { scores, streaks, answered })
}

export async function nextQuestion(gameCode: string, currentQ: number, quizLength: number) {
    const gameRef = doc(db, 'games', gameCode.toUpperCase())

    if (currentQ < quizLength - 1) {
        await updateDoc(gameRef, {
            currentQuestion: currentQ + 1,
            answered: {}
        })
    } else {
        await endGame(gameCode)
    }
}

export async function endGame(gameCode: string) {
    const gameRef = doc(db, 'games', gameCode.toUpperCase())
    await updateDoc(gameRef, {
        state: 'ended'
    })
}

