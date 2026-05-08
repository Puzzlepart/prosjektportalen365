import React, { FC } from 'react'
import { ArchiveDialog } from '../../ArchiveDialog'
import { useProjectInformationContext } from '../context'
import { CLOSE_DIALOG, PROPERTIES_UPDATED } from '../reducer'

/**
 * Connects the standalone `ArchiveDialog` to `ProjectInformation`'s context-driven dialog state.
 * Opens when `state.activeDialog === 'ArchiveDialog'`.
 */
export const ArchiveDialogContainer: FC = () => {
  const context = useProjectInformationContext()
  const open = context.state.activeDialog === 'ArchiveDialog'
  return (
    <ArchiveDialog
      open={open}
      webUrl={context.props.webAbsoluteUrl}
      onDismiss={() => context.dispatch(CLOSE_DIALOG())}
      onArchived={() => context.dispatch(PROPERTIES_UPDATED({ refetch: true }))}
    />
  )
}
