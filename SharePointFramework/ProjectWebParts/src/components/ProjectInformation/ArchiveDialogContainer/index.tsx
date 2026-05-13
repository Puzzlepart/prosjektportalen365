import React, { FC } from 'react'
import { ArchiveDialog } from '../../ArchiveDialog'
import { useProjectInformationContext } from '../context'
import { CLOSE_DIALOG, PROPERTIES_UPDATED } from '../reducer'

/**
 * Connects the standalone `ArchiveDialog` to `ProjectInformation`'s context-driven dialog state.
 * Opens when `state.activeDialog === 'ArchiveDialog'`.
 *
 * NOTE: This indirection is required because the parent `<Fluent>` wrapper memoizes its children
 * with an empty dependency array. Inlining the dialog with `open` as a prop would freeze the open
 * value at first render. By reading context inside this component, the dialog re-renders correctly
 * when state changes (same pattern as `CreateParentDialog`, `RunProjectSetupDialog`).
 */
export const ArchiveDialogContainer: FC = () => {
  const context = useProjectInformationContext()
  return (
    <ArchiveDialog
      open={context.state.activeDialog === 'ArchiveDialog'}
      webUrl={context.props.webAbsoluteUrl}
      onDismiss={() => context.dispatch(CLOSE_DIALOG())}
      onArchived={() => context.dispatch(PROPERTIES_UPDATED({ refetch: true }))}
    />
  )
}
