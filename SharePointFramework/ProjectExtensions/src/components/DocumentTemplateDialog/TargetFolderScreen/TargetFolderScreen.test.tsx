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
import reducer, { initState } from '../reducer'
import { TargetFolderScreen } from './index'

/**
 * The screen where the user browses to where the copied templates go: the current library's
 * folders, navigation into them, the other libraries, and the row that picks a folder. Its
 * buttons are the dialog's footer, tested with the dialog. Asserted through text and roles, so it
 * holds whichever Fluent UI list renders the folders, and run on the dialog's own reducer, which
 * is where the browsing lives.
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

/** The screen in the dialog's state, as the dialog holds it. */
const Harness: React.FC<{ context: any }> = ({ context }) => {
  const [state, dispatch] = React.useReducer(reducer, context, initState)
  return (
    <TemplateSelectorContext.Provider value={context}>
      <DocumentTemplateDialogContext.Provider value={{ state, dispatch }}>
        <TargetFolderScreen />
      </DocumentTemplateDialogContext.Provider>
    </TemplateSelectorContext.Provider>
  )
}

function renderScreen({
  libraries = [] as any[],
  currentLibrary = folder('Dokumenter', { isLibrary: true })
} = {}) {
  const getFolders = SPDataAdapter.getFolders as jest.Mock
  getFolders.mockReset()
  render(
    <Harness
      context={{
        currentLibrary,
        libraries: [currentLibrary, ...libraries],
        currentFolderUrl: ''
      }}
    />
  )
  return { getFolders }
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

  it('opens a folder and lists what is inside it, and the trail leads back to the library', async () => {
    const user = setupUser()
    // The trail reads the folder's place from its URL, below the site and the library.
    const { getFolders } = renderScreen({
      currentLibrary: folder('Dokumenter', {
        isLibrary: true,
        folders: [folder('Rapporter', { url: '/sites/x/Dokumenter/Rapporter' })]
      })
    })
    getFolders.mockResolvedValue([folder('2026', { url: '/sites/x/Dokumenter/Rapporter/2026' })])
    await user.click(screen.getByText('Rapporter'))
    await waitFor(() => expect(getFolders).toHaveBeenCalledWith('/sites/x/Dokumenter/Rapporter'))
    expect(await screen.findByText('2026')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Dokumenter' }))
    expect(await screen.findByText('Rapporter')).toBeInTheDocument()
    expect(screen.queryByText('2026')).toBeNull()
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

  it('marks the folder whose row is selected, and unmarks it on a second click', async () => {
    const user = setupUser()
    const { getFolders } = renderScreen({
      currentLibrary: folder('Dokumenter', {
        isLibrary: true,
        folders: [folder('Rapporter'), folder('Avtaler')]
      })
    })
    // The row, not the name: the name enters the folder.
    const row = () => screen.getByText('Rapporter').closest('[role=row]')
    await user.click(row())
    expect(row()).toHaveAttribute('aria-selected', 'true')
    expect(getFolders).not.toHaveBeenCalled()
    await user.click(row())
    expect(row()).toHaveAttribute('aria-selected', 'false')
  })

  it('offers the other libraries when there are several, and opens one', async () => {
    const user = setupUser()
    const { getFolders } = renderScreen({ libraries: [folder('Bilder', { isLibrary: true })] })
    await user.click(screen.getByRole('button', { name: strings.Library }))
    expect(await screen.findByText('Bilder')).toBeInTheDocument()
    getFolders.mockResolvedValue([folder('Ferie')])
    await user.click(screen.getByText('Bilder'))
    await waitFor(() => expect(getFolders).toHaveBeenCalledWith('/sites/x/Bilder'))
    expect(await screen.findByText('Ferie')).toBeInTheDocument()
  })
})
