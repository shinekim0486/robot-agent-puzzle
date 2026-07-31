import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  RotateCcw, 
  UploadCloud, 
  Eye, 
  Trophy, 
  Timer, 
  Activity, 
  Grid, 
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Compass,
  AlertTriangle,
  HelpCircle,
  Award
} from 'lucide-react'
import robotImg from './assets/robot.jpg'
import originalImg from './assets/original.jpg'
import modifiedImg from './assets/modified.jpg'
import './App.css'

function App() {
  // Game Mode State ('sliding' | 'spot')
  const [gameMode, setGameMode] = useState('spot')

  // --- Sliding Puzzle States ---
  const [gridSize, setGridSize] = useState(3)
  const [slidingImgUrl, setSlidingImgUrl] = useState(robotImg)
  const [tiles, setTiles] = useState([])
  const [slidingMoves, setSlidingMoves] = useState(0)
  const [slidingSeconds, setSlidingSeconds] = useState(0)
  const [slidingActive, setSlidingActive] = useState(false)
  const [slidingWon, setSlidingWon] = useState(false)
  const [showSlidingHint, setShowSlidingHint] = useState(false)

  // --- Spot the Difference States ---
  const [spotDiffs, setSpotDiffs] = useState([
    { id: 1, name: '분홍색 꽃', x: 12.5, y: 49, radius: 9.5, found: false },
    { id: 2, name: '머리띠 파란 나뭇잎', x: 55, y: 16, radius: 6, found: false },
    { id: 3, name: '초록색 개구리', x: 95.5, y: 43.5, radius: 6.5, found: false },
    { id: 4, name: '보라색 선글라스', x: 54, y: 76.5, radius: 18, found: false },
    { id: 5, name: '노란색 별 장난감', x: 38, y: 72, radius: 8, found: false }
  ])
  const [spotDifficulty, setSpotDifficulty] = useState('normal') // 'easy' (3 diffs) | 'normal' (5 diffs) | 'hard' (5 diffs, less time)
  const [timeLimit, setTimeLimit] = useState(60) // 30, 60, 90 seconds
  const [spotTimeLeft, setSpotTimeLeft] = useState(60)
  const [spotWrongClicksCount, setSpotWrongClicksCount] = useState(0)
  const [spotWrongMarks, setSpotWrongMarks] = useState([]) // array of { id, x, y }
  const [spotActive, setSpotActive] = useState(false)
  const [spotWon, setSpotWon] = useState(false)
  const [spotLost, setSpotLost] = useState(false)
  const [hintsLeft, setHintsLeft] = useState(3)
  const [hintHighlight, setHintHighlight] = useState(null) // index of difference being hinted
  const [shakeBoard, setShakeBoard] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [spotSecondsElapsed, setSpotSecondsElapsed] = useState(0)

  // Timer Refs
  const slidingTimerRef = useRef(null)
  const spotTimerRef = useRef(null)

  // --- Sliding Puzzle Logic ---
  const initSlidingPuzzle = useCallback((size = gridSize) => {
    const totalTiles = size * size
    const newTiles = Array.from({ length: totalTiles }, (_, i) => i)
    let emptyIndex = totalTiles - 1
    const shuffleSteps = size * size * 40
    
    for (let i = 0; i < shuffleSteps; i++) {
      const validMoves = []
      const emptyRow = Math.floor(emptyIndex / size)
      const emptyCol = emptyIndex % size

      if (emptyCol > 0) validMoves.push(emptyIndex - 1)
      if (emptyCol < size - 1) validMoves.push(emptyIndex + 1)
      if (emptyRow > 0) validMoves.push(emptyIndex - size)
      if (emptyRow < size - 1) validMoves.push(emptyIndex + size)

      const randomNeighbor = validMoves[Math.floor(Math.random() * validMoves.length)]
      newTiles[emptyIndex] = newTiles[randomNeighbor]
      newTiles[randomNeighbor] = totalTiles - 1
      emptyIndex = randomNeighbor
    }

    setTiles(newTiles)
    setSlidingMoves(0)
    setSlidingSeconds(0)
    setSlidingActive(false)
    setSlidingWon(false)
  }, [gridSize])

  useEffect(() => {
    if (gameMode === 'sliding') {
      initSlidingPuzzle(gridSize)
    }
  }, [gridSize, initSlidingPuzzle, gameMode])

  useEffect(() => {
    if (slidingActive && !slidingWon && gameMode === 'sliding') {
      slidingTimerRef.current = setInterval(() => {
        setSlidingSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      clearInterval(slidingTimerRef.current)
    }
    return () => clearInterval(slidingTimerRef.current)
  }, [slidingActive, slidingWon, gameMode])

  const handleSlidingTileClick = (index) => {
    if (slidingWon) return
    const size = gridSize
    const totalTiles = size * size
    const emptyIndex = tiles.indexOf(totalTiles - 1)

    const clickRow = Math.floor(index / size)
    const clickCol = index % size
    const emptyRow = Math.floor(emptyIndex / size)
    const emptyCol = emptyIndex % size

    const isAdjacent = Math.abs(clickRow - emptyRow) + Math.abs(clickCol - emptyCol) === 1

    if (isAdjacent) {
      if (slidingMoves === 0) {
        setSlidingActive(true)
      }
      const newTiles = [...tiles]
      newTiles[emptyIndex] = tiles[index]
      newTiles[index] = totalTiles - 1
      setTiles(newTiles)
      setSlidingMoves((prev) => prev + 1)

      const hasWon = newTiles.every((val, idx) => val === idx)
      if (hasWon) {
        setSlidingWon(true)
        setSlidingActive(false)
      }
    }
  }

  const onSlidingImageDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles[0]) {
      const objectUrl = URL.createObjectURL(acceptedFiles[0])
      setSlidingImgUrl(objectUrl)
      initSlidingPuzzle(gridSize)
    }
  }, [gridSize, initSlidingPuzzle])

  const { getRootProps: getSlidingRootProps, getInputProps: getSlidingInputProps, isDragActive: isSlidingDragActive } = useDropzone({
    onDrop: onSlidingImageDrop,
    accept: { 'image/*': [] },
    multiple: false
  })

  // --- Spot the Difference Logic ---
  const initSpotGame = useCallback(() => {
    // 5 diffs
    const baseDiffs = [
      { id: 1, name: '분홍색 꽃', x: 12.5, y: 49, radius: 9.5, found: false },
      { id: 2, name: '머리띠 파란 나뭇잎', x: 55, y: 16, radius: 6, found: false },
      { id: 3, name: '초록색 개구리', x: 95.5, y: 43.5, radius: 6.5, found: false },
      { id: 4, name: '보라색 선글라스', x: 54, y: 76.5, radius: 18, found: false },
      { id: 5, name: '노란색 별 장난감', x: 38, y: 72, radius: 8, found: false }
    ]

    // If 'easy', we randomly disable 2 diffs (keep 3)
    if (spotDifficulty === 'easy') {
      const indicesToKeep = []
      while (indicesToKeep.length < 3) {
        const randIdx = Math.floor(Math.random() * 5)
        if (!indicesToKeep.includes(randIdx)) {
          indicesToKeep.push(randIdx)
        }
      }
      setSpotDiffs(baseDiffs.filter((_, idx) => indicesToKeep.includes(idx)))
    } else {
      setSpotDiffs(baseDiffs)
    }

    setSpotTimeLeft(timeLimit)
    setSpotWrongClicksCount(0)
    setSpotWrongMarks([])
    setSpotActive(false)
    setSpotWon(false)
    setSpotLost(false)
    setHintsLeft(3)
    setHintHighlight(null)
    setShakeBoard(false)
    setShowAnswer(false)
    setSpotSecondsElapsed(0)
  }, [spotDifficulty, timeLimit])

  // Setup/Reset game on difficulty or timeLimit change
  useEffect(() => {
    if (gameMode === 'spot') {
      initSpotGame()
    }
  }, [spotDifficulty, timeLimit, initSpotGame, gameMode])

  // Spot Difference Timer Effect
  useEffect(() => {
    if (spotActive && !spotWon && !spotLost && gameMode === 'spot') {
      spotTimerRef.current = setInterval(() => {
        setSpotTimeLeft((prev) => {
          if (prev <= 1) {
            setSpotLost(true)
            setSpotActive(false)
            setShowAnswer(true)
            return 0
          }
          return prev - 1
        })
        setSpotSecondsElapsed((prev) => prev + 1)
      }, 1000)
    } else {
      clearInterval(spotTimerRef.current)
    }
    return () => clearInterval(spotTimerRef.current)
  }, [spotActive, spotWon, spotLost, gameMode])

  // Handle click on either Original or Modified Image
  const handleSpotImageClick = (e) => {
    if (spotWon || spotLost) return
    
    // Start game on first click
    if (!spotActive) {
      setSpotActive(true)
    }

    const rect = e.currentTarget.getBoundingClientRect()
    // Calculate click coordinates in percentage relative to the image size
    const clickX = ((e.clientX - rect.left) / rect.width) * 100
    const clickY = ((e.clientY - rect.top) / rect.height) * 100

    let foundAny = false
    const updatedDiffs = spotDiffs.map((diff) => {
      const dist = Math.sqrt(Math.pow(clickX - diff.x, 2) + Math.pow(clickY - diff.y, 2))
      if (dist <= diff.radius && !diff.found) {
        foundAny = true
        return { ...diff, found: true }
      }
      return diff
    })

    if (foundAny) {
      setSpotDiffs(updatedDiffs)
      // Check win condition
      const allFound = updatedDiffs.every((diff) => diff.found)
      if (allFound) {
        setSpotWon(true)
        setSpotActive(false)
      }
    } else {
      // Wrong click
      setSpotWrongClicksCount((prev) => prev + 1)
      setShakeBoard(true)
      setTimeout(() => setShakeBoard(false), 250)

      // Add a temporary X mark
      const newMark = { id: Date.now(), x: clickX, y: clickY }
      setSpotWrongMarks((prev) => [...prev, newMark])
      // Remove mark after 1 second
      setTimeout(() => {
        setSpotWrongMarks((prev) => prev.filter((m) => m.id !== newMark.id))
      }, 1000)
    }
  }

  // Use 1 hint
  const triggerHint = () => {
    if (hintsLeft <= 0 || spotWon || spotLost) return
    if (!spotActive) setSpotActive(true)

    // Find first unfound difference
    const unfoundIdx = spotDiffs.findIndex((diff) => !diff.found)
    if (unfoundIdx !== -1) {
      setHintsLeft((prev) => prev - 1)
      setHintHighlight(unfoundIdx)
      setTimeout(() => {
        setHintHighlight(null)
      }, 2000)
    }
  }

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60)
    const remainingSecs = secs % 60
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`
  }

  const getRequiredDiffsCount = () => {
    return spotDifficulty === 'easy' ? 3 : 5
  }

  const getFoundDiffsCount = () => {
    return spotDiffs.filter((d) => d.found).length
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-4 md:p-8 font-sans selection:bg-teal-500 selection:text-slate-900">
      
      {/* Header & Mode Switcher */}
      <header className="w-full max-w-5xl text-center my-4 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-semibold tracking-wider uppercase mb-1 animate-pulse">
          <Sparkles className="w-4 h-4" /> Multi-Game Hub
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500 bg-clip-text text-transparent">
          나만의 로봇 & 캐릭터 게임 월드
        </h1>
        
        {/* Navigation Tabs */}
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-lg mt-4">
          <button
            onClick={() => setGameMode('spot')}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 flex items-center gap-2 ${
              gameMode === 'spot'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" /> 틀린그림찾기
          </button>
          <button
            onClick={() => setGameMode('sliding')}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 flex items-center gap-2 ${
              gameMode === 'sliding'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4" /> 슬라이딩 퍼즐
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-7xl my-auto">
        
        {/* ================= SPOT THE DIFFERENCE GAME ================= */}
        {gameMode === 'spot' && (
          <div className="space-y-6">
            
            {/* Spot Dashboard Panel */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              
              {/* Diff Controls Panel */}
              <div className="md:col-span-4 bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl space-y-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 text-teal-400 mb-3">
                    <Award className="w-5 h-5" /> 난이도 & 시간 설정
                  </h2>
                  
                  {/* Difficulty Button group */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 block font-semibold">난이도</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'easy', label: '쉬움 (3개)' },
                        { key: 'normal', label: '보통 (5개)' },
                        { key: 'hard', label: '어려움 (5개)' }
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => setSpotDifficulty(item.key)}
                          className={`py-2 px-1 text-xs rounded-lg font-bold transition-all ${
                            spotDifficulty === item.key
                              ? 'bg-teal-500 text-slate-950'
                              : 'bg-slate-800 hover:bg-slate-700/80 text-slate-300'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timer selection */}
                  <div className="space-y-2 mt-4">
                    <label className="text-xs text-slate-400 block font-semibold">제한 시간</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[30, 60, 90].map((secs) => (
                        <button
                          key={secs}
                          onClick={() => setTimeLimit(secs)}
                          className={`py-2 rounded-lg text-xs font-bold transition-all ${
                            timeLimit === secs
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-800 hover:bg-slate-700/80 text-slate-300'
                          }`}
                        >
                          {secs}초
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Score Summary */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">찾은 개수:</span>
                    <span className="font-bold text-teal-400">{getFoundDiffsCount()} / {getRequiredDiffsCount()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">남은 힌트:</span>
                    <span className="font-bold text-indigo-400">{hintsLeft} / 3회</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">오답 횟수:</span>
                    <span className="font-bold text-rose-500">{spotWrongClicksCount}회</span>
                  </div>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="md:col-span-8 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Timer className={`w-5 h-5 ${spotTimeLeft <= 10 ? 'text-rose-500 animate-bounce' : 'text-indigo-400'}`} />
                    <div>
                      <div className="text-xs text-slate-500">남은 시간</div>
                      <div className={`font-mono font-bold text-xl ${spotTimeLeft <= 10 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {spotTimeLeft}초
                      </div>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-slate-800"></div>

                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-xs text-slate-500">진행률</div>
                      <div className="font-mono font-bold text-xl text-slate-200">
                        {Math.round((getFoundDiffsCount() / getRequiredDiffsCount()) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={triggerHint}
                    disabled={hintsLeft <= 0 || spotWon || spotLost}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/90 text-slate-200 text-sm font-semibold border border-slate-750 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-95 transition-all"
                  >
                    <HelpCircle className="w-4 h-4 text-indigo-400" /> 힌트 사용 ({hintsLeft})
                  </button>
                  <button
                    onClick={initSpotGame}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-sm font-bold shadow-md hover:shadow-teal-500/10 active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" /> 다시 시작
                  </button>
                </div>
              </div>
            </div>

            {/* Side-by-Side Images Area */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 justify-center ${shakeBoard ? 'animate-shake' : ''}`}>
              
              {/* Original Image Container */}
              <div className="space-y-2">
                <div className="text-center font-bold text-sm text-slate-400 tracking-wide uppercase bg-slate-900/40 py-1.5 rounded-lg border border-slate-900">
                  원본 이미지
                </div>
                <div 
                  onClick={handleSpotImageClick}
                  className="relative cursor-crosshair overflow-hidden rounded-2xl border-4 border-slate-900 shadow-2xl aspect-square"
                >
                  <img 
                    src={originalImg} 
                    alt="Original" 
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />
                  
                  {/* Found Differences Circles */}
                  {spotDiffs.map((diff, idx) => {
                    if (diff.found || showAnswer) {
                      return (
                        <div
                          key={`orig-${diff.id}`}
                          className="absolute border-4 border-emerald-500 rounded-full shadow-[0_0_10px_#10b981] animate-pop-in pointer-events-none"
                          style={{
                            left: `${diff.x}%`,
                            top: `${diff.y}%`,
                            width: `${diff.radius * 2.2}%`,
                            height: `${diff.radius * 2.2}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        />
                      )
                    }
                    if (hintHighlight === idx) {
                      return (
                        <div
                          key={`hint-orig-${diff.id}`}
                          className="absolute border-4 border-teal-400 rounded-full animate-ping-glow pointer-events-none"
                          style={{
                            left: `${diff.x}%`,
                            top: `${diff.y}%`,
                            width: `${diff.radius * 2.2}%`,
                            height: `${diff.radius * 2.2}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        />
                      )
                    }
                    return null
                  })}

                  {/* Temporary Wrong Click Marks */}
                  {spotWrongMarks.map((mark) => (
                    <div
                      key={`orig-wrong-${mark.id}`}
                      className="absolute text-rose-500 font-extrabold text-3xl font-mono animate-fade-out-slow pointer-events-none select-none"
                      style={{
                        left: `${mark.x}%`,
                        top: `${mark.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      ✕
                    </div>
                  ))}
                </div>
              </div>

              {/* Modified Image Container */}
              <div className="space-y-2">
                <div className="text-center font-bold text-sm text-slate-400 tracking-wide uppercase bg-slate-900/40 py-1.5 rounded-lg border border-slate-900">
                  수정된 이미지
                </div>
                <div 
                  onClick={handleSpotImageClick}
                  className="relative cursor-crosshair overflow-hidden rounded-2xl border-4 border-slate-900 shadow-2xl aspect-square"
                >
                  <img 
                    src={modifiedImg} 
                    alt="Modified" 
                    className="w-full h-full object-cover select-none pointer-events-none"
                  />

                  {/* Found Differences Circles */}
                  {spotDiffs.map((diff, idx) => {
                    if (diff.found || showAnswer) {
                      return (
                        <div
                          key={`mod-${diff.id}`}
                          className="absolute border-4 border-emerald-500 rounded-full shadow-[0_0_10px_#10b981] animate-pop-in pointer-events-none"
                          style={{
                            left: `${diff.x}%`,
                            top: `${diff.y}%`,
                            width: `${diff.radius * 2.2}%`,
                            height: `${diff.radius * 2.2}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        />
                      )
                    }
                    if (hintHighlight === idx) {
                      return (
                        <div
                          key={`hint-mod-${diff.id}`}
                          className="absolute border-4 border-teal-400 rounded-full animate-ping-glow pointer-events-none"
                          style={{
                            left: `${diff.x}%`,
                            top: `${diff.y}%`,
                            width: `${diff.radius * 2.2}%`,
                            height: `${diff.radius * 2.2}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        />
                      )
                    }
                    return null
                  })}

                  {/* Temporary Wrong Click Marks */}
                  {spotWrongMarks.map((mark) => (
                    <div
                      key={`mod-wrong-${mark.id}`}
                      className="absolute text-rose-500 font-extrabold text-3xl font-mono animate-fade-out-slow pointer-events-none select-none"
                      style={{
                        left: `${mark.x}%`,
                        top: `${mark.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      ✕
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Victory / Defeat Dialog */}
            {(spotWon || spotLost) && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
                  
                  {spotWon ? (
                    <>
                      <div className="mx-auto w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mb-4 animate-bounce">
                        <Trophy className="w-8 h-8" />
                      </div>
                      <h3 className="text-3xl font-extrabold bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
                        성공! 모두 찾았습니다
                      </h3>
                      <div className="text-slate-300 my-5 space-y-2 text-sm">
                        <p>🎉 축하합니다! 모든 틀린 부분을 찾았습니다.</p>
                        <div className="bg-slate-950/50 p-4 rounded-xl space-y-1 font-mono text-slate-400 border border-slate-800">
                          <div className="flex justify-between"><span>걸린 시간:</span> <span className="text-slate-200 font-bold">{spotSecondsElapsed}초</span></div>
                          <div className="flex justify-between"><span>오답 횟수:</span> <span className="text-slate-200 font-bold">{spotWrongClicksCount}회</span></div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4 animate-pulse">
                        <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h3 className="text-3xl font-extrabold text-rose-400">
                        시간 초과!
                      </h3>
                      <p className="text-slate-400 my-5 text-sm">
                        아쉽게도 제한 시간이 지났습니다. 정답 위치를 공개합니다!
                      </p>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <button
                      onClick={initSpotGame}
                      className="py-3 px-4 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all text-sm"
                    >
                      다시 도전하기
                    </button>
                    <button
                      onClick={() => {
                        setSpotWon(false);
                        setSpotLost(false);
                        setShowAnswer(true);
                      }}
                      className="py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:shadow-lg hover:shadow-teal-500/20 active:scale-95 transition-all text-sm"
                    >
                      정답 확인하기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= SLIDING PUZZLE GAME ================= */}
        {gameMode === 'sliding' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto">
            
            {/* Left Panel: Settings & Upload */}
            <section className="lg:col-span-4 space-y-6">
              
              {/* Grid Selector */}
              <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-xl">
                <h2 className="text-lg font-bold flex items-center gap-2 text-teal-400 mb-4">
                  <Grid className="w-5 h-5" /> 난이도 설정
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 4, 5].map((size) => (
                    <button
                      key={size}
                      onClick={() => setGridSize(size)}
                      className={`py-3 rounded-xl font-bold transition-all duration-300 relative overflow-hidden ${
                        gridSize === size 
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-lg shadow-teal-500/20 scale-[1.02]' 
                          : 'bg-slate-800 hover:bg-slate-700/80 text-slate-300'
                      }`}
                    >
                      {size} x {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Box */}
              <div 
                {...getSlidingRootProps()} 
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 bg-slate-900/30 ${
                  isSlidingDragActive 
                    ? 'border-teal-400 bg-teal-500/5 scale-[1.01]' 
                    : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <input {...getSlidingInputProps()} />
                <UploadCloud className="w-10 h-10 mx-auto text-teal-500/80 mb-3" />
                <p className="font-semibold text-slate-300 text-sm">
                  {isSlidingDragActive ? "여기에 놓아서 업로드" : "나만의 캐릭터 이미지 업로드"}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  드래그 앤 드롭 또는 클릭하여 파일 선택
                </p>
              </div>

              {/* Original Preview Box */}
              <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-xs text-slate-400 space-y-2">
                <div className="font-semibold text-teal-400/90 text-sm flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" /> 오리지널 이미지
                </div>
                <div className="relative aspect-square w-32 mx-auto overflow-hidden rounded-lg border border-slate-800 shadow-inner">
                  <img src={slidingImgUrl} alt="Original character" className="w-full h-full object-cover" />
                </div>
              </div>
            </section>

            {/* Center Panel: Puzzle Board */}
            <section className="lg:col-span-8 flex flex-col items-center space-y-6">
              
              {/* Stats Bar */}
              <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl px-6 py-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="text-xs text-slate-500">시간</div>
                    <div className="font-mono font-bold text-lg text-slate-200">{formatTime(slidingSeconds)}</div>
                  </div>
                </div>
                
                <div className="h-8 w-px bg-slate-800"></div>

                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-xs text-slate-500">이동</div>
                    <div className="font-mono font-bold text-lg text-slate-200">{slidingMoves}회</div>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-800"></div>

                <button
                  onMouseEnter={() => setShowSlidingHint(true)}
                  onMouseLeave={() => setShowSlidingHint(false)}
                  onTouchStart={() => setShowSlidingHint(true)}
                  onTouchEnd={() => setShowSlidingHint(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all select-none active:scale-95"
                >
                  <Eye className="w-4 h-4" /> 힌트 보기
                </button>
              </div>

              {/* Puzzle Frame */}
              <div className="relative w-full max-w-lg aspect-square bg-slate-900 border-4 border-slate-850 rounded-3xl overflow-hidden shadow-2xl p-2 select-none">
                <div 
                  className="w-full h-full grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    gridTemplateRows: `repeat(${gridSize}, 1fr)`
                  }}
                >
                  {tiles.map((tileValue, index) => {
                    const totalTiles = gridSize * gridSize
                    const isEmpty = tileValue === totalTiles - 1

                    if (isEmpty) {
                      return <div key="empty" className="bg-slate-950/80 rounded-lg border border-slate-900/50" />
                    }

                    const originalRow = Math.floor(tileValue / gridSize)
                    const originalCol = tileValue % gridSize
                    
                    const bgPosX = (originalCol / (gridSize - 1)) * 100
                    const bgPosY = (originalRow / (gridSize - 1)) * 100

                    return (
                      <button
                        key={tileValue}
                        onClick={() => handleSlidingTileClick(index)}
                        className="w-full h-full rounded-lg overflow-hidden border border-slate-950/20 shadow-md hover:scale-[0.99] active:scale-[0.97] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer"
                        style={{
                          backgroundImage: `url(${slidingImgUrl})`,
                          backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                          backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                          backgroundRepeat: 'no-repeat'
                        }}
                      />
                    )
                  })}
                </div>

                {showSlidingHint && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs p-2 pointer-events-none transition-all duration-300">
                    <img 
                      src={slidingImgUrl} 
                      alt="Original puzzle" 
                      className="w-full h-full object-cover rounded-2xl opacity-90 border border-teal-500/30"
                    />
                  </div>
                )}

                {slidingWon && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                    <div className="p-4 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 mb-4 animate-bounce">
                      <Trophy className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
                      성공적으로 완료했습니다!
                    </h3>
                    <p className="text-slate-400 mt-2 text-sm max-w-xs">
                      {slidingMoves}번의 이동으로 {formatTime(slidingSeconds)}만에 퍼즐을 완성했습니다!
                    </p>
                    <button
                      onClick={() => initSlidingPuzzle(gridSize)}
                      className="mt-6 px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:shadow-lg hover:shadow-teal-500/20 active:scale-95 transition-all duration-150 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> 다시 도전하기
                    </button>
                  </div>
                )}
              </div>

              {/* Footer Controls */}
              <div className="flex gap-4">
                <button
                  onClick={() => initSlidingPuzzle(gridSize)}
                  className="px-5 py-2.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all active:scale-95 flex items-center gap-2 text-sm border border-slate-700"
                >
                  <RotateCcw className="w-4 h-4" /> 게임 재설정
                </button>
              </div>

            </section>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl text-center text-xs text-slate-600 mt-8 mb-4 border-t border-slate-900 pt-4">
        &copy; {new Date().getFullYear()} Robot & Baby Puzzle Game. All rights reserved.
      </footer>
    </div>
  )
}

export default App
