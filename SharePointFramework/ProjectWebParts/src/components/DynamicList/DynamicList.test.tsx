// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data fetch sets what `fetched.state` holds, and ends a
// refetch as the real one does; the permission check, the web lookup, the toolbar (which reaches
// SharePoint) and the data adapter are stand-ins. The toolbar's stand-in has the real back button
// (`goBack`), the refresh button's state change, and a button that searches for «Åpning». The
// document library's view reads DEBUG, which SPFx defines at build.
;(globalThis as any).DEBUG = false
const fetched: { state: Record<string, any> | undefined } = { state: undefined }
jest.mock('./data/useDynamicListDataFetch', () => ({
  useDynamicListDataFetch: (_props: any, state: any, setState: (s: any) => void) => {
    const { useEffect } = jest.requireActual('react')
    useEffect(() => {
      if (fetched.state) setState({ isLoading: false, ...fetched.state })
    }, [])
    useEffect(() => {
      if (state.isRefetching) setState({ isRefetching: false })
    }, [state.refetch])
  }
}))
jest.mock('./hooks/useListPermissions', () => ({
  useListPermissions: () => ({ canAdd: true, canEdit: true, canDelete: true, isLoading: false })
}))
jest.mock('./utils/webUtils', () => ({ getWeb: () => ({}) }))
jest.mock('./useToolbarItems', () => ({
  useToolbarItems: () => {
    const { useContext } = jest.requireActual('react')
    const { ListMenuItem } = jest.requireActual('pp365-shared-library')
    const { DynamicListContext } = jest.requireActual('./context')
    const { goBack } = jest.requireActual('./utils/navigation')
    const context = useContext(DynamicListContext)
    const menuItems = [
      new ListMenuItem('Tilbake').setOnClick(() => goBack(context)),
      new ListMenuItem('Oppdater').setOnClick(() =>
        context.setState({ isRefetching: true, refetch: Date.now() })
      ),
      new ListMenuItem('Søk etter Åpning').setOnClick(() =>
        context.setState({ searchTerm: 'Åpning' })
      )
    ]
    return {
      menuItems,
      farMenuItems: [],
      filterPanelProps: undefined,
      customActionDialog: null,
      toaster: null
    }
  }
}))
jest.mock('../../data', () => ({ __esModule: true, default: { portalDataService: {}, sp: {} } }))
// An open Fluent menu is positioned against its trigger, which costs tens of seconds under jsdom
// (see the testing guide): the column headers' menus are a stand-in that keeps Fluent's contract.
// With `openOnContext` the trigger's child opens the menu on `contextmenu`, which a right click,
// Shift+F10 and the menu key all fire, and an item runs its `onClick` and closes the menu.
jest.mock('@fluentui/react-components', () => {
  const actual = jest.requireActual('@fluentui/react-components')
  const React = jest.requireActual('react')
  const MenuContext = React.createContext({
    open: false,
    setOpen: (_open: boolean) => undefined,
    openOnContext: false
  })
  const Menu = ({ openOnContext, children }: any) => {
    const [open, setOpen] = React.useState(false)
    return React.createElement(
      MenuContext.Provider,
      { value: { open, setOpen, openOnContext } },
      children
    )
  }
  const MenuTrigger = ({ children }: any) => {
    const { setOpen, openOnContext } = React.useContext(MenuContext)
    return React.cloneElement(
      React.Children.only(children),
      openOnContext
        ? {
            onContextMenu: (event: any) => {
              event.preventDefault()
              setOpen(true)
            }
          }
        : { onClick: () => setOpen(true) }
    )
  }
  const MenuPopover = ({ children }: any) =>
    React.useContext(MenuContext).open
      ? React.createElement('div', { role: 'menu' }, children)
      : null
  const MenuList = ({ children }: any) => React.createElement(React.Fragment, null, children)
  const MenuItem = ({ children, onClick }: any) => {
    const { setOpen } = React.useContext(MenuContext)
    return React.createElement(
      'button',
      {
        role: 'menuitem',
        onClick: (event: any) => {
          onClick?.(event)
          setOpen(false)
        }
      },
      children
    )
  }
  return { __esModule: true, ...actual, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem }
})

import { AriaLiveAnnouncer } from '@fluentui/react-components'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import { format } from 'pp365-shared-library'
import strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { DynamicList } from './DynamicList'
import { DynamicListMode } from './types'
import { announced } from 'pp365-jest-config/lib/announce'

/**
 * The dynamic list web part as a whole: the message without a list, the title from the list,
 * the rows under their columns, the empty list, the single-item view with its fields, and the
 * warnings and errors.
 */
const listColumns = [
  { key: 'Title', fieldName: 'Title', name: 'Tittel', minWidth: 100 },
  { key: 'Status', fieldName: 'Status', name: 'Status', minWidth: 100 }
]
const listItems = [
  { Id: 1, Title: 'Design av bane', Status: 'Pågår' },
  { Id: 2, Title: 'Åpning', Status: 'Ferdig' }
]

function renderList(state: Record<string, any> | undefined, props: Record<string, any> = {}) {
  fetched.state = state
  return render(
    <AriaLiveAnnouncer>
      <DynamicList
        listName='Leveranser'
        mode={DynamicListMode.Multi}
        showCommandBar
        webAbsoluteUrl='https://contoso.sharepoint.com/sites/alfa'
        {...props}
      />
    </AriaLiveAnnouncer>
  )
}

const toolbarButton = (name: string) => screen.getByText(name).closest('button') as HTMLElement

/** A document library with a folder at its root and a file in the folder. */
const LIBRARY = '/sites/alfa/Delte dokumenter'
const libraryItems = [
  { Id: 3, FileLeafRef: 'Kontrakter', FSObjType: 1, FileDirRef: LIBRARY },
  {
    Id: 4,
    FileLeafRef: 'Avtale.docx',
    FSObjType: 0,
    FileDirRef: `${LIBRARY}/Kontrakter`,
    FileRef: `${LIBRARY}/Kontrakter/Avtale.docx`
  }
]
const libraryColumns = [
  { key: 'FileLeafRef', fieldName: 'FileLeafRef', name: 'Navn', minWidth: 100 }
]

describe('DynamicList', () => {
  it('asks for a list when none is configured', () => {
    renderList(undefined, { listName: undefined, title: 'Leveranser' })
    expect(screen.getByText(strings.DynamicList.NoListSelected)).toBeInTheDocument()
  })

  it('shows the rows under their columns, titled after the list', async () => {
    renderList({ data: { listItems, listColumns, listTitle: 'Leveranser' } })
    expect(await screen.findByText('Design av bane')).toBeInTheDocument()
    expect(screen.getByText('Leveranser', { selector: 'span' })).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('columnheader')
        .map((h) => h.textContent?.trim())
        .filter(Boolean)
    ).toEqual(['Tittel', 'Status'])
    expect(screen.getByText('Ferdig')).toBeInTheDocument()
  })

  it('opens a menu on a column header from the keyboard, as on a right click, to sort or resize the column (WCAG 2.1.1)', async () => {
    // A right click kept the browser's menu away and opened nothing, and a column's width could
    // only be changed with a mouse. Shift+F10 and the menu key fire the same contextmenu event.
    renderList({ data: { listItems, listColumns, listTitle: 'Leveranser' } })
    await screen.findByText('Design av bane')
    // By its text, not by role: a role query reads the whole document's tree, slow in a large one.
    const status = () => screen.getByText('Status').closest('[role="columnheader"]')
    fireEvent.contextMenu(status())
    const menu = document.querySelector<HTMLElement>('[role="menu"]')
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent)
    ).toEqual([
      strings.DynamicList.SortAscending,
      strings.DynamicList.SortDescending,
      strings.DynamicList.ResizeColumn
    ])
    fireEvent.click(within(menu).getByText(strings.DynamicList.SortAscending))
    await waitFor(() => expect(status()).toHaveAttribute('aria-sort', 'ascending'))
  })

  it('tells when the list has no rows', async () => {
    renderList({ data: { listItems: [], listColumns, listTitle: 'Leveranser' } })
    expect(await screen.findByText(strings.DynamicList.NoItemsToShow)).toBeInTheDocument()
  })

  it('shows one item with its fields in single mode, headed under the web part and read in pairs (WCAG 1.3.1)', async () => {
    renderList(
      { data: { listItems, listColumns, listTitle: 'Leveranser' } },
      { mode: DynamicListMode.Single }
    )
    expect(
      await screen.findByRole('heading', { level: 3, name: 'Design av bane' })
    ).toBeInTheDocument()
    expect(screen.getByText('Status').closest('dt')).not.toBeNull()
    expect(screen.getByText('Pågår').closest('dd')).not.toBeNull()
    expect(screen.queryByText('Åpning')).toBeNull()
  })

  it('names its loading once (WCAG 4.1.2)', async () => {
    const { container } = renderList(undefined)
    // The list's skeleton is named; the title's beside it is hidden, or the loading is read twice.
    expect(screen.getAllByRole('progressbar')).toHaveLength(1)
    expect(await axeComponent(container)).toHaveNoViolations()
  })

  it('puts focus on an item opened from the list, and back on its link when going back (WCAG 2.4.3)', async () => {
    renderList({ data: { listItems, listColumns, listTitle: 'Leveranser' } })
    fireEvent.click(await screen.findByRole('button', { name: 'Design av bane' }))
    expect(screen.getByRole('heading', { level: 3, name: 'Design av bane' })).toHaveFocus()
    fireEvent.click(toolbarButton('Tilbake'))
    expect(screen.getByRole('button', { name: 'Design av bane' })).toHaveFocus()
  })

  it('puts focus on the folder opened, and back on its link when going back (WCAG 2.4.3)', async () => {
    renderList({
      isDocumentLibrary: true,
      data: { listItems: libraryItems, listColumns: libraryColumns, listTitle: 'Dokumenter' }
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Kontrakter' }))
    const navigation = screen.getByRole('navigation', {
      name: strings.DynamicList.FolderNavigation
    })
    expect(within(navigation).getByText('Kontrakter').closest('button')).toHaveFocus()
    expect(screen.getByText('Avtale.docx')).toBeInTheDocument()
    fireEvent.click(toolbarButton('Tilbake'))
    expect(screen.getByRole('button', { name: 'Kontrakter' })).toHaveFocus()
  })

  it('keeps the toolbar, and the focus in it, while the list is fetched again, and tells when it is done (WCAG 2.4.3, 4.1.3)', async () => {
    renderList({ data: { listItems, listColumns, listTitle: 'Leveranser' } })
    await screen.findByText('Design av bane')
    const refresh = toolbarButton('Oppdater')
    refresh.focus()
    fireEvent.click(refresh)
    expect(toolbarButton('Oppdater')).toHaveFocus()
    await waitFor(() => expect(announced()).toContain(strings.DynamicList.RefreshDone))
  })

  it('tells how many items a search shows (WCAG 4.1.3)', async () => {
    renderList({ data: { listItems, listColumns, listTitle: 'Leveranser' } })
    await screen.findByText('Design av bane')
    fireEvent.click(toolbarButton('Søk etter Åpning'))
    await waitFor(
      () => expect(announced()).toContain(format(strings.DynamicList.ItemsShown, 1, 2)),
      {
        timeout: 2000
      }
    )
    expect(screen.queryByText('Design av bane')).toBeNull()
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  })

  it('warns when the site id fields are missing, and shows a fetch error', async () => {
    renderList({
      data: { listItems, listColumns, listTitle: 'Leveranser', siteIdFieldMissing: true }
    })
    expect(await screen.findByText(strings.DynamicList.SiteIdFieldsMissing)).toBeInTheDocument()
  })

  it('shows the error of a failed fetch as a message, in Norwegian (WCAG 3.1.2, 4.1.3)', async () => {
    renderList({ error: 'Kilden svarte ikke', data: undefined })
    expect(await screen.findByText('Kilden svarte ikke')).toBeInTheDocument()
    expect(screen.getByText(strings.DynamicList.Error)).toBeInTheDocument()
    expect(screen.queryByText(/^Error:/)).toBeNull()
  })
})
