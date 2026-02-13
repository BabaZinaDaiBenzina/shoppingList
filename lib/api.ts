/**
 * Helper функции для API запросов
 *
 * После внедрения httpOnly cookies для авторизации,
 * Authorization header больше не нужен - браузер автоматически
 * отправляет cookie с каждым запросом.
 */

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>
}

/**
 * Выполняет авторизованный API запрос
 * Cookie автоматически отправляется браузером (httpOnly)
 *
 * @example
 * ```ts
 * const data = await apiFetch('/api/shopping-lists')
 * const created = await apiFetch('/api/items', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'Milk' })
 * })
 * ```
 */
export async function apiFetch(url: string, options: RequestOptions = {}): Promise<Response> {
  // Убедимся что headers существует
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Убираем Authorization header если он есть (теперь используем cookie)
  const { Authorization: _authorization, ...headersWithoutAuth } = headers

  // Выполняем запрос - cookie автоматически отправится браузером
  return fetch(url, {
    ...options,
    headers: headersWithoutAuth,
  })
}

/**
 * Обёртка для apiFetch с парсингом JSON
 */
export async function apiFetchJson<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
  const response = await apiFetch(url, options)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API request failed')
  }

  return response.json()
}

/**
 * Константа для легкой миграции - убирает Authorization header из существующих вызовов
 * @deprecated Используйте apiFetch() вместо этого
 */
export function withCredentials(options: RequestOptions): RequestOptions {
  const { headers, ...rest } = options
  const { Authorization: _authorization, ...headersWithoutAuth } = headers || {}

  return { ...rest, headers: headersWithoutAuth as Record<string, string> }
}
