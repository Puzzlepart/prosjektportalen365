// The data adapter reaches SharePoint, so it is mocked before the dialog is imported.
jest.mock('data', () => ({
  SPDataAdapter: {
    getFolders: jest.fn(() => Promise.resolve([])),
    isFilenameValid: jest.fn(() => Promise.resolve(undefined)),
    sp: { web: { getFolderByServerRelativePath: jest.fn(() => ({ target: true })) } }
  }
}))

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import strings from 'ProjectExtensionsStrings'
import { SPDataAdapter } from 'data'
import { TemplateSelectorContext } from '../../extensions/templateSelector/context'
import { DocumentTemplateDialog } from './DocumentTemplateDialog'

/**
 * The dialog as a whole: the footer it owns, with each screen's buttons in the same place, and
 * the way through the screens from picking templates to the summary. The screens' own tests cover
 * what each lists; this one covers what the buttons do and when they are offered.
 */

/**
 * The dialog reads only these fields off `SPFolder` and `TemplateItem`, so stand-ins keep the test
 * away from the models' SharePoint dependencies. `update` is the model's, which takes the values
 * given and leaves a field alone for an empty one.
 */
function folder(name: string, overrides: Record<string, any> = {}) {
  return {
    id: name,
    name,
    url: `/sites/x/${name}`,
    folders: [] as any[],
    isLibrary: false,
    ...overrides
  }
}
function template(name: string, overrides: Record<string, any> = {}) {
  return {
    id: name,
    name,
    title: name,
    newName: name,
    newTitle: name,
    nameWithoutExtension: name.replace(/\.[^.]+$/, ''),
    fileExtension: 'docx',
    description: '',
    phase: '',
    modified: '',
    serverRelativeUrl: `/sites/x/Maler/${name}`,
    parentFolderUrl: '/sites/x/Maler',
    level: 1,
    isFolder: false,
    errorMessage: undefined as string,
    getFileTypeIconOptions: () => ({ extension: 'docx' }),
    update(properties: Record<string, string>) {
      Object.keys(properties).forEach((key) => {
        if (properties[key]) this[key] = properties[key]
      })
    },
    copyTo: jest.fn(() =>
      Promise.resolve({ Name: name, ServerRelativeUrl: `/sites/x/Dokumenter/${name}` })
    ),
    ...overrides
  }
}

const LIBRARY = folder('Dokumenter', {
  isLibrary: true,
  folders: [folder('Rapporter'), folder('Avtaler')]
})

function renderDialog({
  templates = [template('Mal A.docx'), template('Mal B.docx')],
  libraries = [LIBRARY]
} = {}) {
  const onDismiss = jest.fn()
  render(
    <TemplateSelectorContext.Provider
      value={{
        templates: templates as any,
        libraries: libraries as any,
        currentLibrary: LIBRARY as any,
        templateLibrary: { title: 'Maler', url: '/sites/x/Maler' },
        currentFolderUrl: ''
      }}
    >
      <DocumentTemplateDialog title='Hent dokumentmal' onDismiss={onDismiss} />
    </TemplateSelectorContext.Provider>
  )
  return { onDismiss, templates }
}

const dialog = () => screen.getByRole('dialog')
const button = (text: string) => within(dialog()).getByText(text).closest('button')
const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })
const isFilenameValid = SPDataAdapter.isFilenameValid as jest.Mock

/**
 * Ticks the first template and moves on to the folder screen.
 */
async function pickATemplate(user: ReturnType<typeof userEvent.setup>) {
  // The first checkbox selects all; the rest are one per row.
  await user.click(within(dialog()).getAllByRole('checkbox')[1])
  await waitFor(() => expect(button(strings.OnSubmitSelectionText)).toBeEnabled())
  await user.click(button(strings.OnSubmitSelectionText))
  await screen.findByText(strings.DocumentTemplateDialogScreenTargetFolderInfoTitle)
}

beforeEach(() => {
  isFilenameValid.mockReset()
  isFilenameValid.mockResolvedValue(undefined)
})

describe('DocumentTemplateDialog', () => {
  it('offers «Velg» once a template is ticked, and then the folder screen with its own buttons', async () => {
    const user = setupUser()
    renderDialog()
    expect(button(strings.OnSubmitSelectionText)).toBeDisabled()
    await pickATemplate(user)
    expect(button(strings.CopyHereText)).toBeEnabled()
    expect(button(strings.OnGoBackText)).toBeEnabled()
    expect(within(dialog()).queryByText(strings.OnSubmitSelectionText)).toBeNull()
  })

  it('goes back to the templates from the folder screen', async () => {
    const user = setupUser()
    renderDialog()
    await pickATemplate(user)
    await user.click(button(strings.OnGoBackText))
    expect(
      await screen.findByText(strings.DocumentTemplateDialogScreenSelectInfoTitle)
    ).toBeInTheDocument()
  })

  it('copies to the library root when nothing deeper is chosen, and moves on to the names', async () => {
    const user = setupUser()
    renderDialog()
    await pickATemplate(user)
    await user.click(button(strings.CopyHereText))
    expect(
      await screen.findByText(strings.DocumentTemplateDialogScreenEditCopyInfoTitle)
    ).toBeInTheDocument()
    // The names are checked against the target folder as soon as the screen opens.
    await waitFor(() =>
      expect(isFilenameValid).toHaveBeenCalledWith('/sites/x/Dokumenter', 'Mal A.docx', false)
    )
  })

  it('copies to the folder whose row is selected, without entering it', async () => {
    const user = setupUser()
    renderDialog()
    await pickATemplate(user)
    // The row, not the name: the name enters the folder.
    await user.click(within(dialog()).getByText('Rapporter').closest('[role=row]'))
    await user.click(button(strings.CopyHereText))
    await waitFor(() =>
      expect(isFilenameValid).toHaveBeenCalledWith('/sites/x/Rapporter', 'Mal A.docx', false)
    )
  })

  it('cannot copy to the list of libraries', async () => {
    const user = setupUser()
    renderDialog({ libraries: [LIBRARY, folder('Bilder', { isLibrary: true })] })
    await pickATemplate(user)
    await user.click(within(dialog()).getByRole('button', { name: strings.Library }))
    expect(await within(dialog()).findByText('Bilder')).toBeInTheDocument()
    expect(button(strings.CopyHereText)).toBeDisabled()
  })

  it('starts the copy only when every name is valid, and goes back to the folder from the names', async () => {
    const user = setupUser()
    isFilenameValid.mockResolvedValue('Filnavnet er ugyldig')
    renderDialog({ templates: [template('Mal A.docx')] })
    await pickATemplate(user)
    await user.click(button(strings.CopyHereText))
    expect(await within(dialog()).findByText('Filnavnet er ugyldig')).toBeInTheDocument()
    expect(button(strings.OnStartCopyText)).toBeDisabled()
    await user.click(button(strings.OnGoBackText))
    expect(
      await screen.findByText(strings.DocumentTemplateDialogScreenTargetFolderInfoTitle)
    ).toBeInTheDocument()
  })

  it('copies the templates to the target, and offers more templates or closing from the summary', async () => {
    const user = setupUser()
    const { onDismiss, templates } = renderDialog({ templates: [template('Mal A.docx')] })
    await pickATemplate(user)
    await user.click(button(strings.CopyHereText))
    await waitFor(() => expect(button(strings.OnStartCopyText)).toBeEnabled())
    await user.click(button(strings.OnStartCopyText))
    expect(await screen.findByText(strings.SummaryTitle)).toBeInTheDocument()
    expect(SPDataAdapter.sp.web.getFolderByServerRelativePath).toHaveBeenCalledWith(
      '/sites/x/Dokumenter'
    )
    expect(templates[0].copyTo).toHaveBeenCalledWith({ target: true })
    await user.click(button(strings.GetMoreText))
    expect(
      await screen.findByText(strings.DocumentTemplateDialogScreenSelectInfoTitle)
    ).toBeInTheDocument()
    expect(button(strings.OnSubmitSelectionText)).toBeDisabled()
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('closes from the summary asking the page to reload, since files were added', async () => {
    const user = setupUser()
    const { onDismiss } = renderDialog({ templates: [template('Mal A.docx')] })
    await pickATemplate(user)
    await user.click(button(strings.CopyHereText))
    await waitFor(() => expect(button(strings.OnStartCopyText)).toBeEnabled())
    await user.click(button(strings.OnStartCopyText))
    await screen.findByText(strings.SummaryTitle)
    await user.click(button(strings.CloseModalText))
    expect(onDismiss).toHaveBeenCalledWith({ reload: true })
  })
})
