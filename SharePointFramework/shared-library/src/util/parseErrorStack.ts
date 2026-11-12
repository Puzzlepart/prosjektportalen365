import { stringIsNullOrEmpty } from '@pnp/core'

interface IODataError {
  code: string
  message: { value: string; lang: string }
}

/**
 * Extracts an OData message from a serialized error suffix, returning null when parsing fails.
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
 * Extracts an embedded OData error message, otherwise returning the supplied stack as text.
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
