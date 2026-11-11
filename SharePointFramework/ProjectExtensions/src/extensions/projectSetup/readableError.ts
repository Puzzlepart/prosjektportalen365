/**
 * How long the JSON of an error without a message may be in the setup's messages.
 */
const MAX_JSON_LENGTH = 200

/**
 * How many causes in a message is looked for.
 */
const MAX_CAUSE_DEPTH = 3

/**
 * Whether `value` is a text a user can read: not empty, and not what an object turned into a text
 * reads as.
 *
 * @param value The value
 */
function isReadable(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && value !== '[object Object]'
}

/**
 * The value at `path` in `value`, or `undefined` where the path ends.
 *
 * @param value The value
 * @param path The keys to follow
 */
function at(value: unknown, ...path: string[]): any {
  return path.reduce((nested, key) => (nested == null ? undefined : nested[key]), value as any)
}

/**
 * The message of a failed JSOM request, which rejects with `{ sender, args }`: `args` is a
 * `ClientRequestFailedEventArgs`.
 *
 * @param value What the request rejected with
 */
function jsomMessage(value: Record<string, any>): unknown {
  const getMessage = at(value, 'args', 'get_message')
  return typeof getMessage === 'function' ? getMessage.call(value.args) : undefined
}

/**
 * The first readable text in `error`: the text itself; else its `message`, SharePoint's error body
 * (`message.value`, `error.message.value`) or a failed JSOM request's `args.get_message()`; else the
 * same of its `cause`, a few causes in at most. Empty when there is none.
 *
 * @param error What failed
 * @param depth How many causes in `error` is
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
 * A short JSON of `value`, a reference it holds twice left out, and empty for an empty object or
 * one that cannot be written as JSON.
 *
 * @param value The value
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
 * A readable message for what a step of the setup failed with: the first readable text in it or in
 * its causes (see `readableText`); else a short JSON of it when it is an object that is not an
 * error, or of its cause when it is an error, whose own fields say nothing. Empty when there is
 * nothing to read.
 *
 * sp-js-provisioning's `ProvisioningError` takes its message from what the handler failed with, and
 * a failed JSOM request (the content types, among others) rejects with `{ sender, args }`, which
 * has no message: the setup said «[object Object]».
 *
 * @param error What the step failed with
 */
export function readableErrorMessage(error: unknown): string {
  const text = readableText(error, 0)
  if (text) return text
  const failure = error instanceof Error ? (error as { cause?: unknown }).cause : error
  return typeof failure === 'object' && failure !== null && !(failure instanceof Error)
    ? shortJson(failure)
    : ''
}

/**
 * `message`, then what `error` says when it says something readable: `<message>: <what it says>`.
 *
 * @param message The message
 * @param error What the step failed with
 */
export function withReason(message: string, error: unknown): string {
  const reason = readableErrorMessage(error)
  return reason ? `${message}: ${reason}` : message
}

/**
 * What a `ProjectSetupError` shows under its message for the `stack` it was given: a text as it
 * is, an error with a readable message of its own as it is (`parseErrorStack` reads SharePoint's
 * error body in it), and anything else as its name and a readable message. sp-js-provisioning's
 * `ProvisioningError` for a failed JSOM request showed as «ProvisioningError: [object Object]».
 *
 * @param stack The stack, or the error, the setup error was given
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
