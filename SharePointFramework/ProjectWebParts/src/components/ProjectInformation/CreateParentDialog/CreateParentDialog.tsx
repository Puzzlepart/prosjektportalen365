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
import { ProjectSetupCustomAction } from './ProjectSetupCustomAction'

export const CreateParentDialog: FC = () => {
  const context = useProjectInformationContext()
  const [isLoading, setLoading] = useState(false)

  async function applyCustomAction() {
    setLoading(true)
    await context.props.sp.web.userCustomActions.add(ProjectSetupCustomAction)
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
      throw error
    }
  }

  async function getNavigationNodes(): Promise<IMenuNode[]> {
    try {
      const menuState = await context.props.sp.navigation.getMenuState()
      return menuState.Nodes
    } catch (error) {
      throw error
    }
  }

  return (
    <Dialog
      hidden={context.state.activeDialog !== 'CreateParentDialog'}
      onDismiss={() => context.dispatch(CLOSE_DIALOG())}
      dialogContentProps={{
        type: DialogType.largeHeader,
        title: strings.CreateParentModalTitle,
        subText: strings.CreateParentModalSubText
      }}
    >
      {!isLoading && (
        <DialogFooter>
          <DefaultButton
            text={strings.CancelText}
            onClick={() => context.dispatch(CLOSE_DIALOG())}
          />
          <PrimaryButton
            text={strings.RedoText}
            onClick={() => {
              saveNavigationNodes()
              applyCustomAction()
            }}
          />
        </DialogFooter>
      )}
      {isLoading && <Spinner size={SpinnerSize.medium} />}
    </Dialog>
  )
}
