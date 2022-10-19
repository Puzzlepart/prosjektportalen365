import { sp } from '@pnp/sp'

/**
 * Run hook when changing phase
 *
 * @param hookUrl Hook url
 * @param hookAuth Hook auth
 */
export const runPhaseHook = async (hookUrl: string, hookAuth: string) => {
  try {
    const web = await sp.web.get()

    const body = {
      apiKey: hookAuth,
      webUrl: web.Url
    }

    const postRequest = {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }

    fetch(hookUrl, postRequest)
  } catch (error) {}
}
