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
import { DynamicListContext } from '../context'
import { ICustomAction } from '../types'
import { getSelectedItems, buildCustomActionPayload, isCorsError } from '../utils/listOperationUtils'
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

/**
 * Custom hook for handling Dialog-type custom actions with polling support.
 *
 * Manages dialog state, sends selected item data to server, polls for results,
 * and displays iframe content with loading indicators.
 *
 * @returns Dialog component, open/close handlers, and toaster component
 */
export function useCustomActionDialog() {
  const context = useContext(DynamicListContext)
  const toasterId = useId('custom-action-toaster')
  const fluentProviderId = useId('fp-custom-action-dialog')
  const { dispatchToast } = useToastController(toasterId)

  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    iframeContent: '',
    actionName: '',
    isLoading: false,
    isSending: false,
    isPolling: false,
    error: null
  })

  /**
   * Polls the server for iframe content at regular intervals.
   *
   * Attempts up to 30 times with 2-second intervals. Handles three response statuses:
   * - 'completed': Updates dialog with iframe content and shows success toast
   * - 'processing': Continues polling until max attempts reached
   * - 'failed': Throws error with server message
   *
   * @param pollUrl URL endpoint to poll for processing results
   * @param actionName Name of the action being executed, used in notifications
   * @param payload Request payload to send with each poll request
   */
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
            throw new Error(`HTTP error! status: ${response.status}`)
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

      poll()
    },
    [dispatchToast]
  )

  /**
   * Opens dialog and executes a Dialog-type custom action.
   *
   * Workflow:
   * 1. Validates hookUrl configuration
   * 2. Opens dialog with loading indicators
   * 3. Sends POST request with selected items data to hookUrl
   * 4. Handles two response patterns:
   *    - Immediate: Returns iframe content directly in response
   *    - Async: Returns pollUrl and initiates polling for results
   * 5. Displays iframe content or error messages accordingly
   *
   * @param action Custom action configuration containing hookUrl and action metadata
   */
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
          throw new Error(`HTTP error! status: ${response.status}`)
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
    [context.state, context.props, pollForIframeContent, dispatchToast]
  )

  /**
   * Closes the dialog and resets all state to initial values.
   */
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
                    <Spinner size='large' />
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
