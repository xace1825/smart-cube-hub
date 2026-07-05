import { useState, useEffect } from 'react'
import { useCubeStore } from './store/cubeStore'
import { useCubeConnection, addCubeEventListener } from './hooks/useCubeConnection'
import type { SmartCubeEvent } from 'smartcube-web-bluetooth'
import { useSolveTimer } from './hooks/useSolveTimer'
import { CubeVisualizer } from './components/CubeVisualizer'
import { HashRouter as Router, Route, Routes } from 'react-router-dom'

const phaseLabels: Record<string, string> = {
  scramble: 'Скрамблируй куб',
  inspection: 'ИНСПЕКЦИЯ',
  solving: 'СБОРКА',
  done: 'ГОТОВО',
}

const phaseColors: Record<string, string> = {
  scramble: 'text-slate-700',
  inspection: 'text-orange-500',
  solving: 'text-green-600',
  done: 'text-blue-600',
}

function HomePage() {
  const { status, connect, disconnect, error, pendingMacDevice, provideMac } = useCubeConnection()
  const { moves, reset: resetCube } = useCubeStore()
  const {
    phase,
    scrambleAlg,
    performedMoves,
    scrambleProgress,
    formattedSolveTime,
    formattedInspection,
    history,
    penalty,
    autoTimerMode,
    setAutoTimerMode,
    nextScramble,
    startInspection,
    stopSolve,
    stopSolveWithPenalty,
    handleCubeEvent,
    applyPlusTwo,
    applyDnf,
    getFinalDisplayTime,
  } = useSolveTimer()
  const [macInput, setMacInput] = useState('')

  const alg = moves.join(' ')
  const isInspection = phase === 'inspection'
  const isSolving = phase === 'solving'
  const isDone = phase === 'done'
  const canStart = phase === 'scramble' || isDone

  useEffect(() => {
    resetCube()
    nextScramble()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Subscribe to Bluetooth cube events for auto-timer.
  useEffect(() => {
    const unsubscribe = addCubeEventListener((event: SmartCubeEvent) => {
      handleCubeEvent(event as { type: string; facelets?: string; move?: string; timestamp?: number })
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleCubeEvent])

  useEffect(() => {
    let spaceDownAt = 0

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.key !== ' ') return
      e.preventDefault()
      if (isDone) {
        nextScramble()
        return
      }
      spaceDownAt = performance.now()
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== ' ') return
      e.preventDefault()
      const held = performance.now() - spaceDownAt
      if (isSolving) {
        stopSolveWithPenalty(held >= 300 ? 'dnf' : 'ok')
      } else if (isInspection) {
        if (held >= 300) {
          stopSolveWithPenalty('dnf')
        } else if (autoTimerMode === 'off') {
          // manual mode: short space during inspection starts solve immediately
          // startInspection() no-op in manual; solve starts at 15s or key
        }
      } else if (canStart && held < 300 && autoTimerMode === 'off') {
        // Only in manual mode space starts inspection. In auto modes inspection is triggered by cube state.
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
    }, [isSolving, isInspection, canStart, isDone, autoTimerMode, nextScramble, stopSolveWithPenalty])

    // Also listen for long-press DNF via dedicated handler if held >= 300ms during solve.
    useEffect(() => {
    let timer: number | undefined

    const onDown = (e: KeyboardEvent) => {
      if (e.repeat || e.key !== ' ' || (phase !== 'solving' && phase !== 'inspection')) return
      e.preventDefault()
      timer = window.setTimeout(() => {
        stopSolveWithPenalty('dnf')
      }, 300)
    }

    const onUp = (e: KeyboardEvent) => {
      if (e.key !== ' ' || (phase !== 'solving' && phase !== 'inspection')) return
      if (timer) {
        clearTimeout(timer)
        timer = undefined
      }
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      if (timer) clearTimeout(timer)
    }
    }, [phase, stopSolveWithPenalty])

  const handleMacSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    provideMac(macInput.trim() || null)
    setMacInput('')
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Smart Cube Hub</h1>
          <p className="text-slate-600">Платформа для Bluetooth-умных кубиков</p>
        </div>
      </header>

      <section className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Подключение куба</h2>
        <div className="flex flex-wrap items-center gap-4">
          {status === 'idle' && (
            <button
              onClick={connect}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Подключить куб
            </button>
          )}
          {status === 'connecting' && <span className="text-slate-500">Подключение...</span>}
          {status === 'connected' && (
            <>
              <span className="text-green-600 font-medium">Куб подключён</span>
              <button
                onClick={disconnect}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Отключить
              </button>
            </>
          )}
          {status === 'error' && (
            <>
              <span className="text-red-600">Ошибка: {error || 'не удалось подключиться'}</span>
              <button
                onClick={connect}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Повторить
              </button>
            </>
          )}
        </div>

        {pendingMacDevice && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="font-medium text-yellow-900 mb-2">
              Нужен MAC-адрес куба {pendingMacDevice.name || ''}
            </p>
            <p className="text-sm text-yellow-800 mb-3">
              На Android Chrome скрывает MAC. Узнай его через nRF Connect или Chrome Bluetooth internals, введи ниже.
            </p>
            <form onSubmit={handleMacSubmit} className="flex flex-wrap gap-2">
              <input
                type="text"
                value={macInput}
                onChange={(e) => setMacInput(e.target.value)}
                placeholder="AB:12:34:5D:34:12"
                pattern="[0-9a-fA-F:]{17}"
                className="px-3 py-2 border rounded-lg flex-1 min-w-[12rem]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Подключить
              </button>
            </form>
          </div>
        )}

        <p className="text-sm text-slate-500 mt-3">
          Web Bluetooth работает в Chrome/Edge, требуется HTTPS или localhost.
        </p>
      </section>

      <section className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
          <h2 className="text-xl font-semibold">Скрамбл</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              {(['cube', 'inspection-cube', 'off'] as const).map((mode) => {
                const labels: Record<typeof mode, string> = {
                  cube: 'Авто: по кубу',
                  'inspection-cube': 'Авто: старт/стоп',
                  off: 'Ручной',
                }
                return (
                  <button
                    key={mode}
                    onClick={() => setAutoTimerMode(mode)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                      autoTimerMode === mode
                        ? 'bg-white shadow text-blue-700'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {labels[mode]}
                  </button>
                )
              })}
            </div>
            <button
              onClick={nextScramble}
              className="px-4 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200"
            >
              Новый скрамбл
            </button>
          </div>
        </div>
        <div className="text-lg sm:text-xl font-mono break-words bg-slate-50 p-4 rounded-lg min-h-[4rem] flex flex-col gap-2">
          <div>{scrambleAlg || 'Генерация скрамбла...'}</div>
          {scrambleAlg && phase !== 'scramble' && (
            <div className="flex flex-wrap gap-1 text-base sm:text-lg">
              {scrambleAlg.split(/\s+/).filter(Boolean).map((move, idx) => {
                let cls = 'px-2 py-0.5 rounded-md '
                if (idx < scrambleProgress.matched) {
                  cls += 'bg-green-100 text-green-700'
                } else if (idx === scrambleProgress.matched && !scrambleProgress.diverged) {
                  cls += 'bg-blue-600 text-white font-bold shadow ring-2 ring-blue-300'
                } else if (scrambleProgress.diverged && idx < performedMoves.length) {
                  cls += 'bg-red-100 text-red-700'
                } else {
                  cls += 'text-slate-500'
                }
                return (
                  <span key={idx} className={cls}>
                    {move}
                  </span>
                )
              })}
            </div>
          )}
        </div>
        <div className="text-sm text-slate-500 mt-3">
          {autoTimerMode === 'cube' && 'Режим авто: собери скрамбл — инспекция начнётся сама, первый ход запустит сборку, собранное состояние остановит таймер.'}
          {autoTimerMode === 'inspection-cube' && 'Режим авто: собери скрамбл для старта, старт и стоп — по движению куба.'}
          {autoTimerMode === 'off' && 'Ручной режим: пробелом управляешь инспекцией и остановкой.'}
        </div>

        {scrambleProgress.diverged && phase !== 'scramble' && phase !== 'done' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="font-medium text-yellow-900 mb-2">Отклонение от скрамбла</p>
            <p className="text-sm text-yellow-800 mb-2">
              Чтобы вернуться к исходному скрамблу, выполни обратные ходы:
            </p>
            <div className="font-mono text-lg bg-white p-3 rounded border border-yellow-300">
              {(() => {
                const undo = [...performedMoves].reverse().map((m) => {
                  if (m.length === 1) return m + "'"
                  if (m.endsWith("'")) return m.slice(0, -1)
                  if (m.endsWith('2')) return m
                  return m
                }).join(' ')
                return undo || '—'
              })()}
            </div>
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <div className={`text-sm font-bold tracking-widest mb-2 ${phaseColors[phase]}`}>
            {phaseLabels[phase]}
          </div>
          <div className="text-6xl sm:text-7xl font-mono font-bold mb-4 tabular-nums">
            {isInspection ? formattedInspection : formattedSolveTime}
          </div>

          <div className="flex justify-center gap-3 flex-wrap">
            {autoTimerMode === 'off' && canStart && (
              <button
                onClick={() => startInspection()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg"
              >
                {isDone ? 'Следующий' : 'Старт инспекции'}
              </button>
            )}
            {autoTimerMode !== 'off' && phase === 'scramble' && (
              <span className="text-slate-500 text-base">Собери скрамбл — инспекция начнётся автоматически</span>
            )}
            {isSolving && (
              <button
                onClick={stopSolve}
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-lg"
              >
                Стоп
              </button>
            )}
            {isInspection && (
              <button
                onClick={stopSolve}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 text-lg"
              >
                DNF
              </button>
            )}
          </div>

          <p className="text-sm text-slate-500 mt-4">
            Пробел: старт/стоп. При инспекции автостарт сборки через 15 сек. Зажми пробел 0.3 с — DNF.
            {autoTimerMode !== 'off' && ' Bluetooth-куб сам стартует и останавливает таймер.'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Визуализация скрамбла</h2>
          <CubeVisualizer alg={scrambleAlg} className="w-full h-64" />
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Последние сборки</h2>
        <div className="flex gap-3 mb-4">
          <button
            onClick={applyPlusTwo}
            className={`px-4 py-2 rounded-lg ${
              penalty === '+2' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            +2
          </button>
          <button
            onClick={applyDnf}
            className={`px-4 py-2 rounded-lg ${
              penalty === 'dnf' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            DNF
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-slate-500">Нет завершённых сборок.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-auto">
            {history.map((record) => (
              <li
                key={record.id}
                className="flex justify-between items-center p-3 bg-slate-50 rounded-lg text-sm"
              >
                <span className="font-mono font-bold text-lg">{getFinalDisplayTime(record)}</span>
                <span className="text-slate-600 truncate max-w-[60%]" title={record.scramble}>
                  {record.scramble}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Ходы ({moves.length})</h2>
        {moves.length === 0 ? (
          <p className="text-slate-500">Нет данных. Подключите куб и начните вращать грани.</p>
        ) : (
          <div className="text-sm font-mono break-words">{alg}</div>
        )}
      </section>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  )
}

export default App
