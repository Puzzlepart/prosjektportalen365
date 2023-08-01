import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton,
  Spinner,
  SpinnerSize
} from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC, useContext, useState } from 'react'
import { ProjectInformationContext } from '../context'
import { ProjectSetupCustomAction } from './ProjectSetupCustomAction'
import { IMenuNode } from '@pnp/sp/navigation'

export const CreateParentDialog: FC = () => {
  const context = useContext(ProjectInformationContext)
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
      // TODO: v3 of @pnp/sp does not support getMenuState()
      // const menuState = await context.props.sp.web.navigation.getMenuState()
      // return menuState.Nodes
      return await Promise.resolve([])
    } catch (error) {
      throw error
    }
  }

  return (
    <Dialog
      hidden={!context.state.displayCreateParentDialog}
      onDismiss={() => context.setState({ displayCreateParentDialog: false })}
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
            onClick={() => context.setState({ displayCreateParentDialog: false })}
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
