import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { format, Toolbar } from 'pp365-shared-library'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
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
 * succeed or fail as each test sets them. Each failure that is shown is also counted once for
 * usage statistics, for the dynamic list web part, by the error's code.
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

/**
 * A stand-in web: `addUsingPath`, `remove` and `add` are what saving a file, deleting an item and
 * adding an item do.
 */
function standInWeb() {
  const addUsingPath = jest.fn().mockResolvedValue({ ServerRelativeUrl: `${LIBRARY}/x` })
  const remove = jest.fn().mockResolvedValue(undefined)
  const add = jest.fn().mockResolvedValue({ ID: 7 })
  const list = {
    select: () => ({ expand: () => async () => ({ RootFolder: { ServerRelativeUrl: LIBRARY } }) }),
    rootFolder: { files: { addUsingPath }, folders: { getByUrl: () => async () => ({}) } },
    items: { getById: () => ({ delete: remove }), add }
  }
  return { web: { lists: { getByTitle: () => list } } as any, addUsingPath, remove, add }
}

function renderToolbar(state: Record<string, any>, props: Record<string, any> = {}) {
  const stand = standInWeb()
  const setState = jest.fn()
  const value: IDynamicListContext = {
    props: { listName: 'Dokumenter', ...props } as any,
    state: {
      permissions: { canAdd: true, canEdit: true, canDelete: true },
      data: { listItems: [], listColumns: [] },
      ...state
    } as any,
    setState,
    web: stand.web,
    toasterId: TOASTER
  }
  render(
    <TelemetryProvider component='DynamicListWebPart'>
      <AriaLiveAnnouncer>
        <DynamicListContext.Provider value={value}>
          <Harness />
        </DynamicListContext.Provider>
      </AriaLiveAnnouncer>
    </TelemetryProvider>
  )
  return { ...stand, setState }
}

const item = (items: any[], text: string) => items.find((i) => i.text === text)

/** An error with an HTTP status, as PnPjs gives one. */
const httpError = (message: string, status: number) => Object.assign(new Error(message), { status })

describe('useToolbarItems', () => {
  beforeEach(() => {
    startTestTelemetry()
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
    expect(countedTelemetry().errors).toEqual({})
    addUsingPath.mockRejectedValueOnce(httpError('Ingen tilgang', 403))
    await act(() => word().onClick(undefined))
    expect(await screen.findByText(strings.DynamicList.DocumentCreateFailed)).toBeInTheDocument()
    expect(screen.getByText('Ingen tilgang')).toBeInTheDocument()
    expect(countedTelemetry().errors).toEqual({ 'DynamicListWebPart permission_denied 403': 1 })
  })

  it('tells how many items were deleted, and when deleting failed (WCAG 4.1.3)', async () => {
    const { remove } = renderToolbar(
      { selectedItems: [0, 1], data: { listItems: [{ Id: 1 }, { Id: 2 }], listColumns: [] } },
      { showDeleteButton: true }
    )
    const deleteItem = () => item(hook.toolbar.farMenuItems, strings.DynamicList.Delete)
    await act(async () => deleteItem().onClick(undefined))
    expect(await screen.findByText(format(strings.DynamicList.ItemsDeleted, 2))).toBeInTheDocument()
    expect(countedTelemetry().errors).toEqual({})
    remove.mockRejectedValueOnce(httpError('Elementet er låst', 409))
    await act(async () => deleteItem().onClick(undefined))
    expect(await screen.findByText(strings.DynamicList.DeleteFailed)).toBeInTheDocument()
    expect(screen.getByText('Elementet er låst')).toBeInTheDocument()
    expect(countedTelemetry().errors).toEqual({ 'DynamicListWebPart unknown 409': 1 })
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
    expect(countedTelemetry().errors).toEqual({})
    addUsingPath.mockRejectedValueOnce(httpError('Filen er for stor', 503))
    await act(() => hook.upload([new File(['x'], 'Stor.docx')]))
    expect(await screen.findByText(strings.DynamicList.UploadFailed)).toBeInTheDocument()
    expect(screen.getByText('Filen er for stor')).toBeInTheDocument()
    expect(countedTelemetry().errors).toEqual({ 'DynamicListWebPart server_error 503': 1 })
  })

  it('names the export button by what it does, holding the count it shows (WCAG 2.4.6, 2.5.3)', () => {
    renderToolbar({
      selectedItems: [0, 1, 2],
      data: { listItems: [{ Id: 1 }, { Id: 2 }, { Id: 3 }], listColumns: [] }
    })
    const name = format(strings.DynamicList.ExportSelectedMultiple, 3)
    expect(screen.getByRole('button', { name })).toHaveTextContent('3')
  })

  it('lets any view be chosen in the view menu, and fetches the list again for the one chosen', async () => {
    // Every view was disabled in the menu from 1.13.0, so the list could not change view. The
    // menu is read from the hook: an open Fluent menu costs tens of seconds under jsdom.
    const views = [
      { id: 'view-1', title: 'Alle elementer', isDefault: true },
      { id: 'view-2', title: 'Mine elementer', isDefault: false }
    ]
    const { setState } = renderToolbar({ views, currentView: views[0] }, { showViewSelector: true })
    const menu = item(hook.toolbar.farMenuItems, 'Alle elementer')
    expect(menu.checkedValues.views).toEqual(['view-1'])
    expect(menu.items.map((view: any) => [view.text, !!view.disabled])).toEqual([
      [`Alle elementer${strings.DynamicList.Default}`, false],
      ['Mine elementer', false]
    ])
    act(() => item(menu.items, 'Mine elementer').onClick(undefined))
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)))
    expect(setState).toHaveBeenCalledWith(expect.objectContaining({ currentView: views[1] }))
    expect(setState).toHaveBeenCalledWith({ refetch: expect.any(Number) })
  })

  it('names the spinner of a custom action while it runs (WCAG 4.1.2)', async () => {
    // The hook never answers, so the action keeps running.
    const fetch = global.fetch
    global.fetch = jest.fn(() => new Promise(() => undefined)) as any
    try {
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
    } finally {
      global.fetch = fetch
    }
  })
  it('counts an item that could not be saved, and hands the error to the panel that shows it', async () => {
    const { add, setState } = renderToolbar({ isDocumentLibrary: false })
    act(() => item(hook.toolbar.menuItems, strings.DynamicList.NewItem).onClick(undefined))
    const { panel } = setState.mock.calls[setState.mock.calls.length - 1][0]
    const refused = httpError('Ingen tilgang', 403)
    add.mockRejectedValueOnce(refused)
    await expect(panel.submit.onSubmit({ properties: { Title: 'Ny' } })).rejects.toBe(refused)
    expect(countedTelemetry().errors).toEqual({ 'DynamicListWebPart permission_denied 403': 1 })
  })

  it.each([
    [CustomActionType.Trigger, 403, 'DynamicListWebPart permission_denied 403'],
    [CustomActionType.Dialog, 500, 'DynamicListWebPart server_error 500']
  ])(
    'counts a custom action (%s) whose hook answers %i, by that status',
    async (actionType, status, counted) => {
      const fetch = global.fetch
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status }) as any
      try {
        renderToolbar(
          { selectedItems: [0], data: { listItems: [{ Id: 1 }], listColumns: [] } },
          { customActions: [{ name: 'Send til arkiv', actionType, hookUrl: 'https://hook' }] }
        )
        fireEvent.click(screen.getByRole('button', { name: 'Send til arkiv' }))
        await waitFor(() => expect(countedTelemetry().errors).toEqual({ [counted]: 1 }))
      } finally {
        // Back for the tests after this one, failed or not.
        global.fetch = fetch
      }
    }
  )
})
