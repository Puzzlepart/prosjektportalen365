import { stringIsNullOrEmpty } from '@pnp/common'

interface IODataError {
  code: string
  message: { value: string; lang: string }
}

/**
 * Parse odata error
 *
 * @param str Error string
 */
function parseODataError(str: any): string {
  try {
    const error: IODataError = JSON.parse(str.split('::>')[1])['odata.error']
    return error.message.value
  } catch (error) {
    return null
  }
}

/**
 * Parse error stack which might contain e.g. odata.error object
 *
 * @param stack Stack to parse
 */
export function parseErrorStack(stack: any): string {
  if (stack.toString) {
    stack = stack.toString()
    if (stringIsNullOrEmpty(stack)) return null
    if (stack.indexOf('odata.error') !== -1) {
      return parseODataError(stack)
    } else {
      return stack
    }
  }
  return null
}
