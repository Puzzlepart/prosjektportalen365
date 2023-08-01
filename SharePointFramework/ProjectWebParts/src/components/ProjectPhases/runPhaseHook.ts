import { SPFI } from '@pnp/sp'

/**
 * Run hook when changing phase
 *
 * @param hookUrl Hook url
 * @param hookAuth Hook auth
 * @param sp SPFI instance
 */
export const runPhaseHook = async (hookUrl: string, hookAuth: string, sp: SPFI) => {
  try {
    // TODO: Is this needed? Isn't the URL available in the SPFx context?
    const web = await sp.web.select('Url')()

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
