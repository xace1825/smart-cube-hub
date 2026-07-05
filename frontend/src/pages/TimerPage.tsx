import { useEffect } from 'react'
import { useCubeStore } from '../store/cubeStore'
import { useSolveTimer } from '../hooks/useSolveTimer'
import { CubeVisualizer } from '../components/CubeVisualizer'

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

export function TimerPage() {
  const { moves, reset: resetCube } = useCubeStore()
  const {
    phase,
    scrambleAlg,
    formattedSolveTime,
    formattedInspection,
    history,
    penalty,
    nextScramble,
    startInspection,
    stopSolve,
    applyPlusTwo,
    applyDnf,
    getFinalDisplayTime,
  } = useSolveTimer()

  useEffect(() => {
    resetCube()
    nextScramble()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isInspection = phase === 'inspection'
  const isSolving = phase === 'solving'
  const isDone = phase === 'done'
  const canStart = phase === 'scramble' || isDone

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
        stopSolve()
      } else if (canStart && held < 300) {
        startInspection()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [isSolving, canStart, isDone, nextScramble, startInspection, stopSolve])

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Smart Cube Hub</h1>
          <p className="text-slate-600">Таймер сборки со скрамблом и инспекцией</p>
        </div>
        <a href="/" className="text-blue-600 hover:underline">На главную</a>
      </header>

      <section className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
          <h2 className="text-xl font-semibold">Скрамбл</h2>
          <button
            onClick={nextScramble}
            className="px-4 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200"
          >
            Новый скрамбл
          </button>
        </div>
        <div className="text-lg sm:text-xl font-mono break-words bg-slate-50 p-4 rounded-lg min-h-[4rem] flex items-center">
          {scrambleAlg || 'Генерация скрамбла...'}
        </div>
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
            {canStart && (
              <button
                onClick={() => startInspection()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg"
              >
                {isDone ? 'Следующий' : 'Старт инспекции'}
              </button>
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
            Пробел: старт/стоп. При инспекции автостарт сборки через 15 сек.
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
          <div className="text-sm font-mono break-words">{moves.join(' ')}</div>
        )}
      </section>
    </div>
  )
}
