import React, { FunctionComponent, useState } from 'react'
import {
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  Spinner,
  SpinnerSize
} from 'office-ui-fabric-react'
import { sp, MenuNode } from '@pnp/sp'
import { ParentModalProps } from './types'
import { ProjectSetupCustomAction } from './types'

export const CreateParentModal: FunctionComponent<ParentModalProps> = ({ isOpen, onDismiss }) => {
  const [isLoading, setLoading] = useState(false)

  async function applyCustomAction() {
    setLoading(true)
    await sp.web.userCustomActions.add(ProjectSetupCustomAction)
    location.reload()
  }

  return (
    <>
      <Dialog
        hidden={!isOpen}
        onDismiss={onDismiss}
        dialogContentProps={{
          type: DialogType.largeHeader,
          title: 'Overordnet område',
          subText:
            'Ønsker du å gjøre om området til et overordnet område? Denne handlingen er ikke reversibel.'
        }}>
        {!isLoading && (
          <DialogFooter>
            <PrimaryButton
              text='Gjør om'
              onClick={() => {
                saveNavigationNodes()
                applyCustomAction()
              }}
            />
            <DefaultButton text='Avbryt' onClick={() => onDismiss()} />
          </DialogFooter>
        )}
        {isLoading && <Spinner size={SpinnerSize.medium} />}
      </Dialog>
    </>
  )
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

async function getNavigationNodes(): Promise<MenuNode[]> {
  try {
    const menuState = await sp.navigation.getMenuState()
    return menuState.Nodes
  } catch (error) {
    throw error
  }
}
