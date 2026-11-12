import { useState, useCallback, useContext } from 'react'
import * as React from 'react'
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogActions,
  Button,
  useToastController,
  useId,
  Toast,
  ToastTitle,
  ToastBody,
  FluentProvider,
  IdPrefixProvider,
  DialogTitle,
  DialogContent,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle
} from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { DynamicListContext } from '../context'
import { ICustomAction } from '../types'
import {
  getSelectedItems,
  buildCustomActionPayload,
  isCorsError
} from '../utils/listOperationUtils'
import * as strings from 'ProjectWebPartsStrings'

interface DialogState {
  isOpen: boolean
  iframeContent: string
  actionName: string
  isLoading: boolean
  isSending: boolean
  isPolling: boolean
  error: string | null
}

/** Posts selected items to a custom action and displays its immediate or polled iframe result. */
export function useCustomActionDialog() {
  const context = useContext(DynamicListContext)
  const toasterId = useId('custom-action-toaster')
  const fluentProviderId = useId('fp-custom-action-dialog')
  const { dispatchToast } = useToastController(toasterId)
  // A custom action that fails is counted once for usage statistics, by its error code.
  const telemetry = useTelemetry()

  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    iframeContent: '',
    actionName: '',
    isLoading: false,
    isSending: false,
    isPolling: false,
    error: null
  })

  /** Polls for an iframe result, stopping on completion, failure or the retry limit. */
  const pollForIframeContent = useCallback(
    async (pollUrl: string, actionName: string, payload: any) => {
      const maxAttempts = 30
      const pollInterval = 2000
      let attempts = 0

      const poll = async () => {
        try {
          attempts++

          const response = await fetch(pollUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          })

          if (!response.ok) {
            // The status goes on the error too, so usage statistics count the failure by it.
            throw Object.assign(new Error(`HTTP error! status: ${response.status}`), {
              status: response.status
            })
          }

          const result = await response.json()

          const content = result.iframeContent || result.html
          if (result.status === 'completed' && content) {
            setDialogState((prev) => ({
              ...prev,
              isLoading: false,
              isPolling: false,
              iframeContent: content
            }))

            dispatchToast(
              <Toast appearance='inverted'>
                <ToastTitle>{actionName}</ToastTitle>
                <ToastBody>{strings.DynamicList.ContentLoadedSuccessfully}</ToastBody>
              </Toast>,
              { intent: 'success' }
            )

            return true
          } else if (result.status === 'failed') {
            throw new Error(result.message || strings.DynamicList.ProcessingFailed)
          } else if (result.status === 'processing') {
            if (attempts < maxAttempts) {
              setTimeout(poll, pollInterval)
            } else {
              throw new Error(strings.DynamicList.TimeoutError)
            }
          }
        } catch (error) {
          telemetry.trackError(error)
          console.error('Error polling for iframe content:', error)
          const errorMessage = isCorsError(error)
            ? strings.DynamicList.CorsError
            : strings.DynamicList.CouldNotFetchContent.replace('{0}', error.message)

          setDialogState((prev) => ({
            ...prev,
            isLoading: false,
            isPolling: false,
            error: strings.DynamicList.PollingFailed.replace('{0}', errorMessage)
          }))

          dispatchToast(
            <Toast appearance='inverted'>
              <ToastTitle>{strings.DynamicList.FetchError}</ToastTitle>
              <ToastBody>{errorMessage}</ToastBody>
            </Toast>,
            { intent: 'error' }
          )
        }
      }

      void poll()
    },
    [dispatchToast, telemetry]
  )

  /** Opens a custom action and handles either an immediate iframe result or a polling URL. */
  const openDialog = useCallback(
    async (action: ICustomAction) => {
      if (!action.hookUrl) {
        dispatchToast(
          <Toast appearance='inverted'>
            <ToastTitle>{strings.DynamicList.ConfigurationError}</ToastTitle>
            <ToastBody>{strings.DynamicList.HookUrlNotConfigured}</ToastBody>
          </Toast>,
          { intent: 'error' }
        )
        return
      }

      setDialogState({
        isOpen: true,
        iframeContent: '',
        actionName: action.name,
        isLoading: true,
        isSending: true,
        isPolling: false,
        error: null
      })

      const selected = getSelectedItems(context)

      if (selected.length === 0) {
        setDialogState((prev) => ({
          ...prev,
          isLoading: false,
          isSending: false,
          error: strings.DynamicList.NoItemsSelectedError
        }))
        return
      }

      try {
        const payload = buildCustomActionPayload(context, action.name, selected)

        const response = await fetch(action.hookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          // The status goes on the error too, so usage statistics count the failure by it.
          throw Object.assign(new Error(`HTTP error! status: ${response.status}`), {
            status: response.status
          })
        }

        const result = await response.json()

        setDialogState((prev) => ({
          ...prev,
          isSending: false,
          isPolling: true
        }))

        const content = result.iframeContent || result.html
        if (result.pollUrl) {
          await pollForIframeContent(result.pollUrl, action.name, payload)
        } else if (content) {
          setDialogState((prev) => ({
            ...prev,
            isLoading: false,
            isPolling: false,
            iframeContent: content
          }))
        } else {
          throw new Error(strings.DynamicList.NoIframeContent)
        }
      } catch (error) {
        telemetry.trackError(error)
        console.error('Error executing dialog action:', error)
        const errorMessage = isCorsError(error)
          ? strings.DynamicList.CorsError
          : strings.DynamicList.ExecutionError.replace('{0}', error.message)

        setDialogState((prev) => ({
          ...prev,
          isLoading: false,
          isSending: false,
          isPolling: false,
          error: errorMessage
        }))

        dispatchToast(
          <Toast appearance='inverted'>
            <ToastTitle>{strings.DynamicList.ActionFailed}</ToastTitle>
            <ToastBody>{errorMessage}</ToastBody>
          </Toast>,
          { intent: 'error' }
        )
      }
    },
    [context.state, context.props, pollForIframeContent, dispatchToast, telemetry]
  )

  /** Closes the custom action dialog and clears its result and error state. */
  const closeDialog = useCallback(() => {
    setDialogState({
      isOpen: false,
      iframeContent: '',
      actionName: '',
      isLoading: false,
      isSending: false,
      isPolling: false,
      error: null
    })
  }, [])

  const dialogComponent = dialogState.isOpen ? (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <Dialog open={dialogState.isOpen} onOpenChange={(_, data) => !data.open && closeDialog()}>
          <DialogSurface style={{ maxWidth: '90vw', width: '900px', maxHeight: '90vh' }}>
            <DialogBody>
              <DialogTitle>{dialogState.actionName}</DialogTitle>
              <DialogContent style={{ marginBottom: '16px' }}>
                {dialogState.error && (
                  <MessageBar intent='error' style={{ marginBottom: '16px' }}>
                    <MessageBarBody>
                      <MessageBarTitle>{strings.DynamicList.Error}</MessageBarTitle>
                      {dialogState.error}
                    </MessageBarBody>
                  </MessageBar>
                )}

                {dialogState.isLoading && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '32px'
                    }}
                  >
                    <Spinner size='large' aria-label={strings.DynamicList.PleaseWait} />
                    {dialogState.isSending && (
                      <MessageBar intent='info'>
                        <MessageBarBody>{strings.DynamicList.SendingData}</MessageBarBody>
                      </MessageBar>
                    )}
                    {dialogState.isPolling && (
                      <MessageBar intent='info'>
                        <MessageBarBody>{strings.DynamicList.FetchingContent}</MessageBarBody>
                      </MessageBar>
                    )}
                  </div>
                )}

                {!dialogState.isLoading && dialogState.iframeContent && !dialogState.error && (
                  <div
                    style={{ minHeight: 'fit-content' }}
                    dangerouslySetInnerHTML={{ __html: dialogState.iframeContent }}
                  />
                )}
              </DialogContent>
            </DialogBody>
            <DialogActions>
              <Button appearance='secondary' onClick={closeDialog}>
                {dialogState.isLoading ? strings.DynamicList.Cancel : strings.DynamicList.Close}
              </Button>
            </DialogActions>
          </DialogSurface>
        </Dialog>
      </FluentProvider>
    </IdPrefixProvider>
  ) : null

  return {
    openDialog,
    closeDialog,
    dialogComponent,
    toasterId
  }
}
