import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import * as strings from 'ProjectExtensionsStrings'
import { TemplateSelectorContext } from '../../../extensions/templateSelector/context'
import { DocumentTemplateDialogContext } from '../context'
import { SELECTION_CHANGED } from '../reducer'
import { SelectScreen } from './index'

/**
 * The screen where the user picks templates: the template library's top level, folders first and
 * sorted, navigation into folders, and a selection that the dialog keeps as the templates to copy.
 * Asserted through text, roles and the dispatched selection, so it holds whichever list renders the
 * rows and whichever selection model carries the choice.
 */

/**
 * The screen reads only these fields off `TemplateItem`, so a stand-in keeps the test away from the
 * model's SharePoint dependencies.
 */
function template(name: string, overrides: Record<string, any> = {}) {
  return {
    id: name,
    name,
    title: name,
    description: '',
    phase: '',
    modified: '',
    serverRelativeUrl: `/sites/x/Maler/${name}`,
    parentFolderUrl: '/sites/x/Maler',
    level: 1,
    isFolder: false,
    getFileTypeIconOptions: () => ({ extension: 'docx' }),
    ...overrides
  }
}

function renderScreen(templates: any[]) {
  const dispatch = jest.fn()
  render(
    <TemplateSelectorContext.Provider
      value={{ templates, templateLibrary: { title: 'Maler', url: '/sites/x/Maler' } }}
    >
      <DocumentTemplateDialogContext.Provider value={{ state: { selected: [] } as any, dispatch }}>
        <SelectScreen />
      </DocumentTemplateDialogContext.Provider>
    </TemplateSelectorContext.Provider>
  )
  /**
   * Names of the templates the last selection change reported.
   */
  const selectedNames = () => {
    const calls = dispatch.mock.calls.filter(([action]) => action.type === SELECTION_CHANGED.type)
    if (calls.length === 0) return []
    const payload = calls[calls.length - 1][0].payload
    return payload.selected.map((item: any) => item.name)
  }
  return { dispatch, selectedNames }
}

/**
 * The template names in the order the rows show them.
 */
const rowNames = (names: string[]) => {
  const rows = screen.getAllByRole('row').slice(1)
  return rows.map((row) => names.find((name) => row.textContent.includes(name)))
}

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

describe('SelectScreen', () => {
  it('explains what the screen is for', () => {
    renderScreen([template('Mal A.docx')])
    expect(
      screen.getByText(strings.DocumentTemplateDialogScreenSelectInfoTitle)
    ).toBeInTheDocument()
  })

  it('lists the top level with folders first, then templates, each sorted by name', () => {
    renderScreen([
      template('Mal B.docx'),
      template('Rapporter', { isFolder: true }),
      template('Mal A.docx'),
      template('Avtaler', { isFolder: true })
    ])
    expect(rowNames(['Avtaler', 'Rapporter', 'Mal A.docx', 'Mal B.docx'])).toEqual([
      'Avtaler',
      'Rapporter',
      'Mal A.docx',
      'Mal B.docx'
    ])
  })

  it('opens a folder and lists the templates in it', async () => {
    const user = setupUser()
    renderScreen([
      template('Rapporter', { isFolder: true, serverRelativeUrl: '/sites/x/Maler/Rapporter' }),
      template('Årsrapport.docx', { level: 2, parentFolderUrl: '/sites/x/Maler/Rapporter' })
    ])
    expect(screen.queryByText('Årsrapport.docx')).toBeNull()
    await user.click(screen.getByText('Rapporter'))
    expect(await screen.findByText('Årsrapport.docx')).toBeInTheDocument()
  })

  it('reports the templates the user selects', async () => {
    const user = setupUser()
    const { selectedNames } = renderScreen([template('Mal A.docx'), template('Mal B.docx')])
    // The first checkbox selects all; the rest are one per row, in row order.
    await user.click(screen.getAllByRole('checkbox')[2])
    await waitFor(() => expect(selectedNames()).toEqual(['Mal B.docx']))
  })
})
