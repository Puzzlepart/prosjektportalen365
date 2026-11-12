import { useContext, useMemo } from 'react'
import { ProjectPhasesContext } from '../../context'
import { IArchiveOperation } from '../../../../data/SPDataAdapter/types'

/**
 * Finds the latest archive operation whose message names the phase being left.
 */
export function usePhaseArchiveStatus(phaseName?: string) {
  const context = useContext(ProjectPhasesContext)

  const archiveOperation = useMemo((): IArchiveOperation | null => {
    if (!phaseName || !context.props.useArchive || !context.state.data?.archiveStatus) {
      return null
    }

    const phasePattern = `Fra ${phaseName}-fase`

    const matchingOperations = context.state.data.archiveStatus.operations.filter((operation) => {
      return operation.message && operation.message.includes(phasePattern)
    })

    return matchingOperations.length > 0 ? matchingOperations[0] : null
  }, [phaseName, context.props.useArchive, context.state.data?.archiveStatus])

  return {
    archiveOperation,
    hasArchiveData: !!archiveOperation
  }
}
