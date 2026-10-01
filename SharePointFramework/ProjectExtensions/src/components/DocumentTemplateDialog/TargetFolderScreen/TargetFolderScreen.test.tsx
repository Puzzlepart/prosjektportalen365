// The data adapter reaches SharePoint, so it is mocked before the component is imported.
jest.mock('data', () => ({
  SPDataAdapter: { getFolders: jest.fn() }
}))

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import * as strings from 'ProjectExtensionsStrings'
import { SPDataAdapter } from 'data'
import { TemplateSelectorContext } from '../../../extensions/templateSelector/context'
import { DocumentTemplateDialogContext } from '../context'
import { SET_SCREEN, SET_TARGET } from '../reducer'
import { DocumentTemplateDialogScreen } from '../types'
import { TargetFolderScreen } from './index'

/**
 * The screen where the user picks where the copied templates go: the current library's folders,
 * navigation into them, and the buttons that confirm or go back. Asserted through text, roles and
 * the actions it dispatches, so it holds whichever Fluent UI list renders the folders.
 */

/**
 * The screen reads only these fields off `SPFolder`, so a stand-in keeps the test away from the
 * model's SharePoint dependencies.
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

function renderScreen({
  libraries = [] as any[],
  currentLibrary = folder('Dokumenter', { isLibrary: true }),
  targetFolder = undefined as string
} = {}) {
  const dispatch = jest.fn()
  const getFolders = SPDataAdapter.getFolders as jest.Mock
  getFolders.mockReset()
  render(
    <TemplateSelectorContext.Provider
      value={{
        currentLibrary: currentLibrary as any,
        libraries: [currentLibrary, ...libraries] as any,
        currentFolderUrl: ''
      }}
    >
      <DocumentTemplateDialogContext.Provider value={{ state: { targetFolder } as any, dispatch }}>
        <TargetFolderScreen />
      </DocumentTemplateDialogContext.Provider>
    </TemplateSelectorContext.Provider>
  )
  return { dispatch, getFolders }
}

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

describe('TargetFolderScreen', () => {
  it('explains what the screen is for', () => {
    renderScreen()
    expect(
      screen.getByText(strings.DocumentTemplateDialogScreenTargetFolderInfoTitle)
    ).toBeInTheDocument()
  })

  it("lists the library's folders by name, sorted", () => {
    renderScreen({
      currentLibrary: folder('Dokumenter', {
        isLibrary: true,
        folders: [folder('Rapporter'), folder('Avtaler')]
      })
    })
    expect(screen.getByText(strings.NameLabel)).toBeInTheDocument()
    const first = screen.getByText('Avtaler')
    const second = screen.getByText('Rapporter')
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('opens a folder and lists what is inside it', async () => {
    const user = setupUser()
    const { getFolders } = renderScreen({
      currentLibrary: folder('Dokumenter', { isLibrary: true, folders: [folder('Rapporter')] })
    })
    getFolders.mockResolvedValue([folder('2026')])
    await user.click(screen.getByText('Rapporter'))
    await waitFor(() => expect(getFolders).toHaveBeenCalledWith('/sites/x/Rapporter'))
    expect(await screen.findByText('2026')).toBeInTheDocument()
  })

  it('says so when a folder is empty', async () => {
    const user = setupUser()
    const { getFolders } = renderScreen({
      currentLibrary: folder('Dokumenter', { isLibrary: true, folders: [folder('Tom')] })
    })
    getFolders.mockResolvedValue([])
    await user.click(screen.getByText('Tom'))
    expect(await screen.findByText(strings.NoFoldersAvailableText)).toBeInTheDocument()
  })

  it('copies to the library root when nothing deeper is chosen', async () => {
    const user = setupUser()
    const { dispatch } = renderScreen()
    await user.click(screen.getByRole('button', { name: strings.CopyHereText }))
    expect(dispatch).toHaveBeenCalledWith(
      SET_SCREEN({ screen: DocumentTemplateDialogScreen.EditCopy })
    )
    expect(dispatch).toHaveBeenCalledWith(SET_TARGET({ folder: '/sites/x/Dokumenter' }))
  })

  it('copies to the folder whose row is selected, without entering it', async () => {
    const user = setupUser()
    const { dispatch, getFolders } = renderScreen({
      currentLibrary: folder('Dokumenter', {
        isLibrary: true,
        folders: [folder('Rapporter'), folder('Avtaler')]
      })
    })
    // The row, not the name: the name enters the folder.
    await user.click(screen.getByText('Rapporter').closest('[role=row]'))
    expect(getFolders).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: strings.CopyHereText }))
    expect(dispatch).toHaveBeenCalledWith(SET_TARGET({ folder: '/sites/x/Rapporter' }))
  })

  it('copies to the library root again when the selected folder is clicked a second time', async () => {
    const user = setupUser()
    const { dispatch } = renderScreen({
      currentLibrary: folder('Dokumenter', {
        isLibrary: true,
        folders: [folder('Rapporter'), folder('Avtaler')]
      })
    })
    const row = () => screen.getByText('Rapporter').closest('[role=row]')
    await user.click(row())
    await user.click(row())
    await user.click(screen.getByRole('button', { name: strings.CopyHereText }))
    expect(dispatch).toHaveBeenCalledWith(SET_TARGET({ folder: '/sites/x/Dokumenter' }))
  })

  it('goes back to the template selection', async () => {
    const user = setupUser()
    const { dispatch } = renderScreen()
    await user.click(screen.getByRole('button', { name: strings.OnGoBackText }))
    expect(dispatch).toHaveBeenCalledWith(
      SET_SCREEN({ screen: DocumentTemplateDialogScreen.Select })
    )
  })

  it('offers the other libraries when there are several, and cannot copy to the list of them', async () => {
    const user = setupUser()
    renderScreen({ libraries: [folder('Bilder', { isLibrary: true })] })
    await user.click(screen.getByRole('button', { name: strings.Library }))
    expect(await screen.findByText('Bilder')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.CopyHereText })).toBeDisabled()
  })
})
