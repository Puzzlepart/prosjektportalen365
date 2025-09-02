import { useContext } from 'react'
import { ProjectPhasesContext } from './context'
import { IArchiveConfiguration } from './ChangePhaseDialog/Views/ArchiveView'

/**
 * Hook for running phase hooks. Returns a function that can be called to run the hook.
 */
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

      fetch(context.props.hookUrl, postRequest)
    } catch (error) {}
  }

  const runArchiveHook = async (
    archiveConfiguration: IArchiveConfiguration,
    headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
    // eslint-disable-next-line require-await
  ) => {
    try {
      if (
        !context.props.useArchive ||
        !context.props.hookArchiveUrl ||
        !context.props.hookArchiveAuth
      ) {
        return
      }

      const body = {
        apiKey: context.props.hookArchiveAuth,
        webUrl: context.props.webAbsoluteUrl,
        archiveConfiguration: JSON.stringify(archiveConfiguration)
      }

      const postRequest = {
        method: 'POST',
        body: JSON.stringify(body),
        headers
      }

      fetch(context.props.hookArchiveUrl, postRequest)
    } catch (error) {
      console.error('Error running archive hook:', error)
    }
  }

  return [runHook, runArchiveHook] as const
}
