import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogSurface,
  DialogTitle,
  FluentProvider,
  IdPrefixProvider
} from '@fluentui/react-components'
import * as strings from 'ProgramWebPartsStrings'
import _ from 'lodash'
import React, { FC, useContext } from 'react'
import { ProjectList } from '../ProjectList'
import { ProgramAdministrationContext } from '../context'
import { SET_SELECTED_TO_ADD, TOGGLE_ADD_PROJECT_DIALOG } from '../reducer'
import styles from './AddProjectDialog.module.scss'
import { useAddProjectDialog } from './useAddProjectDialog'
import { customLightTheme, UserMessage } from 'pp365-shared-library'

export const AddProjectDialog: FC = () => {
  const context = useContext(ProgramAdministrationContext)
  const { availableProjects, onAddChildProjects, error, fluentProviderId } = useAddProjectDialog()

  const isNothingChosen = _.isEmpty(context.state.addProjectDialog?.selectedProjects)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme} className={styles.addProjectDialog}>
        <Dialog
          open={context.state.addProjectDialog?.open}
          onOpenChange={(_, data) => {
            if (!data.open) {
              context.dispatch(TOGGLE_ADD_PROJECT_DIALOG())
            }
          }}
        >
          <DialogSurface>
            {/* The title is a heading itself: a heading inside it nested one in another. */}
            <DialogTitle>{strings.ProgramAdministrationAddChildsButtonLabel}</DialogTitle>
            <DialogContent className={styles.content}>
              {error && (
                <UserMessage
                  intent='error'
                  title={strings.AddProjectsErrorTitle}
                  text={error.message}
                />
              )}
              <ProjectList
                title={strings.ProgramAdministrationAddChildsButtonLabel}
                items={availableProjects}
                selectedItems={context.state.addProjectDialog?.selectedProjects ?? []}
                onSelectionChange={(selectedItems) => {
                  context.dispatch(SET_SELECTED_TO_ADD(selectedItems as string[]))
                }}
                search={{
                  placeholder: strings.AddProjectDialogSearchBoxPlaceholder
                }}
                hideCommands
                scrollRows
                renderLinks={false}
                programHubs={context.programHubs}
              />
            </DialogContent>
            <DialogActions className={styles.actions}>
              <Button
                appearance='secondary'
                onClick={() => context.dispatch(TOGGLE_ADD_PROJECT_DIALOG())}
              >
                {strings.Cancel}
              </Button>
              <Button
                appearance='primary'
                // Focusable before a project is chosen, saying what it needs: a disabled button is
                // skipped by the keyboard (WCAG 2.1.1, 3.3.2).
                disabledFocusable={isNothingChosen}
                title={isNothingChosen ? strings.AddProjectsDisabledReason : undefined}
                onClick={onAddChildProjects}
              >
                {strings.Add}
              </Button>
            </DialogActions>
          </DialogSurface>
        </Dialog>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
