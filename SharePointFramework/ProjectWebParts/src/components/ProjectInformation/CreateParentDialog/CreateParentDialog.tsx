import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  FluentProvider,
  IdPrefixProvider,
  Spinner,
  useId
} from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'
import { IMenuNode } from '@pnp/sp/navigation'
import strings from 'ProjectWebPartsStrings'
import React, { FC, useState } from 'react'
import { useProjectInformationContext } from '../context'
import { CLOSE_DIALOG } from '../reducer'
import { createProjectSetupCustomAction } from './ProjectSetupCustomAction'

export const CreateParentDialog: FC = () => {
  const context = useProjectInformationContext()
  const [isLoading, setLoading] = useState(false)

  async function applyCustomAction() {
    setLoading(true)
    const lcid = context.props.pageContext.web.language
    const customAction = createProjectSetupCustomAction(strings.CreateParentSetupProgressText, lcid)
    await context.props.sp.web.userCustomActions.add(customAction)
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

  const fluentProviderId = useId('fp-create-parent-dialog')

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <Dialog
          open={context.state.activeDialog === 'CreateParentDialog'}
          onOpenChange={(_event, data) => {
            if (!data.open) context.dispatch(CLOSE_DIALOG())
          }}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>{strings.CreateParentModalTitle}</DialogTitle>
              <DialogContent>{strings.CreateParentModalSubText}</DialogContent>
              {isLoading ? (
                <DialogActions>
                  <Spinner size='medium' />
                </DialogActions>
              ) : (
                <DialogActions>
                  <Button onClick={() => context.dispatch(CLOSE_DIALOG())}>
                    {strings.CancelText}
                  </Button>
                  <Button
                    appearance='primary'
                    onClick={() => {
                      void saveNavigationNodes()
                      void applyCustomAction()
                    }}
                  >
                    {strings.RedoText}
                  </Button>
                </DialogActions>
              )}
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
