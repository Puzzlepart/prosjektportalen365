import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton,
  Spinner,
  SpinnerSize
} from '@fluentui/react'
import { IMenuNode } from '@pnp/sp/navigation'
import strings from 'ProjectWebPartsStrings'
import React, { FC, useState } from 'react'
import { useProjectInformationContext } from '../context'
import { CLOSE_DIALOG } from '../reducer'
import { createProjectSetupCustomAction } from './ProjectSetupCustomAction'

export const RunProjectSetupDialog: FC = () => {
  const context = useProjectInformationContext()
  const [isLoading, setLoading] = useState(false)

  async function applyCustomAction() {
    setLoading(true)
    const lcid = context.props.pageContext.web.language
    const customAction = createProjectSetupCustomAction(
      strings.RunProjectSetupDialogProgressText,
      lcid
    )
    await context.props.sp.web.userCustomActions.add(customAction)
    sessionStorage.setItem('pp_skipAlreadySetupCheck', 'true')
    location.reload()
  }

  /**
   * Fetches current navigation nodes and stores it in local storage.
   * The nodes are used to create new nodes in the navigation menu
   * after the template is applied.
   */
  async function saveNavigationNodes() {
    try {
      const nodes = await getNavigationNodes()
      localStorage.setItem('pp_navigationNodes', JSON.stringify(nodes))
    } catch (error) {
      // Log error but don't block the flow - navigation nodes are nice-to-have
      console.error('Failed to save navigation nodes:', error)
    }
  }

  async function getNavigationNodes(): Promise<IMenuNode[]> {
    const menuState = await context.props.sp.navigation.getMenuState()
    return menuState.Nodes
  }

  return (
    <Dialog
      hidden={context.state.activeDialog !== 'RunProjectSetupDialog'}
      onDismiss={() => context.dispatch(CLOSE_DIALOG())}
      dialogContentProps={{
        type: DialogType.largeHeader,
        title: strings.RunProjectSetupDialogTitle,
        subText: strings.RunProjectSetupDialogSubText
      }}
    >
      {!isLoading && (
        <DialogFooter>
          <DefaultButton
            text={strings.CancelText}
            onClick={() => context.dispatch(CLOSE_DIALOG())}
          />
          <PrimaryButton
            text={strings.ConfirmText}
            onClick={async () => {
              await saveNavigationNodes()
              await applyCustomAction()
            }}
          />
        </DialogFooter>
      )}
      {isLoading && <Spinner size={SpinnerSize.medium} />}
    </Dialog>
  )
}
