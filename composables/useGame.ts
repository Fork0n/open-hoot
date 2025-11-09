// ~/composables/useGame.ts
import { ref } from 'vue'
import {
    doc,
    getDoc,
    setDoc,
    runTransaction,
    Timestamp
} from 'firebase/firestore'
import { db } from '../firebase-config'

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

// generate one 6-char code (no dash)
function randomCode(): string {
    let out = ''
    for (let i = 0; i < 6; i++) {
        out += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length))
    }
    return out
}

// format for UI: AAA-BBB
export function formatCodeForUI(code: string) {
    const clean = code.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6)
    return clean.length > 3 ? `${clean.slice(0,3)}-${clean.slice(3)}` : clean
}

// create a unique room doc using transaction, returns the code (no dash) or throws
export async function createRoomTransaction(data: Record<string, any>, maxAttempts = 6) {
    // data: initial room metadata (host, createdAt, options...)
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const code = randomCode()
        const roomRef = doc(db, 'rooms', code)

        try {
            // transaction: only create if doesn't exist
            await runTransaction(db, async (tx) => {
                const snap = await tx.get(roomRef)
                if (snap.exists()) {
                    // someone already took it -> abort this transaction (throw to outer)
                    throw new Error('CODE_EXISTS')
                }
                tx.set(roomRef, {
                    ...data,
                    createdAt: Timestamp.now(),
                    code, // store it also
                    players: [], // empty initially
                    status: 'waiting'
                })
            })
            // success
            return code
        } catch (err: any) {
            if (err.message === 'CODE_EXISTS') {
                // try next code
                continue
            }
            // other error -> bubble up
            throw err
        }
    }
    throw new Error('UNABLE_TO_CREATE_ROOM')
}

// join room: returns room data if exists, else null
export async function joinRoom(codeInput: string) {
    const code = codeInput.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6)
    if (code.length !== 6) throw new Error('INVALID_CODE')

    const roomRef = doc(db, 'rooms', code)
    const snap = await getDoc(roomRef)
    if (!snap.exists()) {
        return null
    }
    return { id: snap.id, ...snap.data() }
}

// helper: check if any empty slot (or check players length)
export function isRoomFull(roomData: any, maxPlayers = 8) {
    const players = roomData?.players ?? []
    return players.length >= maxPlayers
}
