import { useContext } from 'react'
import { ProjectPhasesContext } from './context'

/** Provides the configured phase-change webhook callback. */
export function usePhaseHooks() {
  const context = useContext(ProjectPhasesContext)

  const runHook = async (
    headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
    // eslint-disable-next-line require-await
  ) => {
    try {
      const body: Record<string, string> = {
        apiKey: context.props.hookAuth,
        webUrl: context.props.webAbsoluteUrl
      }

      const postRequest = {
        method: 'POST',
        body: JSON.stringify(body),
        headers
      }

      void fetch(context.props.hookUrl, postRequest)
    } catch (error) {}
  }

  return runHook
}
