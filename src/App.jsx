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
  Image as ImageIcon
} from 'lucide-react'
import robotImg from './assets/robot.jpg'
import './App.css'

function App() {
  const [gridSize, setGridSize] = useState(3)
  const [imageUrl, setImageUrl] = useState(robotImg)
  const [tiles, setTiles] = useState([])
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isWon, setIsWon] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const timerRef = useRef(null)

  // Initialize and shuffle puzzle
  const initPuzzle = useCallback((size = gridSize) => {
    const totalTiles = size * size
    // Start with a solved board
    const newTiles = Array.from({ length: totalTiles }, (_, i) => i)
    
    // Shuffle the board by making valid random moves from the solved state
    // This mathematically guarantees the puzzle is solvable.
    let emptyIndex = totalTiles - 1
    
    // Number of random swaps (more for larger grids)
    const shuffleSteps = size * size * 40
    
    for (let i = 0; i < shuffleSteps; i++) {
      const validMoves = []
      const emptyRow = Math.floor(emptyIndex / size)
      const emptyCol = emptyIndex % size

      // Check left
      if (emptyCol > 0) validMoves.push(emptyIndex - 1)
      // Check right
      if (emptyCol < size - 1) validMoves.push(emptyIndex + 1)
      // Check up
      if (emptyRow > 0) validMoves.push(emptyIndex - size)
      // Check down
      if (emptyRow < size - 1) validMoves.push(emptyIndex + size)

      // Pick a random valid neighbor and swap
      const randomNeighbor = validMoves[Math.floor(Math.random() * validMoves.length)]
      newTiles[emptyIndex] = newTiles[randomNeighbor]
      newTiles[randomNeighbor] = totalTiles - 1
      emptyIndex = randomNeighbor
    }

    setTiles(newTiles)
    setMoves(0)
    setSeconds(0)
    setIsActive(false)
    setIsWon(false)
  }, [gridSize])

  // Re-initialize when grid size changes
  useEffect(() => {
    initPuzzle(gridSize)
  }, [gridSize, initPuzzle])

  // Handle Timer
  useEffect(() => {
    if (isActive && !isWon) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isActive, isWon])

  // Check victory condition
  const checkWin = (currentTiles) => {
    for (let i = 0; i < currentTiles.length; i++) {
      if (currentTiles[i] !== i) return false
    }
    return true
  }

  // Handle tile click
  const handleTileClick = (index) => {
    if (isWon) return

    const size = gridSize
    const totalTiles = size * size
    const emptyIndex = tiles.indexOf(totalTiles - 1)

    const clickRow = Math.floor(index / size)
    const clickCol = index % size
    const emptyRow = Math.floor(emptyIndex / size)
    const emptyCol = emptyIndex % size

    // Check if clicked tile is adjacent to empty tile
    const isAdjacent = Math.abs(clickRow - emptyRow) + Math.abs(clickCol - emptyCol) === 1

    if (isAdjacent) {
      // Start timer on first move
      if (moves === 0) {
        setIsActive(true)
      }

      const newTiles = [...tiles]
      // Swap clicked tile with empty tile
      newTiles[emptyIndex] = tiles[index]
      newTiles[index] = totalTiles - 1
      
      setTiles(newTiles)
      setMoves((prev) => prev + 1)

      if (checkWin(newTiles)) {
        setIsWon(true)
        setIsActive(false)
      }
    }
  }

  // Handle Drag and Drop Image Upload
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles[0]) {
      const file = acceptedFiles[0]
      const objectUrl = URL.createObjectURL(file)
      setImageUrl(objectUrl)
      initPuzzle(gridSize)
    }
  }, [gridSize, initPuzzle])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  })

  // Format time (MM:SS)
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60)
    const remainingSecs = secs % 60
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-4 md:p-8 font-sans selection:bg-teal-500 selection:text-slate-900">
      
      {/* Header */}
      <header className="w-full max-w-4xl text-center my-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-semibold tracking-wider uppercase mb-3 animate-pulse">
          <Sparkles className="w-4 h-4" /> Robot Sliding Puzzle
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500 bg-clip-text text-transparent">
          로봇 에이전트 슬라이딩 퍼즐
        </h1>
        <p className="text-slate-400 mt-2 text-sm md:text-base">
          이전에 제작한 나만의 로봇 캐릭터 혹은 직접 업로드한 이미지로 퍼즐을 맞춰보세요!
        </p>
      </header>

      {/* Main Body */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto">
        
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
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 bg-slate-900/30 ${
              isDragActive 
                ? 'border-teal-400 bg-teal-500/5 scale-[1.01]' 
                : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-10 h-10 mx-auto text-teal-500/80 mb-3" />
            <p className="font-semibold text-slate-300 text-sm md:text-base">
              {isDragActive ? "여기에 놓아서 업로드" : "나만의 캐릭터 이미지 업로드"}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              드래그 앤 드롭 또는 클릭하여 파일 선택
            </p>
          </div>

          {/* Tips / Original Preview Box */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-teal-400/90 text-sm flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" /> 오리지널 이미지
            </div>
            <div className="relative aspect-square w-32 mx-auto overflow-hidden rounded-lg border border-slate-800 shadow-inner">
              <img src={imageUrl} alt="Original character" className="w-full h-full object-cover" />
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
                <div className="font-mono font-bold text-lg text-slate-200">{formatTime(seconds)}</div>
              </div>
            </div>
            
            <div className="h-8 w-px bg-slate-800"></div>

            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs text-slate-500">이동</div>
                <div className="font-mono font-bold text-lg text-slate-200">{moves}회</div>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-800"></div>

            <button
              onMouseEnter={() => setShowHint(true)}
              onMouseLeave={() => setShowHint(false)}
              onTouchStart={() => setShowHint(true)}
              onTouchEnd={() => setShowHint(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all select-none active:scale-95"
            >
              <Eye className="w-4 h-4" /> 힌트 보기
            </button>
          </div>

          {/* Puzzle Frame */}
          <div className="relative w-full max-w-lg aspect-square bg-slate-900 border-4 border-slate-850 rounded-3xl overflow-hidden shadow-2xl p-2 select-none">
            {/* Grid Container */}
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

                // Calculate background position for slicing
                const originalRow = Math.floor(tileValue / gridSize)
                const originalCol = tileValue % gridSize
                
                const bgPosX = (originalCol / (gridSize - 1)) * 100
                const bgPosY = (originalRow / (gridSize - 1)) * 100

                return (
                  <button
                    key={tileValue}
                    onClick={() => handleTileClick(index)}
                    className="w-full h-full rounded-lg overflow-hidden border border-slate-950/20 shadow-md hover:scale-[0.99] active:scale-[0.97] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer"
                    style={{
                      backgroundImage: `url(${imageUrl})`,
                      backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                      backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                )
              })}
            </div>

            {/* Hint Overlay (Hover to trigger) */}
            {showHint && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-xs p-2 pointer-events-none transition-all duration-300">
                <img 
                  src={imageUrl} 
                  alt="Original puzzle" 
                  className="w-full h-full object-cover rounded-2xl opacity-90 border border-teal-500/30"
                />
              </div>
            )}

            {/* Victory Screen Overlay */}
            {isWon && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="p-4 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 mb-4 animate-bounce">
                  <Trophy className="w-12 h-12" />
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
                  성공적으로 완료했습니다!
                </h3>
                <p className="text-slate-400 mt-2 text-sm max-w-xs">
                  {moves}번의 이동으로 {formatTime(seconds)}만에 퍼즐을 완성했습니다!
                </p>
                <button
                  onClick={() => initPuzzle(gridSize)}
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
              onClick={() => initPuzzle(gridSize)}
              className="px-5 py-2.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all active:scale-95 flex items-center gap-2 text-sm border border-slate-700"
            >
              <RotateCcw className="w-4 h-4" /> 게임 재설정
            </button>
          </div>

        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center text-xs text-slate-600 mt-8 mb-4 border-t border-slate-900 pt-4">
        &copy; {new Date().getFullYear()} Robot Puzzle Agent. All rights reserved.
      </footer>
    </div>
  )
}

export default App
