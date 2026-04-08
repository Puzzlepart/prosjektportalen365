import { sleep } from './sleep'

interface RetryOptions {
  maxRetries?: number
  initialDelaySeconds?: number
  onRetry?: (attempt: number, error: any, delaySeconds: number) => void
}

/**
 * Determines if an error is transient and should be retried.
 * Retries on 429 (throttling), 5xx (server errors), and network errors.
 * Does not retry on 4xx client errors (400, 401, 403, 404) as they won't self-resolve.
 */
function isTransientError(error: any): boolean {
  const statusCode = error?.statusCode ?? error?.status ?? error?.response?.status
  if (statusCode === 429) return true
  if (statusCode >= 500 && statusCode < 600) return true
  if (!statusCode && error instanceof Error) return true
  return false
}

/**
 * Extracts Retry-After delay from a 429 response, if present.
 * Returns the delay in seconds, or `null` if not found.
 */
function getRetryAfterSeconds(error: any): number | null {
  const retryAfter =
    error?.headers?.get?.('Retry-After') ??
    error?.response?.headers?.get?.('Retry-After') ??
    error?.retryAfter
  if (retryAfter != null) {
    const parsed = Number(retryAfter)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return null
}

/**
 * Wraps an async function with retry logic using exponential backoff.
 * Only retries on transient errors (429, 5xx, network errors).
 * Respects `Retry-After` headers on 429 responses.
 *
 * @param fn - Async function to retry
 * @param options - Retry options
 * @param options.maxRetries - Maximum number of retries (default: 3)
 * @param options.initialDelaySeconds - Initial delay in seconds, doubles each retry (default: 2)
 * @param options.onRetry - Callback invoked before each retry attempt
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const { maxRetries = 3, initialDelaySeconds = 2, onRetry } = options ?? {}
  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt >= maxRetries || !isTransientError(error)) {
        throw error
      }
      const retryAfter = getRetryAfterSeconds(error)
      const delaySeconds = retryAfter ?? initialDelaySeconds * Math.pow(2, attempt)
      onRetry?.(attempt + 1, error, delaySeconds)
      await sleep(delaySeconds)
    }
  }

  throw lastError
}
