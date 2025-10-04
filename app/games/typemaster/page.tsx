'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'

type GameMode = 'menu' | 'tutorial' | 'practice' | 'challenge' | 'select-list'
type Lesson = 'home-row' | 'top-row' | 'bottom-row' | 'numbers' | 'all-keys'

interface LessonConfig {
  id: Lesson
  name: string
  description: string
  keys: string[]
  instruction: string
  practiceText: string[]
}

interface SpellingList {
  id: string
  name: string
  words: string[]
}

const LESSONS: LessonConfig[] = [
  {
    id: 'home-row',
    name: 'Home Row',
    description: 'Master the foundation: ASDF JKL;',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
    instruction: 'Place your left fingers on A, S, D, F and right fingers on J, K, L, ;. Your index fingers should feel small bumps on F and J.',
    practiceText: ['asdf', 'jkl;', 'fjfj', 'dkdk', 'slsl', 'add', 'sad', 'all', 'fall', 'flask', 'class', 'salad', 'las', 'lass', 'lads', 'fads', 'dads', 'lass', 'jakk', 'asks', 'sass', 'fajk', 'jaks', 'fall', 'alls', 'alfalfa', 'salsa', 'llamas', 'alaska', 'dallas', 'lassad']
  },
  {
    id: 'top-row',
    name: 'Top Row',
    description: 'Add Q W E R T Y U I O P',
    keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    instruction: 'Reach up from home row. Keep your thumbs on the space bar.',
    practiceText: ['qwer', 'tyui', 'pop', 'quote', 'type', 'port', 'your', 'tire', 'rope', 'quite', 'query', 'power', 'tower', 'pity', 'poet', 'proper', 'troop', 'pretty', 'puppet', 'poetry', 'pepper', 'upper', 'paper', 'report', 'support', 'airport', 'opportunity', 'typewriter', 'property']
  },
  {
    id: 'bottom-row',
    name: 'Bottom Row',
    description: 'Add Z X C V B N M',
    keys: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    instruction: 'Reach down from home row. Return fingers to home position after each key.',
    practiceText: ['zxcv', 'bnm', 'buzz', 'mix', 'can', 'van', 'man', 'zoom', 'exam', 'civic', 'maximum', 'banana', 'common', 'vacant', 'maze', 'maze', 'venom', 'cabin', 'command', 'examine', 'vitamin', 'bamboo', 'magazine', 'november', 'zebra', 'complex', 'maximize']
  },
  {
    id: 'numbers',
    name: 'Numbers',
    description: 'Master the number row',
    keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    instruction: 'Reach up from home row to hit numbers. Return to home position.',
    practiceText: ['123', '456', '789', '101', '2024', '365', '100', '50', '75', '1000', '2500', '3600', '4800', '5200', '6700', '7500', '8900', '9100', '10000', '12345', '67890', '24680', '13579']
  },
  {
    id: 'all-keys',
    name: 'All Keys',
    description: 'Practice everything together',
    keys: [],
    instruction: 'Type full sentences using all the keys you\'ve learned.',
    practiceText: [
      'the quick brown fox jumps over the lazy dog',
      'pack my box with five dozen liquor jugs',
      'how vexingly quick daft zebras jump',
      'the five boxing wizards jump quickly',
      'sphinx of black quartz judge my vow',
      'two driven jocks help fax my big quiz',
      'five quacking zephyrs jolt my wax bed',
      'the jay pig fox zebra and my wolves quack',
      'crazy frederick bought many very exquisite opal jewels',
      'we promptly judged antique ivory buckles for the next prize'
    ]
  }
]

const FINGER_MAP: Record<string, { finger: string; hand: 'left' | 'right'; color: string }> = {
  // Left hand
  'q': { finger: 'Pinky', hand: 'left', color: 'bg-pink-200' },
  'a': { finger: 'Pinky', hand: 'left', color: 'bg-pink-200' },
  'z': { finger: 'Pinky', hand: 'left', color: 'bg-pink-200' },
  '1': { finger: 'Pinky', hand: 'left', color: 'bg-pink-200' },
  
  'w': { finger: 'Ring', hand: 'left', color: 'bg-purple-200' },
  's': { finger: 'Ring', hand: 'left', color: 'bg-purple-200' },
  'x': { finger: 'Ring', hand: 'left', color: 'bg-purple-200' },
  '2': { finger: 'Ring', hand: 'left', color: 'bg-purple-200' },
  
  'e': { finger: 'Middle', hand: 'left', color: 'bg-blue-200' },
  'd': { finger: 'Middle', hand: 'left', color: 'bg-blue-200' },
  'c': { finger: 'Middle', hand: 'left', color: 'bg-blue-200' },
  '3': { finger: 'Middle', hand: 'left', color: 'bg-blue-200' },
  
  'r': { finger: 'Index', hand: 'left', color: 'bg-green-200' },
  'f': { finger: 'Index', hand: 'left', color: 'bg-green-200' },
  'v': { finger: 'Index', hand: 'left', color: 'bg-green-200' },
  't': { finger: 'Index', hand: 'left', color: 'bg-green-200' },
  'g': { finger: 'Index', hand: 'left', color: 'bg-green-200' },
  'b': { finger: 'Index', hand: 'left', color: 'bg-green-200' },
  '4': { finger: 'Index', hand: 'left', color: 'bg-green-200' },
  '5': { finger: 'Index', hand: 'left', color: 'bg-green-200' },
  
  // Right hand
  'y': { finger: 'Index', hand: 'right', color: 'bg-green-200' },
  'h': { finger: 'Index', hand: 'right', color: 'bg-green-200' },
  'n': { finger: 'Index', hand: 'right', color: 'bg-green-200' },
  'u': { finger: 'Index', hand: 'right', color: 'bg-green-200' },
  'j': { finger: 'Index', hand: 'right', color: 'bg-green-200' },
  'm': { finger: 'Index', hand: 'right', color: 'bg-green-200' },
  '6': { finger: 'Index', hand: 'right', color: 'bg-green-200' },
  '7': { finger: 'Index', hand: 'right', color: 'bg-green-200' },
  
  'i': { finger: 'Middle', hand: 'right', color: 'bg-blue-200' },
  'k': { finger: 'Middle', hand: 'right', color: 'bg-blue-200' },
  ',': { finger: 'Middle', hand: 'right', color: 'bg-blue-200' },
  '8': { finger: 'Middle', hand: 'right', color: 'bg-blue-200' },
  
  'o': { finger: 'Ring', hand: 'right', color: 'bg-purple-200' },
  'l': { finger: 'Ring', hand: 'right', color: 'bg-purple-200' },
  '.': { finger: 'Ring', hand: 'right', color: 'bg-purple-200' },
  '9': { finger: 'Ring', hand: 'right', color: 'bg-purple-200' },
  
  'p': { finger: 'Pinky', hand: 'right', color: 'bg-pink-200' },
  ';': { finger: 'Pinky', hand: 'right', color: 'bg-pink-200' },
  "'": { finger: 'Pinky', hand: 'right', color: 'bg-pink-200' },
  '/': { finger: 'Pinky', hand: 'right', color: 'bg-pink-200' },
  '0': { finger: 'Pinky', hand: 'right', color: 'bg-pink-200' },
  
  ' ': { finger: 'Thumb', hand: 'left', color: 'bg-gray-200' }
}

export default function TypeMasterPage() {
  const router = useRouter()
  const { ready, authenticated, user } = usePrivy()
  
  const [gameMode, setGameMode] = useState<GameMode>('menu')
  const [currentLesson, setCurrentLesson] = useState<LessonConfig>(LESSONS[0])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [mistakes, setMistakes] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [totalKeysPressed, setTotalKeysPressed] = useState(0)
  const [correctKeys, setCorrectKeys] = useState(0)
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null)
  const [spellingLists, setSpellingLists] = useState<SpellingList[]>([])
  const [selectedList, setSelectedList] = useState<SpellingList | null>(null)
  const [speakWords, setSpeakWords] = useState(false)
  const [showWord, setShowWord] = useState(true) // Show word by default unless TTS is enabled

  const inputRef = useRef<HTMLInputElement>(null)
  const speechSynthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/')
    }
  }, [ready, authenticated, router])

  // Load spelling lists
  useEffect(() => {
    fetchSpellingLists()
    if (typeof window !== 'undefined') {
      speechSynthRef.current = window.speechSynthesis
    }
  }, [])

  const fetchSpellingLists = async () => {
    try {
      const response = await fetch('/api/spelling-lists')
      if (response.ok) {
        const data = await response.json()
        setSpellingLists(data.lists || [])
      }
    } catch (error) {
      console.error('Error fetching spelling lists:', error)
    }
  }

  const currentWord = currentLesson.practiceText[currentWordIndex]

  const speakWord = useCallback((word: string) => {
    if (speechSynthRef.current && speakWords) {
      speechSynthRef.current.cancel() // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.rate = 0.8 // Slightly slower for clarity
      utterance.pitch = 1
      utterance.volume = 1
      speechSynthRef.current.speak(utterance)
    }
  }, [speakWords])

  useEffect(() => {
    if (gameMode === 'practice' || gameMode === 'challenge') {
      inputRef.current?.focus()
      // Speak the current word if speech is enabled
      if (currentWord && speakWords) {
        speakWord(currentWord)
      }
      // Update show word state based on TTS setting
      setShowWord(!speakWords)
    }
  }, [gameMode, currentWordIndex, currentWord, speakWords, speakWord])

  // Handle TTS toggle during lesson
  useEffect(() => {
    if (gameMode === 'practice' || gameMode === 'challenge') {
      setShowWord(!speakWords)
    }
  }, [speakWords, gameMode])

  const calculateWPM = useCallback(() => {
    if (!startTime) return 0
    const timeElapsed = (Date.now() - startTime) / 1000 / 60 // minutes
    const wordsTyped = currentWordIndex + (userInput.length / 5) // standard: 5 chars = 1 word
    return Math.round(wordsTyped / timeElapsed) || 0
  }, [startTime, currentWordIndex, userInput])

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!startTime) {
      setStartTime(Date.now())
    }

    const typedChar = e.key
    const expectedChar = currentWord[userInput.length]

    if (typedChar === expectedChar) {
      setCorrectKeys(prev => prev + 1)
    } else if (typedChar.length === 1) {
      setMistakes(prev => prev + 1)
    }

    if (typedChar.length === 1) {
      setTotalKeysPressed(prev => prev + 1)
    }

    // Update metrics
    const newWpm = calculateWPM()
    setWpm(newWpm)
    
    if (totalKeysPressed > 0) {
      setAccuracy(Math.round((correctKeys / totalKeysPressed) * 100))
    }

    // Show which key to press next
    if (userInput.length + 1 < currentWord.length) {
      setHighlightedKey(currentWord[userInput.length + 1])
    } else {
      setHighlightedKey(null)
    }
  }, [currentWord, userInput, startTime, calculateWPM, totalKeysPressed, correctKeys])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUserInput(value)

    // Check if current word is complete
    if (value === currentWord) {
      // Auto-advance after a brief pause
      setTimeout(() => {
        if (currentWordIndex < currentLesson.practiceText.length - 1) {
          setCurrentWordIndex(prev => prev + 1)
          setUserInput('')
          setHighlightedKey(currentLesson.practiceText[currentWordIndex + 1][0])
        } else {
          // Lesson complete
          finishSession()
        }
      }, 500)
      return
    }

    // Also allow space to advance
    if (value === currentWord + ' ') {
      if (currentWordIndex < currentLesson.practiceText.length - 1) {
        setCurrentWordIndex(prev => prev + 1)
        setUserInput('')
        setHighlightedKey(currentLesson.practiceText[currentWordIndex + 1][0])
      }
      return
    }

    // Highlight next key
    if (value.length < currentWord.length) {
      setHighlightedKey(currentWord[value.length])
    } else {
      setHighlightedKey(null)
    }
  }

  const finishSession = async () => {
    const finalWpm = calculateWPM()
    const finalAccuracy = totalKeysPressed > 0 ? Math.round((correctKeys / totalKeysPressed) * 100) : 0
    const durationSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0

    console.log('🎯 TypeMaster session completed!', {
      lesson: currentLesson.id,
      wpm: finalWpm,
      accuracy: finalAccuracy,
      mistakes,
      duration: durationSeconds
    })

    // Save to database
    if (user?.id) {
      try {
        console.log('📤 Submitting session to database...')
        const response = await fetch('/api/typemaster/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        body: JSON.stringify({
          userId: user.id,
          lessonId: selectedList ? `custom-${selectedList.id}` : currentLesson.id,
          wpm: finalWpm,
          accuracy: finalAccuracy,
          totalKeys: totalKeysPressed,
          correctKeys: correctKeys,
          mistakes: mistakes,
          durationSeconds: durationSeconds,
          wordsCompleted: currentLesson.practiceText.length,
          customListName: selectedList?.name || undefined
        }),
          cache: 'no-store',
        })

        if (response.ok) {
          const data = await response.json()
          console.log('✅ Session saved successfully!', data)
        } else {
          console.error('❌ Failed to save session:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('❌ Error submitting TypeMaster session:', error)
      }
    } else {
      console.warn('⚠️ No user ID - session not saved')
    }

    // Show results screen instead of immediately resetting
    setGameMode('results')
  }


  const resetGame = () => {
    setUserInput('')
    setCurrentWordIndex(0)
    setMistakes(0)
    setStartTime(null)
    setWpm(0)
    setAccuracy(100)
    setTotalKeysPressed(0)
    setCorrectKeys(0)
    setHighlightedKey(null)
    setShowWord(!speakWords) // Reset based on current TTS setting
  }

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const startLesson = (lesson: LessonConfig, customWords?: string[]) => {
    // Use custom words if provided, otherwise use lesson's default words
    const words = customWords || lesson.practiceText
    
    // Shuffle practice words for variety
    const shuffledLesson = {
      ...lesson,
      practiceText: shuffleArray(words)
    }
    setCurrentLesson(shuffledLesson)
    setGameMode('practice')
    resetGame()
    setHighlightedKey(shuffledLesson.practiceText[0][0])
  }

  const handleSelectCustomList = (list: SpellingList) => {
    setSelectedList(list)
    // Use the "all-keys" lesson as the base
    const allKeysLesson = LESSONS.find(l => l.id === 'all-keys')!
    startLesson(allKeysLesson, list.words)
  }

  const showCustomListSelector = () => {
    setGameMode('select-list')
  }

  if (!ready || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/')}
            className="btn-secondary"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900">⌨️ TypeMaster</h1>
          <div className="w-32"></div> {/* Spacer */}
        </div>

        {/* Menu */}
        {gameMode === 'menu' && (
          <div className="space-y-8">
            <div className="card text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Learn to Type Like a Pro! 🚀
              </h2>
              <p className="text-gray-600 mb-6">
                Master touch typing with proper finger placement. Start with the basics and work your way up!
              </p>
              {spellingLists.length > 0 && (
                <button
                  onClick={showCustomListSelector}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  📚 Practice Custom Word Lists ({spellingLists.length})
                </button>
              )}
            </div>

            {/* Lessons */}
            <div className="grid md:grid-cols-2 gap-4">
              {LESSONS.map((lesson) => (
                <div
                  key={lesson.id}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => startLesson(lesson)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{lesson.name}</h3>
                    <span className="text-2xl">📝</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{lesson.description}</p>
                  {lesson.keys.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {lesson.keys.map(key => (
                        <span
                          key={key}
                          className={`px-3 py-1 rounded font-mono font-bold ${FINGER_MAP[key]?.color || 'bg-gray-200'}`}
                        >
                          {key}
                        </span>
                      ))}
                    </div>
                  )}
                  <button className="btn-primary w-full mt-4">
                    Start Lesson
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom List Selector */}
        {gameMode === 'select-list' && (
          <div className="space-y-8">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📚 Select a Word List
              </h2>
              <p className="text-gray-600 mb-6">
                Choose a custom word list to practice. Perfect for spelling bees, vocabulary, or any word list!
              </p>
              
              {/* Text-to-Speech Toggle */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={speakWords}
                    onChange={(e) => setSpeakWords(e.target.checked)}
                    className="w-5 h-5 text-primary-600"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">🔊 Enable Text-to-Speech</div>
                    <div className="text-sm text-gray-600">Computer will speak each word before you type it</div>
                  </div>
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {spellingLists.map((list) => (
                  <div
                    key={list.id}
                    onClick={() => handleSelectCustomList(list)}
                    className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-500"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{list.name}</h3>
                      <span className="text-2xl">📝</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {list.words.length} words
                    </p>
                    <button className="btn-primary w-full mt-4">
                      Start Practice
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setGameMode('menu')}
                className="btn-secondary"
              >
                ← Back to Lessons
              </button>
            </div>
          </div>
        )}

        {/* Results Screen */}
        {gameMode === 'results' && (
          <div className="card text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              🎉 Session Complete!
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Final WPM</div>
                <div className="text-3xl font-bold text-blue-700">
                  {Math.round(calculateWPM())}
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Accuracy</div>
                <div className="text-3xl font-bold text-green-700">
                  {totalKeysPressed > 0 ? Math.round((correctKeys / totalKeysPressed) * 100) : 0}%
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Words</div>
                <div className="text-3xl font-bold text-purple-700">
                  {currentLesson.practiceText.length}
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">Mistakes</div>
                <div className="text-3xl font-bold text-orange-700">
                  {mistakes}
                </div>
              </div>
            </div>

            <div className="text-gray-600 mb-8">
              {selectedList ? (
                <p>Great job on <strong>{selectedList.name}</strong>!</p>
              ) : (
                <p>Great job on <strong>{currentLesson.name}</strong>!</p>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setGameMode('menu')
                  resetGame()
                }}
                className="btn-primary"
              >
                📋 Back to Menu
              </button>
            </div>
          </div>
        )}

        {/* Practice Mode */}
        {(gameMode === 'practice' || gameMode === 'challenge') && (
          <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4">
              <div className="card text-center bg-gradient-to-br from-blue-100 to-blue-50">
                <div className="text-sm text-blue-700 font-medium">WPM</div>
                <div className="text-3xl font-bold text-blue-900">{wpm}</div>
              </div>
              <div className="card text-center bg-gradient-to-br from-green-100 to-green-50">
                <div className="text-sm text-green-700 font-medium">Accuracy</div>
                <div className="text-3xl font-bold text-green-900">{accuracy}%</div>
              </div>
              <div className="card text-center bg-gradient-to-br from-purple-100 to-purple-50">
                <div className="text-sm text-purple-700 font-medium">Progress</div>
                <div className="text-3xl font-bold text-purple-900">
                  {currentWordIndex + 1}/{currentLesson.practiceText.length}
                </div>
              </div>
              <div className="card text-center bg-gradient-to-br from-red-100 to-red-50">
                <div className="text-sm text-red-700 font-medium">Mistakes</div>
                <div className="text-3xl font-bold text-red-900">{mistakes}</div>
              </div>
            </div>

            {/* Instruction */}
            <div className="card bg-gradient-to-r from-primary-50 to-purple-50">
              <p className="text-gray-700 text-center">
                <strong>Tip:</strong> {currentLesson.instruction}
              </p>
            </div>

            {/* Typing Area */}
            <div className="card">
              <div className="mb-6 text-center">
                {/* Word Display Area */}
                <div className="min-h-[60px] flex items-center justify-center mb-4">
                  {speakWords && !showWord ? (
                    <div className="text-2xl text-gray-400 italic">
                      🔊 Listen and type the word...
                    </div>
                  ) : (
                    <div className="text-4xl font-mono font-bold">
                      {currentWord.split('').map((char, i) => (
                        <span
                          key={i}
                          className={
                            i < userInput.length
                              ? userInput[i] === char
                                ? 'text-green-600'
                                : 'text-red-600 bg-red-100'
                              : i === userInput.length
                                ? 'text-blue-600 underline'
                                : 'text-gray-400'
                          }
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {userInput === currentWord && (
                  <div className="text-green-600 text-xl font-bold mb-2 animate-pulse">
                    ✓ Perfect! Next word coming...
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  className="input-field text-center text-2xl font-mono w-full max-w-md"
                  placeholder="Start typing..."
                  autoFocus
                />

                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="text-sm text-gray-500">
                    {speakWords && !showWord
                      ? "Listen carefully and type the word you hear! 🎧"
                      : "Type each word exactly as shown. It will auto-advance when correct! ✨"
                    }
                  </div>
                  {speakWords && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => speakWord(currentWord)}
                        className="btn-secondary text-sm inline-flex items-center gap-1"
                      >
                        🔊 Repeat Word
                      </button>
                      <button
                        onClick={() => setShowWord(!showWord)}
                        className="btn-secondary text-sm inline-flex items-center gap-1"
                      >
                        {showWord ? '🙈 Hide Word' : '👁️ Show Word'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Keyboard */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-700 text-center mb-4">
                  Keyboard Guide - {highlightedKey && FINGER_MAP[highlightedKey] ? 
                    `Use ${FINGER_MAP[highlightedKey].hand} ${FINGER_MAP[highlightedKey].finger}` : 
                    'Ready'}
                </h3>
                <div className="space-y-2 font-mono">
                  {/* Number row */}
                  <div className="flex justify-center gap-1">
                    {['1','2','3','4','5','6','7','8','9','0'].map(key => (
                      <div
                        key={key}
                        className={`w-10 h-10 flex items-center justify-center border-2 rounded font-bold text-sm
                          ${highlightedKey === key ? 'border-blue-500 bg-blue-100 scale-110' : 'border-gray-300'}
                          ${FINGER_MAP[key]?.color || 'bg-white'}`}
                      >
                        {key}
                      </div>
                    ))}
                  </div>
                  
                  {/* Top row */}
                  <div className="flex justify-center gap-1">
                    {['q','w','e','r','t','y','u','i','o','p'].map(key => (
                      <div
                        key={key}
                        className={`w-10 h-10 flex items-center justify-center border-2 rounded font-bold
                          ${highlightedKey === key ? 'border-blue-500 bg-blue-100 scale-110' : 'border-gray-300'}
                          ${FINGER_MAP[key]?.color || 'bg-white'}`}
                      >
                        {key.toUpperCase()}
                      </div>
                    ))}
                  </div>
                  
                  {/* Home row */}
                  <div className="flex justify-center gap-1">
                    {['a','s','d','f','g','h','j','k','l',';'].map(key => (
                      <div
                        key={key}
                        className={`w-10 h-10 flex items-center justify-center border-2 rounded font-bold
                          ${highlightedKey === key ? 'border-blue-500 bg-blue-100 scale-110' : 'border-gray-300'}
                          ${FINGER_MAP[key]?.color || 'bg-white'}
                          ${key === 'f' || key === 'j' ? 'border-b-4 border-b-gray-500' : ''}`}
                      >
                        {key.toUpperCase()}
                      </div>
                    ))}
                  </div>
                  
                  {/* Bottom row */}
                  <div className="flex justify-center gap-1">
                    {['z','x','c','v','b','n','m',',','.','/'].map(key => (
                      <div
                        key={key}
                        className={`w-10 h-10 flex items-center justify-center border-2 rounded font-bold text-sm
                          ${highlightedKey === key ? 'border-blue-500 bg-blue-100 scale-110' : 'border-gray-300'}
                          ${FINGER_MAP[key]?.color || 'bg-white'}`}
                      >
                        {key.toUpperCase()}
                      </div>
                    ))}
                  </div>
                  
                  {/* Space bar */}
                  <div className="flex justify-center">
                    <div className={`w-96 h-10 flex items-center justify-center border-2 rounded font-bold
                      ${highlightedKey === ' ' ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}
                      ${FINGER_MAP[' ']?.color || 'bg-white'}`}>
                      SPACE
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setGameMode('menu')
                    resetGame()
                  }}
                  className="btn-secondary"
                >
                  Exit Lesson
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

