import { useState } from 'react'
import { useCubeStore } from './store/cubeStore'
import { useCubeConnection } from './hooks/useCubeConnection'
import { useTimer } from './hooks/useTimer'
import { TimerPage } from './pages/TimerPage'
import { CubeVisualizer } from './components/CubeVisualizer'
import { Link, Route, HashRouter as Router, Routes } from 'react-router-dom'

function formatMs(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const centis = Math.floor((ms % 1000) / 10)
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
}

function HomePage() {
  const { status, connect, disconnect, error, pendingMacDevice, provideMac } = useCubeConnection()
  const { elapsed, running, start, stop, reset } = useTimer()
  const { moves } = useCubeStore()
  const [macInput, setMacInput] = useState('')

  const alg = moves.join(' ')

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
        <Link
          to="/timer"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Таймер сборки
        </Link>
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

      <section className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Таймер</h2>
          <div className="text-5xl font-mono font-bold mb-4">{formatMs(elapsed)}</div>
          <div className="flex gap-3">
            {!running ? (
              <button
                onClick={start}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Старт
              </button>
            ) : (
              <button
                onClick={stop}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Стоп
              </button>
            )}
            <button
              onClick={reset}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300"
            >
              Сброс
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Визуализация</h2>
          <CubeVisualizer alg={alg} className="w-full h-64" />
        </div>
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
        <Route path="/timer" element={<TimerPage />} />
      </Routes>
    </Router>
  )
}

export default App
