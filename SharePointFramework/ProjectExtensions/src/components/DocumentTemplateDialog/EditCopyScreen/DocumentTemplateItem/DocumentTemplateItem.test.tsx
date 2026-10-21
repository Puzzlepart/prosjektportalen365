// The data adapter reaches SharePoint, so it is mocked before the component is
// imported; see .development-guide/spfx/testing.md on mock ordering.
jest.mock('data', () => ({
  SPDataAdapter: { isFilenameValid: jest.fn().mockResolvedValue(undefined) }
}))

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import * as React from 'react'
import { SPDataAdapter } from 'data'
import { DocumentTemplateDialogContext } from 'components/DocumentTemplateDialog/context'
import { DocumentTemplateItem } from './index'
import { IDocumentTemplateItemProps } from './types'

/**
 * The component reads only these fields off `TemplateItem`, so a stand-in keeps
 * the test away from the model's SharePoint dependencies.
 */
function createItem(overrides: Record<string, any> = {}) {
  return {
    id: 'item-1',
    name: 'Prosjektplan.docx',
    nameWithoutExtension: 'Prosjektplan',
    fileExtension: 'docx',
    title: 'Prosjektplan',
    isFolder: false,
    errorMessage: undefined as string,
    getFileTypeIconOptions: () => ({ extension: 'docx' }),
    ...overrides
  }
}

function renderItem(props: Partial<IDocumentTemplateItemProps> = {}) {
  const onInputChanged = jest.fn()
  const item = (props.item as any) ?? createItem()
  const user = userEvent.setup()
  render(
    <DocumentTemplateDialogContext.Provider
      value={{
        state: { targetFolder: { ServerRelativeUrl: '/sites/x/Delte dokumenter' } } as any,
        dispatch: jest.fn()
      }}
    >
      <DocumentTemplateItem item={item as any} onInputChanged={onInputChanged} />
    </DocumentTemplateDialogContext.Provider>
  )
  return { onInputChanged, user, item }
}

/** Opens the collapsed body, which is where the two fields live. */
async function expand(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByText(name))
}

describe('DocumentTemplateItem', () => {
  beforeEach(() => {
    ;(SPDataAdapter.isFilenameValid as jest.Mock).mockResolvedValue(undefined)
  })

  it('shows the file name and keeps the fields collapsed until the header is clicked', async () => {
    const { user } = renderItem()
    expect(screen.getByText('Prosjektplan.docx')).toBeVisible()
    expect(screen.getByLabelText('Filnavn')).not.toBeVisible()
    await expand(user, 'Prosjektplan.docx')
    expect(screen.getByLabelText('Filnavn')).toBeVisible()
    expect(screen.getByLabelText('Tittel')).toBeVisible()
  })

  it('labels the name field "Mappenavn" for a folder', async () => {
    const { user } = renderItem({ item: createItem({ isFolder: true, name: 'Vedlegg' }) as any })
    await expand(user, 'Vedlegg')
    expect(screen.getByLabelText('Mappenavn')).toBeVisible()
  })

  it('reports a new file name with its extension restored', async () => {
    const { user, onInputChanged } = renderItem()
    await expand(user, 'Prosjektplan.docx')
    const name = screen.getByLabelText('Filnavn')
    await user.clear(name)
    await user.type(name, 'Sluttrapport')
    await waitFor(() =>
      expect(onInputChanged).toHaveBeenCalledWith(
        'item-1',
        { newName: 'Sluttrapport.docx' },
        undefined
      )
    )
  })

  it('reports a new folder name without an extension', async () => {
    const { user, onInputChanged } = renderItem({
      item: createItem({ isFolder: true, name: 'Vedlegg' }) as any
    })
    await expand(user, 'Vedlegg')
    const name = screen.getByLabelText('Mappenavn')
    await user.clear(name)
    await user.type(name, 'Bilag')
    await waitFor(() =>
      expect(onInputChanged).toHaveBeenCalledWith('item-1', { newName: 'Bilag' }, undefined)
    )
  })

  it('reports a new title, and never confuses it with the name field', async () => {
    const { user, onInputChanged } = renderItem()
    await expand(user, 'Prosjektplan.docx')
    const title = screen.getByLabelText('Tittel')
    await user.clear(title)
    await user.type(title, 'Endelig rapport')
    await waitFor(() =>
      expect(onInputChanged).toHaveBeenCalledWith('item-1', { newTitle: 'Endelig rapport' })
    )
    // Each field has its own handler, so a title edit must never be reported as a name change.
    expect(onInputChanged).not.toHaveBeenCalledWith(
      'item-1',
      expect.objectContaining({ newName: expect.anything() }),
      expect.anything()
    )
  })

  it('passes the validation error from the adapter through to the caller', async () => {
    ;(SPDataAdapter.isFilenameValid as jest.Mock).mockResolvedValue('Filnavnet er ugyldig')
    const { user, onInputChanged } = renderItem()
    await expand(user, 'Prosjektplan.docx')
    const name = screen.getByLabelText('Filnavn')
    await user.clear(name)
    await user.type(name, 'Ugyldig?navn')
    await waitFor(() =>
      expect(onInputChanged).toHaveBeenCalledWith(
        'item-1',
        { newName: 'Ugyldig?navn.docx' },
        'Filnavnet er ugyldig'
      )
    )
  })

  it('focuses each field from its label (WCAG 1.3.1, 3.3.2)', async () => {
    // A control with an id of its own is named by the field through aria-labelledby, and a click
    // on the label then reaches nothing; the field's own id ties the label to the control.
    const { user } = renderItem()
    await expand(user, 'Prosjektplan.docx')
    await user.click(screen.getByText('Filnavn', { selector: 'label' }))
    expect(screen.getByLabelText('Filnavn')).toHaveFocus()
    await user.click(screen.getByText('Tittel', { selector: 'label' }))
    expect(screen.getByLabelText('Tittel')).toHaveFocus()
  })

  it('opens the fields from a button that says whether they are shown, and breaks no rule axe can check (WCAG 2.1.1, 4.1.2)', async () => {
    const { user } = renderItem()
    const header = screen.getByRole('button', { name: 'Prosjektplan.docx' })
    expect(header).toHaveAttribute('aria-expanded', 'false')
    await user.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'true')
    expect(document.getElementById(header.getAttribute('aria-controls'))).toContainElement(
      screen.getByLabelText('Filnavn')
    )
    expect(await axeComponent(header.parentElement)).toHaveNoViolations()
  })
})
