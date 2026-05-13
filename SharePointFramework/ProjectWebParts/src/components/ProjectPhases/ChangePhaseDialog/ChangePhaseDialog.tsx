import { format } from '@fluentui/react'
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Label,
  FluentProvider,
  IdPrefixProvider,
  Text,
  useId
} from '@fluentui/react-components'
import { Dismiss24Regular } from '@fluentui/react-icons'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { ProjectPhasesContext } from '../context'
import { Actions } from './Actions/Actions'
import styles from './ChangePhaseDialog.module.scss'
import { Content } from './Content/Content'
import { DynamicHomepageContent } from './DynamicHomepageContent/DynamicHomepageContent'
import { View } from './Views'
import { ChangePhaseDialogContext } from './context'
import { useChangePhaseDialog } from './useChangePhaseDialog'
import { customLightTheme } from 'pp365-shared-library'
import { SelectionSummary } from '../../ArchiveDialog/ArchiveSelection/SelectionSummary'
import { DISMISS_CHANGE_PHASE_DIALOG } from '../reducer'

export const ChangePhaseDialog: FC = () => {
  const context = useContext(ProjectPhasesContext)
  const { state, dispatch, nextChecklistItem } = useChangePhaseDialog()
  const fluentProviderId = useId('fp-change-phase-dialog')
  if (!context.state.confirmPhase) return null

  return (
    <ChangePhaseDialogContext.Provider value={{ state, dispatch, nextChecklistItem }}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <Dialog open modalType='alert'>
            <DialogSurface
              style={
                state.view === View.Archive
                  ? { maxWidth: 'min(1210px, 95vw)', minHeight: 'min(85vh, 660px)' }
                  : undefined
              }
            >
              <DialogBody
                className={`${styles.changePhaseDialog} ${
                  state.view === View.Archive ? styles.archiveWide : ''
                }`}
              >
                <DialogTitle
                  action={
                    state.view !== View.ChangingPhase && (
                      <DialogTrigger action='close' disableButtonEnhancement>
                        <Button
                          appearance='subtle'
                          aria-label={strings.CloseText}
                          icon={<Dismiss24Regular />}
                          onClick={() => context.dispatch(DISMISS_CHANGE_PHASE_DIALOG())}
                        />
                      </DialogTrigger>
                    )
                  }
                >
                  {state.view === View.Archive
                    ? strings.ArchiveViewTitle
                    : format(strings.ChangePhaseDialogTitle, context.state.confirmPhase.name)}
                </DialogTitle>
                <DialogContent className={styles.dialogContent}>
                  <Label weight='semibold'>
                    {state.view === View.Archive
                      ? strings.ArchiveViewDescription
                      : context.state.phase
                      ? format(
                          strings.ChangePhaseDialogSubtitle,
                          context.state.phase?.name,
                          context.state.confirmPhase.name
                        )
                      : format(
                          strings.ChangeFirstPhaseDialogSubtitle,
                          context.state.confirmPhase.name
                        )}
                  </Label>
                  {state.view === View.Confirm &&
                    context.props.useArchive &&
                    state.archiveConfiguration &&
                    state.archiveConfiguration.documents.length +
                      state.archiveConfiguration.lists.length >
                      0 && (
                      <SelectionSummary
                        total={
                          state.archiveConfiguration.documents.length +
                          state.archiveConfiguration.lists.length
                        }
                        documentsSelected={state.archiveConfiguration.documents.length}
                        listsSelected={state.archiveConfiguration.lists.length}
                        selectedItems={[
                          ...state.archiveConfiguration.documents,
                          ...state.archiveConfiguration.lists
                        ]}
                      />
                    )}
                  {state.view === View.Confirm && (
                    <Text weight='semibold' style={{ textAlign: 'right' }}>
                      {format(strings.ConfirmChangePhase, context.state.confirmPhase.name)}
                    </Text>
                  )}
                  {state.view === View.Confirm &&
                    context.props.useDynamicHomepage &&
                    context.props.showPhaseSitePageMessage && <DynamicHomepageContent />}
                  <Content />
                </DialogContent>
                <Actions />
              </DialogBody>
            </DialogSurface>
          </Dialog>
        </FluentProvider>
      </IdPrefixProvider>
    </ChangePhaseDialogContext.Provider>
  )
}
