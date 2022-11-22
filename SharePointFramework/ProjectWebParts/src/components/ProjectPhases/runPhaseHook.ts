import { IProjectPhasesProps } from './types'

/**
 * Run hook when changing phase
 * 
 * @param props Component props for `ProjectPhases`
 */
export const runPhaseHook = async (props: IProjectPhasesProps) => {
  try {
    const web = await props.sp.web()

    const body = {
      apiKey: props.hookAuth,
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

    fetch(props.hookUrl, postRequest)
  } catch (error) {}
}
