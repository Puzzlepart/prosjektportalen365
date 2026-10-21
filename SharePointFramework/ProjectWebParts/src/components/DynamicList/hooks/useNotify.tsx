import {
  Toast,
  ToastBody,
  ToastIntent,
  ToastTitle,
  useToastController
} from '@fluentui/react-components'
import * as React from 'react'
import { useCallback, useContext } from 'react'
import { DynamicListContext } from '../context'

/**
 * Tells in the web part's toaster what an action did, or why it failed: a toast is seen, and
 * read by a screen reader through its own live region (WCAG 4.1.3).
 *
 * @returns A function taking the toast's intent, title and an optional body
 */
export function useNotify(): (intent: ToastIntent, title: string, body?: string) => void {
  const context = useContext(DynamicListContext)
  const { dispatchToast } = useToastController(context.toasterId)
  return useCallback(
    (intent, title, body) =>
      dispatchToast(
        <Toast appearance='inverted'>
          <ToastTitle>{title}</ToastTitle>
          {body && <ToastBody>{body}</ToastBody>}
        </Toast>,
        { intent }
      ),
    [dispatchToast]
  )
}
