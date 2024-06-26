import { format } from '@fluentui/react'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Label
} from '@fluentui/react-components'
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

export const ChangePhaseDialog: FC = () => {
  const context = useContext(ProjectPhasesContext)
  const { state, dispatch, nextChecklistItem } = useChangePhaseDialog()
  if (!context.state.confirmPhase) return null

  return (
    <ChangePhaseDialogContext.Provider value={{ state, dispatch, nextChecklistItem }}>
      <Dialog open>
        <DialogSurface>
          <DialogBody className={styles.changePhaseDialog}>
            <DialogTitle>
              {format(strings.ChangePhaseDialogTitle, context.state.confirmPhase.name)}
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Label weight='semibold'>
                {context.state.phase
                  ? format(
                      strings.ChangePhaseDialogSubtitle,
                      context.state.phase?.name,
                      context.state.confirmPhase.name
                    )
                  : format(strings.ChangeFirstPhaseDialogSubtitle, context.state.confirmPhase.name)}
              </Label>
              {state.view === View.Confirm &&
                format(strings.ConfirmChangePhase, context.state.confirmPhase.name)}
              {state.view === View.Confirm &&
                context.props.useDynamicHomepage &&
                context.props.showPhaseSitePageMessage && <DynamicHomepageContent />}
              <Content />
            </DialogContent>
            <Actions />
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </ChangePhaseDialogContext.Provider>
  )
}
