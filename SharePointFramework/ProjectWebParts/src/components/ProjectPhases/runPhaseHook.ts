import { sp } from '@pnp/sp'

/**
 * Run hook when chaging phase
 *
 * @param {string} hookUrl Hook url
 * @param {string} hookAuth Hook auth
 */
export const runPhaseHook = async (hookUrl: string, hookAuth: string) => {
  try {
    const web = await sp.web.get()

    const body = {
        auth: hookAuth,
        pp_webUrl: web.Url
      }

    const postRequest = {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
    }

    fetch(hookUrl, postRequest)
  } catch (error) {
    throw error
  }
}
