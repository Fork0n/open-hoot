// app/lib/firebaseGame.ts
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'

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
const db = getFirestore(app)

// Generate plain 6-char code
export function generateGameCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code // NO DASH
}

// Create game document
export async function createGameDoc(): Promise<string> {
    const code = generateGameCode()
    const ref = doc(db, 'games', code)
    await setDoc(ref, {
        createdAt: new Date(),
        players: [],
        status: 'waiting',
    })
    return code
}

// Check existence
export async function checkGameExists(code: string) {
    const ref = doc(db, 'games', code)
    const snap = await getDoc(ref)
    return snap.exists()
}
