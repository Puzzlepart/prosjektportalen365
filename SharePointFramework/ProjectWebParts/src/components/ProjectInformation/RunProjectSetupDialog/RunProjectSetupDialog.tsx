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
      console.error('Failed to save navigation nodes:', error)
    }
  }

  async function getNavigationNodes(): Promise<IMenuNode[]> {
    const menuState = await context.props.sp.navigation.getMenuState()
    return menuState.Nodes
  }

  const fluentProviderId = useId('fp-run-project-setup-dialog')

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <Dialog
          open={context.state.activeDialog === 'RunProjectSetupDialog'}
          onOpenChange={(_event, data) => {
            if (!data.open) context.dispatch(CLOSE_DIALOG())
          }}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>{strings.RunProjectSetupDialogTitle}</DialogTitle>
              <DialogContent>{strings.RunProjectSetupDialogSubText}</DialogContent>
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
                    onClick={async () => {
                      await saveNavigationNodes()
                      await applyCustomAction()
                    }}
                  >
                    {strings.ConfirmText}
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
