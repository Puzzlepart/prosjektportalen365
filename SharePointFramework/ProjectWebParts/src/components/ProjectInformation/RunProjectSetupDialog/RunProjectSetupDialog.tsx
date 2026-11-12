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
import { customLightTheme, format, parseErrorStack, UserMessage } from 'pp365-shared-library'
import { ListLogger } from 'pp365-shared-library/lib/logging'
import strings from 'ProjectWebPartsStrings'
import React, { FC, useState } from 'react'
import { useProjectInformationContext } from '../context'
import { ProjectInformation } from '../ProjectInformation'
import { CLOSE_DIALOG } from '../reducer'
import { saveNavigationNodes } from '../saveNavigationNodes'
import { createProjectSetupCustomAction } from './ProjectSetupCustomAction'

/** Saves navigation and restarts the project's setup wizard. */
export const RunProjectSetupDialog: FC = () => {
  const context = useProjectInformationContext()
  const [isLoading, setLoading] = useState(false)
  const [isMenuNotSaved, setMenuNotSaved] = useState(false)
  // Why the setup could not be started, from SharePoint's error ('' when it gives none); null
  // until then.
  const [startErrorText, setStartErrorText] = useState<string>(null)
  const isNotStarted = startErrorText !== null

  /**
   * Adds the setup's custom action, which runs the setup once the page is reloaded. When it cannot
   * be added, the failure is logged and the dialog says so, with SharePoint's reason, and can only
   * be closed.
   */
  async function applyCustomAction() {
    setLoading(true)
    const customAction = createProjectSetupCustomAction(strings.RunProjectSetupDialogProgressText)
    try {
      await context.props.sp.web.userCustomActions.add(customAction)
    } catch (error) {
      const message: string = error?.message ?? String(error ?? '')
      void ListLogger.log({
        message,
        level: 'Error',
        functionName: 'applyCustomAction',
        component: ProjectInformation.displayName
      })
      setStartErrorText(parseErrorStack(message) || message)
      setLoading(false)
      return
    }
    sessionStorage.setItem('pp_skipAlreadySetupCheck', 'true')
    location.reload()
  }

  /**
   * Saves the menu, so the setup can add back the links the template's menu does not have, then
   * starts the setup. The spinner shows from the click, so a second click or Cancel cannot start
   * or race it. When the menu cannot be saved, the dialog says so and lets the user choose.
   */
  async function saveMenuAndStartSetup() {
    setLoading(true)
    const isSaved = await saveNavigationNodes(
      context.props.sp,
      context.props.pageContext.web.absoluteUrl
    )
    if (isSaved) {
      await applyCustomAction()
    } else {
      setMenuNotSaved(true)
      setLoading(false)
    }
  }

  /**
   * Closes the dialog, unless the setup is being started, and forgets a failed save or start:
   * opened again, the dialog saves the menu and starts the setup anew.
   */
  function close() {
    if (isLoading) return
    setMenuNotSaved(false)
    setStartErrorText(null)
    context.dispatch(CLOSE_DIALOG())
  }

  const fluentProviderId = useId('fp-run-project-setup-dialog')

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <Dialog
          open={context.state.activeDialog === 'RunProjectSetupDialog'}
          onOpenChange={(_event, data) => {
            if (!data.open) close()
          }}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>{strings.RunProjectSetupDialogTitle}</DialogTitle>
              <DialogContent>
                {strings.RunProjectSetupDialogSubText}
                {isNotStarted ? (
                  // SharePoint's reason as plain text: the message's `text` renders HTML.
                  <UserMessage
                    intent='error'
                    title={strings.SetupNotStartedTitle}
                    text={strings.SetupNotStartedText}
                  >
                    {startErrorText && (
                      <p>{format(strings.SetupNotStartedErrorText, startErrorText)}</p>
                    )}
                  </UserMessage>
                ) : (
                  isMenuNotSaved && (
                    <UserMessage
                      intent='warning'
                      title={strings.SetupMenuNotSavedTitle}
                      text={strings.SetupMenuNotSavedText}
                    />
                  )
                )}
              </DialogContent>
              {isLoading ? (
                <DialogActions>
                  <Spinner size='medium' label={strings.PleaseWaitText} />
                </DialogActions>
              ) : isNotStarted ? (
                <DialogActions>
                  {/* The focus the spinner dropped goes to Close, the only action left. */}
                  <Button appearance='primary' onClick={close} autoFocus>
                    {strings.CloseText}
                  </Button>
                </DialogActions>
              ) : (
                <DialogActions>
                  {/* After a failed save, the focus the spinner dropped goes to Cancel. */}
                  <Button onClick={close} autoFocus={isMenuNotSaved}>
                    {strings.CancelText}
                  </Button>
                  {isMenuNotSaved ? (
                    <Button appearance='primary' onClick={applyCustomAction}>
                      {strings.ContinueAnywayText}
                    </Button>
                  ) : (
                    <Button appearance='primary' onClick={saveMenuAndStartSetup}>
                      {strings.ConfirmText}
                    </Button>
                  )}
                </DialogActions>
              )}
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
