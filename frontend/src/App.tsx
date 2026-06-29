import { useCubeStore } from './store/cubeStore'
import { useCubeConnection } from './hooks/useCubeConnection'
import { useTimer } from './hooks/useTimer'
import { CubeVisualizer } from './components/CubeVisualizer'

function formatMs(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const centis = Math.floor((ms % 1000) / 10)
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
}

function App() {
  const { status, connect, disconnect, error } = useCubeConnection()
  const { elapsed, running, start, stop, reset } = useTimer()
  const { moves } = useCubeStore()

  const alg = moves.join(' ')

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Smart Cube Hub</h1>
        <p className="text-slate-600">Платформа для Bluetooth-умных кубиков</p>
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

export default App
