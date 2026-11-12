import { sleep } from './sleep'

interface RetryOptions {
  maxRetries?: number
  initialDelaySeconds?: number
  onRetry?: (attempt: number, error: any, delaySeconds: number) => void
}

/**
 * Retries throttling, server errors and Error objects without a status.
 * Other client errors are final because retrying cannot resolve them.
 */
function isTransientError(error: any): boolean {
  const statusCode = error?.statusCode ?? error?.status ?? error?.response?.status
  if (statusCode === 429) return true
  if (statusCode >= 500 && statusCode < 600) return true
  if (!statusCode && error instanceof Error) return true
  return false
}

/**
 * Reads a positive numeric Retry-After delay in seconds; HTTP-date values are not supported.
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
 * Retries throttling, server errors and Error objects without a status using exponential backoff.
 * A positive numeric Retry-After value overrides the computed delay.
 *
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
