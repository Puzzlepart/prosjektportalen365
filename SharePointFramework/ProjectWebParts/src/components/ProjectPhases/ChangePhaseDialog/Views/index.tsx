import React, { FC, useContext } from 'react'
import { ProjectPhasesContext } from '../../context'
import { ArchiveSelection } from '../../../ArchiveDialog/ArchiveSelection/ArchiveSelection'
import { ChangePhaseDialogContext } from '../context'
import { SET_ARCHIVE_CONFIGURATION } from '../reducer'

export * from './InitialView'
export * from './SummaryView'
export * from './ChangingPhaseView'

export const ArchiveView: FC = () => {
  const context = useContext(ProjectPhasesContext)
  const dialogContext = useContext(ChangePhaseDialogContext)
  const data = context.state?.data
  return (
    <ArchiveSelection
      documents={data?.archiveDocuments || []}
      lists={data?.archiveLists || []}
      history={data?.archiveHistory}
      currentPhaseId={data?.currentPhase?.id}
      onConfigurationChange={(archiveConfiguration) =>
        dialogContext.dispatch(SET_ARCHIVE_CONFIGURATION({ archiveConfiguration }))
      }
    />
  )
}

export enum View {
  Initial,
  Summary,
  Archive,
  Confirm,
  ChangingPhase
}
