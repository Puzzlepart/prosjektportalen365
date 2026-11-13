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
  useId
} from '@fluentui/react-components'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { customLightTheme } from '../../util'
import { ConfirmDialogResponseValue, IConfirmDialogProps, UseConfirmationDialog } from './types'

/**
 * Confirm an action with the user. Returns the dialog element to render and a
 * function that opens it and resolves with the response the user picked.
 *
 * Replaces `useConfirmationDialog` from `pzl-react-reusable-components`, which
 * was built on Fluent UI v8 and carried its own copies of React, Fluent v8 and
 * Fluent v9. The API is the same, so call sites only change their import.
 *
 * @example
 * const [confirmDialog, getResponse] = useConfirmationDialog()
 * const confirmed = await getResponse({
 *   title: strings.ConfirmDeleteTitle,
 *   subText: strings.ConfirmDeleteSubText,
 *   responses: [[strings.Delete, true, true], [strings.Cancel, false, false]]
 * })
 */
export function useConfirmationDialog(): UseConfirmationDialog {
  const fluentProviderId = useId('fp-confirm-dialog')
  const contentId = useId('confirm-dialog-content')
  const [state, setState] = useState<{
    props: IConfirmDialogProps
    resolve: (value: ConfirmDialogResponseValue) => void
  }>(null)

  const getResponse = useCallback(
    (props: IConfirmDialogProps) =>
      new Promise<ConfirmDialogResponseValue>((resolve) => {
        setState({ props, resolve })
      }),
    []
  )

  const respond = useCallback(
    (value: ConfirmDialogResponseValue) => {
      // Close first, so a caller that opens a second dialog from its `then`
      // does not race the closing animation of this one.
      setState(null)
      state?.resolve(value)
    },
    [state]
  )

  // The first answer whose value is falsy (`false`, `''`, none): the one that confirms nothing.
  const cancelIndex = (state?.props.responses ?? []).findIndex(([, value]) => !value)
  const cancelRef = useRef<HTMLButtonElement>(null)

  // The focus starts on the answer that does nothing («Avbryt»), not on the first, which
  // confirms («Slett»): Enter as the dialog opened deleted (WCAG 3.3.4). Fluent's dialog gives
  // its first control the focus as it opens, whatever `autoFocus` says, so the focus moves on in
  // the frame after.
  useEffect(() => {
    if (!state) return
    const frame = requestAnimationFrame(() => cancelRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [state])

  const element = (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <Dialog
          open={!!state}
          onOpenChange={(_, data) => {
            // Escape or a click outside counts as no answer, not as the first
            // response, which would otherwise confirm a destructive action.
            if (!data.open) respond(undefined)
          }}
        >
          {/* Described by its text, so a screen reader reads the question as the dialog opens,
              not only its title and the button that takes focus. */}
          <DialogSurface aria-describedby={contentId}>
            <DialogBody>
              {state?.props.title && <DialogTitle>{state.props.title}</DialogTitle>}
              <DialogContent id={contentId}>
                {state?.props.subText}
                {state?.props.children}
              </DialogContent>
              <DialogActions>
                {(state?.props.responses ?? []).map(([label, value, isPrimary], index) => (
                  <Button
                    key={index}
                    appearance={isPrimary ? 'primary' : 'secondary'}
                    onClick={() => respond(value)}
                    ref={index === cancelIndex ? cancelRef : undefined}
                  >
                    {label}
                  </Button>
                ))}
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </FluentProvider>
    </IdPrefixProvider>
  )

  return [element, getResponse]
}
