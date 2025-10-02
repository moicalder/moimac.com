'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import MathModeLeaderboard from '@/components/MathModeLeaderboard'

type Operator = '+' | '-' | '×' | '÷'
type GameState = 'operator' | 'digits' | 'playing' | 'results' | 'leaderboard'

interface Problem {
  num1: number
  num2: number
  operator: Operator
  correctAnswer: number
}

interface Result {
  problem: string
  userAnswer: number
  correctAnswer: number
  isCorrect: boolean
}

interface LeaderboardEntry {
  id: string
  name: string
  score: number
  percentage: number
  totalProblems: number
  correctAnswers: number
  operator: Operator
  difficulty: string
  date: string
}

export default function MathModePage() {
  const router = useRouter()
  const { ready, authenticated, user } = usePrivy()
  const [gameState, setGameState] = useState<GameState>('operator')
  const [selectedOperator, setSelectedOperator] = useState<Operator>('+')
  const [digits1, setDigits1] = useState(1)
  const [digits2, setDigits2] = useState(1)
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastResult, setLastResult] = useState<Result | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [showNewRecord, setShowNewRecord] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get username for leaderboard
  const userName = user?.email?.address?.split('@')[0] || 'Player'

  const generateNumber = useCallback((digits: number): number => {
    const min = Math.pow(10, digits - 1)
    const max = Math.pow(10, digits) - 1
    return Math.floor(Math.random() * (max - min + 1)) + min
  }, [])

  const generateProblem = useCallback((): Problem => {
    const num1 = generateNumber(digits1)
    const num2 = generateNumber(digits2)
    
    let correctAnswer: number
    let finalNum1 = num1
    let finalNum2 = num2
    
    switch (selectedOperator) {
      case '+':
        correctAnswer = num1 + num2
        break
      case '-':
        // Ensure positive result
        if (num1 < num2) {
          finalNum1 = num2
          finalNum2 = num1
        }
        correctAnswer = finalNum1 - finalNum2
        break
      case '×':
        correctAnswer = num1 * num2
        break
      case '÷':
        // Ensure clean division with proper digit constraints
        const divisor = generateNumber(digits2)
        const maxQuotient = Math.floor(Math.pow(10, digits1) / divisor)
        const minQuotient = Math.max(1, Math.floor(Math.pow(10, digits1 - 1) / divisor))
        const quotient = Math.floor(Math.random() * (maxQuotient - minQuotient + 1)) + minQuotient
        correctAnswer = quotient
        finalNum1 = quotient * divisor
        finalNum2 = divisor
        break
      default:
        correctAnswer = 0
    }
    
    return {
      num1: finalNum1,
      num2: finalNum2,
      operator: selectedOperator,
      correctAnswer
    }
  }, [selectedOperator, digits1, digits2, generateNumber])

  // Leaderboard functions
  const loadLeaderboard = useCallback((): LeaderboardEntry[] => {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem('mathmode-leaderboard')
    return stored ? JSON.parse(stored) : []
  }, [])

  const saveToLeaderboard = useCallback((entry: LeaderboardEntry) => {
    if (typeof window === 'undefined') return false
    const currentBoard = loadLeaderboard()
    currentBoard.push(entry)
    
    // Sort by score descending
    currentBoard.sort((a, b) => b.score - a.score)
    
    // Keep top 5 for each operator
    const operators: Operator[] = ['+', '-', '×', '÷']
    const balancedBoard: LeaderboardEntry[] = []
    
    operators.forEach(op => {
      const operatorEntries = currentBoard.filter(e => e.operator === op).slice(0, 5)
      balancedBoard.push(...operatorEntries)
    })
    
    localStorage.setItem('mathmode-leaderboard', JSON.stringify(balancedBoard))
    setLeaderboard(balancedBoard)
    
    // Check if this is a new record
    const operatorEntries = balancedBoard.filter(e => e.operator === entry.operator)
    const newRecordPosition = operatorEntries.findIndex(e => e.id === entry.id)
    return newRecordPosition < 3 && newRecordPosition !== -1
  }, [loadLeaderboard])

  const calculateScore = useCallback((correct: number, total: number, percentage: number): number => {
    const difficultyMultiplier = digits1 + digits2
    const operatorMultiplier = selectedOperator === '÷' ? 1.5 : selectedOperator === '×' ? 1.3 : 1.0
    return Math.round(percentage * total * difficultyMultiplier * operatorMultiplier)
  }, [digits1, digits2, selectedOperator])

  const getDifficultyString = useCallback((): string => {
    return `${digits1}×${digits2} digits`
  }, [digits1, digits2])

  const startNewProblem = useCallback(() => {
    const problem = generateProblem()
    setCurrentProblem(problem)
    setUserAnswer('')
    setShowFeedback(false)
    setLastResult(null)
    // Auto-focus input after a brief delay to ensure it's rendered
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [generateProblem])

  const submitAnswer = useCallback(() => {
    if (!currentProblem || userAnswer === '') return

    const userNum = parseInt(userAnswer)
    const isCorrect = userNum === currentProblem.correctAnswer
    
    const result: Result = {
      problem: `${currentProblem.num1} ${currentProblem.operator} ${currentProblem.num2}`,
      userAnswer: userNum,
      correctAnswer: currentProblem.correctAnswer,
      isCorrect
    }
    
    setResults(prev => [...prev, result])
    setLastResult(result)
    setShowFeedback(true)
  }, [currentProblem, userAnswer])

  const nextProblem = useCallback(() => {
    startNewProblem()
  }, [startNewProblem])

  // Handle Enter key when showing feedback
  const handleFeedbackKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && showFeedback) {
      e.preventDefault()
      nextProblem()
    }
  }, [showFeedback, nextProblem])

  useEffect(() => {
    if (showFeedback) {
      window.addEventListener('keydown', handleFeedbackKeyPress)
      return () => window.removeEventListener('keydown', handleFeedbackKeyPress)
    }
  }, [showFeedback, handleFeedbackKeyPress])

  const finishSession = useCallback(async () => {
    if (results.length > 0) {
      const correctCount = results.filter(r => r.isCorrect).length
      const totalCount = results.length
      const incorrectCount = totalCount - correctCount
      const percentage = Math.round((correctCount / totalCount) * 100)
      const score = calculateScore(correctCount, totalCount, percentage)
      const avgDifficulty = (digits1 + digits2) / 2
      
      // Save to local leaderboard
      const entry: LeaderboardEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: userName,
        score,
        percentage,
        totalProblems: totalCount,
        correctAnswers: correctCount,
        operator: selectedOperator,
        difficulty: getDifficultyString(),
        date: new Date().toLocaleDateString()
      }
      
      const isNewRecord = saveToLeaderboard(entry)
      setShowNewRecord(isNewRecord)

      // Submit to database
      if (user?.id) {
        try {
          await fetch('/api/mathmode/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              operator: selectedOperator,
              totalQuestions: totalCount,
              correctAnswers: correctCount,
              incorrectAnswers: incorrectCount,
              difficulty: avgDifficulty,
              digits1: digits1,
              digits2: digits2,
            }),
            cache: 'no-store',
          })
        } catch (error) {
          console.error('Failed to submit session:', error)
        }
      }
    }
    setGameState('results')
  }, [results, user, selectedOperator, digits1, digits2, userName, calculateScore, getDifficultyString, saveToLeaderboard])

  const playAgain = useCallback(() => {
    setGameState('operator')
    setCurrentProblem(null)
    setUserAnswer('')
    setResults([])
    setShowFeedback(false)
    setLastResult(null)
    setShowNewRecord(false)
  }, [])

  useEffect(() => {
    if (gameState === 'playing' && !currentProblem) {
      startNewProblem()
    }
  }, [gameState, currentProblem, startNewProblem])

  useEffect(() => {
    if (gameState === 'digits' || gameState === 'operator') {
      setCurrentProblem(null)
      setUserAnswer('')
      setResults([])
      setShowFeedback(false)
      setLastResult(null)
      setShowNewRecord(false)
    }
  }, [gameState])

  useEffect(() => {
    setLeaderboard(loadLeaderboard())
  }, [loadLeaderboard])

  // Redirect if not authenticated
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!authenticated) {
    router.push('/')
    return null
  }

  const correctCount = results.filter(r => r.isCorrect).length
  const totalCount = results.length
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="btn-secondary"
          >
            ← Back to Home
          </button>
          <h1 className="text-2xl font-bold text-gray-900">🔢 MathMode</h1>
        </div>

        {gameState === 'operator' && (
          <div className="card text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Hi {userName}! 👋</h2>
            <p className="text-gray-600 mb-6">Which operation would you like to practice?</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { op: '+' as Operator, name: 'Addition', icon: '➕' },
                { op: '-' as Operator, name: 'Subtraction', icon: '➖' },
                { op: '×' as Operator, name: 'Multiplication', icon: '✖️' },
                { op: '÷' as Operator, name: 'Division', icon: '➗' }
              ].map(({ op, name, icon }) => (
                <button
                  key={op}
                  onClick={() => setSelectedOperator(op)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedOperator === op
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-primary-300 hover:bg-primary-25'
                  }`}
                >
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="font-medium">{name}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setGameState('digits')}
              className="btn-primary w-full"
            >
              Continue
            </button>
          </div>
        )}

        {gameState === 'digits' && (
          <div className="card text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Problem Difficulty</h2>
            <p className="text-gray-600 mb-6">Choose how many digits for each number</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First number digits: {digits1}
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={digits1}
                  onChange={(e) => setDigits1(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 digit</span>
                  <span>4 digits</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Second number digits: {digits2}
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={digits2}
                  onChange={(e) => setDigits2(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 digit</span>
                  <span>4 digits</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Preview: {generateNumber(digits1)} {selectedOperator} {generateNumber(digits2)} = ?
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setGameState('operator')}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={() => setGameState('playing')}
                className="btn-primary flex-1"
              >
                Start Practicing!
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && currentProblem && (
          <div className="card text-center">
            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-2">
                Problem {results.length + 1} • {correctCount}/{totalCount} correct
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-6">
                {currentProblem.num1} {currentProblem.operator} {currentProblem.num2} = ?
              </div>
            </div>

            {!showFeedback ? (
              <div className="space-y-4">
                <input
                  ref={inputRef}
                  type="number"
                  placeholder="Your answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="input-field text-center text-xl"
                  onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
                  autoFocus
                />
                <div className="flex gap-4">
                  <button
                    onClick={finishSession}
                    className="btn-secondary flex-1"
                  >
                    Finish Session
                  </button>
                  <button
                    onClick={submitAnswer}
                    disabled={userAnswer === ''}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${lastResult?.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className={`text-lg font-bold ${lastResult?.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {lastResult?.isCorrect ? '🎉 Correct!' : '❌ Incorrect'}
                  </div>
                  {!lastResult?.isCorrect && (
                    <div className="text-sm text-gray-600 mt-2">
                      The correct answer was {lastResult?.correctAnswer}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 text-center mb-2">
                  Press <kbd className="px-2 py-1 bg-gray-200 rounded">Enter</kbd> for next problem
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={finishSession}
                    className="btn-secondary flex-1"
                  >
                    Finish Session
                  </button>
                  <button
                    onClick={nextProblem}
                    className="btn-primary flex-1"
                  >
                    Next Problem
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {gameState === 'results' && (
          <div className="card text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Great job, {userName}! 🎉</h2>
            <p className="text-gray-600 mb-4">Here are your results:</p>
            
            {showNewRecord && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                <div className="text-yellow-700 font-bold flex items-center justify-center gap-2">
                  🏆 New High Score! You made it to the top 3!
                </div>
              </div>
            )}
            
            <div className="bg-primary-50 p-6 rounded-lg mb-6">
              <div className="text-3xl font-bold text-primary-600 mb-2">{percentage}%</div>
              <div className="text-lg text-gray-700">{correctCount} out of {totalCount} correct</div>
            </div>

            {results.length > 0 && (
              <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-3 rounded text-sm ${
                      result.isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <span>{result.problem} = {result.userAnswer}</span>
                    <span>{result.isCorrect ? '✓' : `✗ (${result.correctAnswer})`}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setGameState('leaderboard')}
                className="btn-secondary flex-1"
              >
                View Leaderboard
              </button>
              <button
                onClick={playAgain}
                className="btn-primary flex-1"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {gameState === 'leaderboard' && (
          <div>
            <MathModeLeaderboard operator={selectedOperator} />
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => router.push('/')}
                className="btn-secondary flex-1"
              >
                Back to Home
              </button>
              <button
                onClick={playAgain}
                className="btn-primary flex-1"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

