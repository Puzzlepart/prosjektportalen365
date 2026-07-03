import React, { FC, useContext } from 'react'
import { ProjectPhasesContext } from '../../../context'
import { ArchiveSelection } from '../../../../ArchiveDialog/ArchiveSelection/ArchiveSelection'
import { ChangePhaseDialogContext } from '../../context'
import { SET_ARCHIVE_CONFIGURATION } from '../../reducer'

/**
 * Change-phase dialog view that lets the user pick which documents and lists to
 * archive as part of the transition. Wraps the shared {@link ArchiveSelection}
 * with phase-filtered data and reports the selection to the dialog reducer.
 */
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
      initialSelection={dialogContext.state?.archiveConfiguration}
      onConfigurationChange={(archiveConfiguration) =>
        dialogContext.dispatch(SET_ARCHIVE_CONFIGURATION({ archiveConfiguration }))
      }
    />
  )
}
