// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter reaches SharePoint: it hands out the target
// folder the templates are copied to. Usage statistics are the real ones, counting in the window's
// memory.
jest.mock('data', () => ({
  SPDataAdapter: {
    sp: { web: { getFolderByServerRelativePath: jest.fn(() => ({ target: true })) } }
  }
}))

import { act, render } from '@testing-library/react'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import * as React from 'react'
import { TemplateSelectorContext } from '../../extensions/templateSelector/context'
import { SELECTION_CHANGED } from './reducer'
import { DocumentTemplateDialogScreen } from './types'
import { useDocumentTemplateDialog } from './useDocumentTemplateDialog'

/**
 * What the dialog's copy counts for usage statistics: the copy once, however many templates it
 * took, and each template that could not be copied by its error's code. The dialog's own test
 * covers the way through its screens; here the hook is run on its own, under the command set's
 * alias as the command set renders the dialog.
 */

/** A template as the copy reads it: its name, its glyph and what copying it gives. */
function template(name: string, copyTo: () => Promise<unknown>) {
  return {
    id: name,
    newName: name,
    getFileTypeIconOptions: () => ({ extension: 'docx' }),
    copyTo: jest.fn(copyTo)
  }
}

/** A template that is copied to a file in the target folder. */
const copied = (name: string) =>
  template(name, () =>
    Promise.resolve({ Name: name, ServerRelativeUrl: `/sites/x/Dokumenter/${name}` })
  )

/** A template SharePoint refuses to copy, answering with `status`. */
const refused = (name: string, status: number) =>
  template(name, () => Promise.reject(Object.assign(new Error(`[${status}]`), { status })))

/** Renders the dialog's hook; `dialog.current` is what it returned last. */
function renderDialog() {
  const dialog: { current?: ReturnType<typeof useDocumentTemplateDialog> } = {}
  const onDismiss = jest.fn()
  const Probe: React.FC = () => {
    dialog.current = useDocumentTemplateDialog({ title: 'Hent dokumentmal', onDismiss })
    return null
  }
  render(
    <TelemetryProvider component='TemplateSelectorCommand'>
      <TemplateSelectorContext.Provider value={{}}>
        <Probe />
      </TemplateSelectorContext.Provider>
    </TelemetryProvider>
  )
  return dialog
}

/** Picks the templates and copies them, as the dialog's «Start kopiering» does. */
async function copy(dialog: ReturnType<typeof renderDialog>, templates: unknown[]) {
  act(() => dialog.current.dispatch(SELECTION_CHANGED({ selected: templates as any })))
  await act(() => dialog.current.onStartCopy())
}

beforeEach(() => startTestTelemetry())

describe('useDocumentTemplateDialog and usage statistics', () => {
  it('counts a copy once, however many templates it copies', async () => {
    const dialog = renderDialog()
    await copy(dialog, [copied('Mal A.docx'), copied('Mal B.docx'), copied('Mal C.docx')])
    expect(dialog.current.state.screen).toBe(DocumentTemplateDialogScreen.Summary)
    expect(dialog.current.state.uploaded).toHaveLength(3)
    expect(countedTelemetry()).toEqual({
      usage: { 'TemplateSelectorCommand documentTemplates.copied': 1 },
      errors: {},
      timings: {}
    })
  })

  it('counts the copy of a folder that holds no file, which adds no file', async () => {
    const dialog = renderDialog()
    await copy(dialog, [template('Tom mappe', () => Promise.resolve(null))])
    expect(dialog.current.state.uploaded).toEqual([])
    expect(countedTelemetry().usage).toEqual({
      'TemplateSelectorCommand documentTemplates.copied': 1
    })
  })

  it('counts a template that cannot be copied by its status, and the copy of the others once', async () => {
    const dialog = renderDialog()
    const templates = [copied('Mal A.docx'), refused('Mal B.docx', 403), copied('Mal C.docx')]
    await copy(dialog, templates)
    expect(templates.map(({ copyTo }) => copyTo.mock.calls.length)).toEqual([1, 1, 1])
    expect(dialog.current.state.uploaded).toHaveLength(2)
    expect(countedTelemetry()).toEqual({
      usage: { 'TemplateSelectorCommand documentTemplates.copied': 1 },
      errors: { 'TemplateSelectorCommand permission_denied 403': 1 },
      timings: {}
    })
  })

  it('counts no copy when every template fails, and each failure', async () => {
    const dialog = renderDialog()
    await copy(dialog, [refused('Mal A.docx', 403), refused('Mal B.docx', 403)])
    expect(dialog.current.state.screen).toBe(DocumentTemplateDialogScreen.Summary)
    expect(dialog.current.state.uploaded).toEqual([])
    expect(countedTelemetry()).toEqual({
      usage: {},
      errors: { 'TemplateSelectorCommand permission_denied 403': 2 },
      timings: {}
    })
  })
})
