const MAX_JSON_LENGTH = 200

const MAX_CAUSE_DEPTH = 3

/** Rejects empty messages and implicit object-to-string output. */
function isReadable(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && value !== '[object Object]'
}

/** Reads a nested value without failing when an intermediate object is absent. */
function at(value: unknown, ...path: string[]): any {
  return path.reduce((nested, key) => (nested == null ? undefined : nested[key]), value as any)
}

/**
 * The message of a failed JSOM request, which rejects with `{ sender, args }`: `args` is a
 * `ClientRequestFailedEventArgs`.
 */
function jsomMessage(value: Record<string, any>): unknown {
  const getMessage = at(value, 'args', 'get_message')
  return typeof getMessage === 'function' ? getMessage.call(value.args) : undefined
}

/**
 * Finds a readable message across JavaScript, SharePoint and JSOM error shapes and bounded causes.
 */
function readableText(error: unknown, depth: number): string {
  if (error === null || error === undefined) return ''
  if (typeof error === 'string') return isReadable(error) ? error : ''
  if (typeof error !== 'object') return String(error)
  const value = error as Record<string, any>
  const message = [
    value.message,
    at(value, 'message', 'value'),
    at(value, 'error', 'message', 'value'),
    jsomMessage(value)
  ].find(isReadable)
  if (message) return message
  return depth < MAX_CAUSE_DEPTH && value.cause !== error
    ? readableText(value.cause, depth + 1)
    : ''
}

/**
 * Serializes bounded diagnostic JSON, omitting repeated references and empty or unreadable values.
 */
function shortJson(value: object): string {
  const seen = new WeakSet<object>()
  let json: string
  try {
    json = JSON.stringify(value, (_key, nested) => {
      if (typeof nested !== 'object' || nested === null) return nested
      if (seen.has(nested)) return undefined
      seen.add(nested)
      return nested
    })
  } catch {
    return ''
  }
  if (json === '{}' || json === '[]') return ''
  return json.length > MAX_JSON_LENGTH ? `${json.slice(0, MAX_JSON_LENGTH - 1)}…` : json
}

/**
 * Extracts a readable setup failure message, falling back to bounded JSON when no message exists.
 *
 * sp-js-provisioning's `ProvisioningError` takes its message from what the handler failed with, and
 * JSOM rejects with { sender, args }, which has no message and otherwise becomes "[object Object]".
 */
export function readableErrorMessage(error: unknown): string {
  const text = readableText(error, 0)
  if (text) return text
  const failure = error instanceof Error ? (error as { cause?: unknown }).cause : error
  return typeof failure === 'object' && failure !== null && !(failure instanceof Error)
    ? shortJson(failure)
    : ''
}

/** Appends a readable failure reason to a localized setup message when one is available. */
export function withReason(message: string, error: unknown): string {
  const reason = readableErrorMessage(error)
  return reason ? `${message}: ${reason}` : message
}

/**
 * Prepares raw failure details for parseErrorStack, preserving objects with readable messages.
 * Message-less error objects become a readable name and reason instead of "[object Object]".
 */
export function readableErrorDetails(stack: unknown): unknown {
  if (stack === null || stack === undefined) return ''
  if (typeof stack !== 'object') return stack
  const error = stack as { name?: unknown; message?: unknown }
  if (isReadable(error.message)) return stack
  const name = isReadable(error.name) ? error.name : 'Error'
  const message = readableErrorMessage(stack)
  return message ? `${name}: ${message}` : name
}
