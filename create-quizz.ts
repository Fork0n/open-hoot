import readline from 'readline'
import fs from 'fs'
import path from 'path'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve)
    })
}

async function createQuiz() {
    const quiz = []

    const fileName = await question('Enter quiz/file name: ')
    console.log('\n--- Creating Quiz ---\n')

    let addMore = true
    let questionNumber = 1

    while (addMore) {
        console.log(`\n=== Question ${questionNumber} ===`)

        const questionText = await question('Enter question: ')
        const imageUrl = await question('Enter image link (or press Enter to skip): ')

        const answers = []
        for (let i = 1; i <= 4; i++) {
            const answer = await question(`Enter answer ${i}: `)
            answers.push(answer)
        }

        let correctIndex = -1
        while (correctIndex < 0 || correctIndex > 3) {
            const correctInput = await question('Select correct answer (0-3): ')
            correctIndex = parseInt(correctInput)
            if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
                console.log('⚠️  Invalid input. Please enter a number between 0 and 3.')
                correctIndex = -1
            }
        }

        quiz.push({
            question: questionText,
            img: imageUrl || undefined,
            answers: answers,
            correct: correctIndex
        })

        console.log('\n✓ Question added successfully!')

        const response = await question('\nAdd another question? (y/n): ')
        addMore = response.toLowerCase() === 'y'
        questionNumber++
    }

    // Save the quiz
    const outputDir = './quizzes'
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    const sanitizedFileName = fileName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()
    const filePath = path.join(outputDir, `${sanitizedFileName}.json`)

    fs.writeFileSync(filePath, JSON.stringify(quiz, null, 2), 'utf8')

    console.log(`\n✅ Quiz saved to: ${filePath}`)
    console.log(`📊 Total questions: ${quiz.length}`)

    rl.close()
}

createQuiz().catch(console.error)