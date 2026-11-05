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
import strings from 'ProjectWebPartsStrings'
import React, { FC, useState } from 'react'
import { useProjectInformationContext } from '../context'
import { CLOSE_DIALOG } from '../reducer'
import { saveNavigationNodes } from '../saveNavigationNodes'
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
                  <Spinner size='medium' label={strings.PleaseWaitText} />
                </DialogActions>
              ) : (
                <DialogActions>
                  <Button onClick={() => context.dispatch(CLOSE_DIALOG())}>
                    {strings.CancelText}
                  </Button>
                  <Button
                    appearance='primary'
                    onClick={async () => {
                      // Saved before the reload: the setup adds back the links the parent
                      // template's menu does not have.
                      await saveNavigationNodes(
                        context.props.sp,
                        context.props.pageContext.web.absoluteUrl
                      )
                      await applyCustomAction()
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
