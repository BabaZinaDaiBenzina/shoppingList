export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">📴</div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          Офлайн режим
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Вы работаете без интернет-соединения. Данные будут синхронизированы при подключении к сети.
        </p>
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 shadow-lg">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Проверьте подключение к интернету и обновите страницу
          </p>
        </div>
      </div>
    </div>
  )
}
