import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { format, Toolbar } from 'pp365-shared-library'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { DynamicListContext, IDynamicListContext } from './context'
import { useFileUpload } from './hooks'
import { CustomActionType } from './types'
import { useToolbarItems } from './useToolbarItems'

/**
 * What the dynamic list's toolbar tells: a new document, an upload and a deletion are confirmed,
 * or their failure shown, in a toast (WCAG 4.1.3); the export button is named by what it does;
 * and a custom action's spinner is named while it runs. SharePoint is a stand-in web whose calls
 * succeed or fail as each test sets them.
 */
const TOASTER = 'dynamic-list-toaster'
const LIBRARY = '/sites/alfa/Delte dokumenter'

const hook: {
  toolbar?: ReturnType<typeof useToolbarItems>
  upload?: (files: File[]) => Promise<void>
} = {}

/** Renders the toolbar's items and what it shows beside them, and the upload hook. */
const Harness = () => {
  hook.toolbar = useToolbarItems(false, true)
  hook.upload = useFileUpload()
  return (
    <>
      <Toolbar items={hook.toolbar.menuItems} farItems={hook.toolbar.farMenuItems} />
      {hook.toolbar.customActionDialog}
      {hook.toolbar.toaster}
    </>
  )
}

/** A stand-in web: `addUsingPath` and `remove` are what saving a file and deleting an item do. */
function standInWeb() {
  const addUsingPath = jest.fn().mockResolvedValue({ ServerRelativeUrl: `${LIBRARY}/x` })
  const remove = jest.fn().mockResolvedValue(undefined)
  const list = {
    select: () => ({ expand: () => async () => ({ RootFolder: { ServerRelativeUrl: LIBRARY } }) }),
    rootFolder: { files: { addUsingPath }, folders: { getByUrl: () => async () => ({}) } },
    items: { getById: () => ({ delete: remove }) }
  }
  return { web: { lists: { getByTitle: () => list } } as any, addUsingPath, remove }
}

function renderToolbar(state: Record<string, any>, props: Record<string, any> = {}) {
  const stand = standInWeb()
  const value: IDynamicListContext = {
    props: { listName: 'Dokumenter', ...props } as any,
    state: {
      permissions: { canAdd: true, canEdit: true, canDelete: true },
      data: { listItems: [], listColumns: [] },
      ...state
    } as any,
    setState: jest.fn(),
    web: stand.web,
    toasterId: TOASTER
  }
  render(
    <AriaLiveAnnouncer>
      <DynamicListContext.Provider value={value}>
        <Harness />
      </DynamicListContext.Provider>
    </AriaLiveAnnouncer>
  )
  return stand
}

const item = (items: any[], text: string) => items.find((i) => i.text === text)

describe('useToolbarItems', () => {
  beforeEach(() => {
    jest.spyOn(window, 'confirm').mockReturnValue(true)
  })
  afterEach(async () => {
    jest.restoreAllMocks()
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  })

  it('tells when a new document is made, and when it is not (WCAG 4.1.3)', async () => {
    const { addUsingPath } = renderToolbar({ isDocumentLibrary: true }, { showNewWordButton: true })
    const word = () =>
      item(
        item(hook.toolbar.menuItems, strings.DynamicList.New).items,
        strings.DynamicList.WordDocument
      )
    await act(() => word().onClick(undefined))
    const fileName = addUsingPath.mock.calls[0][0]
    expect(
      await screen.findByText(format(strings.DynamicList.DocumentCreated, fileName))
    ).toBeInTheDocument()
    addUsingPath.mockRejectedValueOnce(new Error('Ingen tilgang'))
    await act(() => word().onClick(undefined))
    expect(await screen.findByText(strings.DynamicList.DocumentCreateFailed)).toBeInTheDocument()
    expect(screen.getByText('Ingen tilgang')).toBeInTheDocument()
  })

  it('tells how many items were deleted, and when deleting failed (WCAG 4.1.3)', async () => {
    const { remove } = renderToolbar(
      { selectedItems: [0, 1], data: { listItems: [{ Id: 1 }, { Id: 2 }], listColumns: [] } },
      { showDeleteButton: true }
    )
    const deleteItem = () => item(hook.toolbar.farMenuItems, strings.DynamicList.Delete)
    await act(async () => deleteItem().onClick(undefined))
    expect(await screen.findByText(format(strings.DynamicList.ItemsDeleted, 2))).toBeInTheDocument()
    remove.mockRejectedValueOnce(new Error('Elementet er låst'))
    await act(async () => deleteItem().onClick(undefined))
    expect(await screen.findByText(strings.DynamicList.DeleteFailed)).toBeInTheDocument()
    expect(screen.getByText('Elementet er låst')).toBeInTheDocument()
  })

  it('tells which files were uploaded, and when the upload failed (WCAG 4.1.3)', async () => {
    const { addUsingPath } = renderToolbar({ isDocumentLibrary: true })
    await act(() => hook.upload([new File(['x'], 'Plan.docx')]))
    expect(
      await screen.findByText(format(strings.DynamicList.FileUploaded, 'Plan.docx'))
    ).toBeInTheDocument()
    await act(() => hook.upload([new File(['x'], 'A.docx'), new File(['y'], 'B.docx')]))
    expect(
      await screen.findByText(format(strings.DynamicList.FilesUploaded, 2))
    ).toBeInTheDocument()
    addUsingPath.mockRejectedValueOnce(new Error('Filen er for stor'))
    await act(() => hook.upload([new File(['x'], 'Stor.docx')]))
    expect(await screen.findByText(strings.DynamicList.UploadFailed)).toBeInTheDocument()
    expect(screen.getByText('Filen er for stor')).toBeInTheDocument()
  })

  it('names the export button by what it does, holding the count it shows (WCAG 2.4.6, 2.5.3)', () => {
    renderToolbar({
      selectedItems: [0, 1, 2],
      data: { listItems: [{ Id: 1 }, { Id: 2 }, { Id: 3 }], listColumns: [] }
    })
    const name = format(strings.DynamicList.ExportSelectedMultiple, 3)
    expect(screen.getByRole('button', { name })).toHaveTextContent('3')
  })

  it('names the spinner of a custom action while it runs (WCAG 4.1.2)', async () => {
    // The hook never answers, so the action keeps running.
    const fetch = global.fetch
    global.fetch = jest.fn(() => new Promise(() => undefined)) as any
    renderToolbar(
      { selectedItems: [0], data: { listItems: [{ Id: 1 }], listColumns: [] } },
      {
        customActions: [
          { name: 'Send til arkiv', actionType: CustomActionType.Dialog, hookUrl: 'https://hook' }
        ]
      }
    )
    fireEvent.click(screen.getByRole('button', { name: 'Send til arkiv' }))
    expect(
      await screen.findByRole('progressbar', { name: strings.DynamicList.PleaseWait })
    ).toBeInTheDocument()
    global.fetch = fetch
  })
})
