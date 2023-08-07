import { useContext } from 'react'
import { ProjectPhasesContext } from './context'

/**
 * Hook for running phase hooks. Returns a function that can be called to run the hook.
 */
export function usePhaseHooks() {
  const context = useContext(ProjectPhasesContext)
  const run = async (
    headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
  ) => {
    try {
      const body: Record<string, string> = {
        apiKey: context.props.hookAuth,
        webUrl: context.props.webPartContext.pageContext.web.absoluteUrl
      }

      const postRequest = {
        method: 'POST',
        body: JSON.stringify(body),
        headers
      }

      fetch(context.props.hookUrl, postRequest)
    } catch (error) {}
  }
  return [run] as const
}
