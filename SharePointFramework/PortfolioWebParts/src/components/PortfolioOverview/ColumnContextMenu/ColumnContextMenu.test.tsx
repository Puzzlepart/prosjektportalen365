// The menu's items come from the hub list's barrel, whose title column can open ProjectWebParts'
// project information panel; that panel is not under test here, and loading its solution's module
// graph is what the mock avoids. jest.mock must come before the imports: Heft runs Jest on
// CommonJS output without Babel, so mocks are not hoisted.
jest.mock('pp365-projectwebparts/lib/components/ProjectInformationPanel', () => ({
  ProjectInformationPanel: () => null
}))
jest.mock('pp365-projectwebparts/lib/components/ProjectInformation', () => ({
  ProjectInformationPanel: () => null
}))

import { fireEvent, render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { IMenuItem, format } from 'pp365-shared-library'
import * as React from 'react'
import { PortfolioOverviewContext } from '../context'
import { ColumnContextMenu } from './ColumnContextMenu'
import { useColumnContextMenu } from './useColumnContextMenu'

/**
 * The column header menu of the overview: sort both ways, the column's custom orders, group by
 * (for groupable columns), and the column settings for those who may manage columns; the add
 * column's own menu. The rendered menu is checked once (every open v9 menu costs tens of seconds
 * to tear down under jsdom); the choices, who may use them and what they dispatch are read from
 * the hook that builds them, since a nested v9 menu cannot be opened under jsdom at all.
 */
const column = (fieldName: string, name: string, extra: Record<string, any> = {}) =>
  ({
    key: fieldName,
    fieldName,
    name,
    minWidth: 100,
    dataType: 'text',
    data: { customSorts: [], isGroupable: false },
    ...extra
  }) as any

const customSort = { name: 'Fasene i rekkefølge', order: ['Konsept', 'Planlegge'] }

function provider(
  column: any,
  props: Record<string, any>,
  state: Record<string, any>,
  dispatch: jest.Mock,
  children: React.ReactNode
) {
  return (
    <PortfolioOverviewContext.Provider
      value={{
        props: {
          isSiteAdmin: false,
          pageContext: { user: { email: 'kari@contoso.no' } },
          ...props
        } as any,
        state: {
          columnContextMenu: { column, target: document.body },
          currentView: { author: 'ola@contoso.no' },
          ...state
        } as any,
        dispatch,
        layerHostId: 'layer',
        toasterId: 'toaster'
      }}
    >
      {children}
    </PortfolioOverviewContext.Provider>
  )
}

/** Renders the hook inside the overview's context and hands back its items and the dispatch. */
function renderHook(
  column: any,
  props: Record<string, any> = {},
  state: Record<string, any> = {}
): { items: IMenuItem[]; dispatch: jest.Mock } {
  const dispatch = jest.fn()
  const captured: { items: IMenuItem[] } = { items: [] }
  const Probe: React.FC = () => {
    captured.items = useColumnContextMenu().items
    return null
  }
  render(provider(column, props, state, dispatch, <Probe />))
  return { items: captured.items, dispatch }
}

const byKey = (items: IMenuItem[], key: string) => items.find((i) => i.key === key)
const dispatched = (dispatch: jest.Mock, type: string, payload: any) =>
  expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type, payload }))

describe('ColumnContextMenu', () => {
  it("shows the column's choices, and a chosen one dispatches", () => {
    const phase = column('GtProjectPhase', 'Fase', {
      data: { customSorts: [customSort], isGroupable: true }
    })
    const dispatch = jest.fn()
    render(provider(phase, {}, {}, dispatch, <ColumnContextMenu />))
    expect(
      screen.getByRole('menuitemcheckbox', { name: strings.SortDescLabel })
    ).toBeInTheDocument()
    expect(screen.getByRole('menuitemcheckbox', { name: strings.SortAscLabel })).toBeInTheDocument()
    expect(
      screen.getByRole('menuitemcheckbox', { name: format(strings.GroupByColumnLabel, 'Fase') })
    ).not.toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('menuitem', { name: strings.CustomSortsText })).toHaveAttribute(
      'aria-haspopup',
      'menu'
    )
    expect(screen.getByRole('menuitem', { name: strings.ColumnSettingsLabel })).toHaveAttribute(
      'aria-haspopup',
      'menu'
    )
    // Menu items are clicked with a plain click event: user-event's pointer sequence on a v9 menu
    // item never settles under jsdom.
    // `SortDescLabel` reads "A til Å", an ascending sort.
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: strings.SortDescLabel }))
    dispatched(
      dispatch,
      'SET_SORT',
      expect.objectContaining({ column: phase, isSortedDescending: false })
    )
  })

  describe('the choices', () => {
    it('sort both ways', () => {
      const phase = column('GtProjectPhase', 'Fase')
      const { items, dispatch } = renderHook(phase)
      expect(byKey(items, 'SORT_ASC').text).toBe(strings.SortDescLabel)
      byKey(items, 'SORT_ASC').onClick(null, byKey(items, 'SORT_ASC'))
      dispatched(
        dispatch,
        'SET_SORT',
        expect.objectContaining({ column: phase, isSortedDescending: false })
      )
      byKey(items, 'SORT_DESC').onClick(null, byKey(items, 'SORT_DESC'))
      dispatched(
        dispatch,
        'SET_SORT',
        expect.objectContaining({ column: phase, isSortedDescending: true })
      )
      expect(byKey(items, 'CUSTOM_SORTS_HEADER')).toBeUndefined()
    })

    it('group by, for a groupable column only', () => {
      expect(byKey(renderHook(column('Title', 'Tittel')).items, 'GROUP_BY').disabled).toBe(true)
      const phase = column('GtProjectPhase', 'Fase', {
        data: { customSorts: [], isGroupable: true }
      })
      const { items, dispatch } = renderHook(phase)
      const groupBy = byKey(items, 'GROUP_BY')
      expect(groupBy.disabled).toBe(false)
      expect(groupBy.text).toBe(format(strings.GroupByColumnLabel, 'Fase'))
      groupBy.onClick(null, groupBy)
      dispatched(dispatch, 'SET_GROUP_BY', phase)
    })

    it('sort by a custom order of the column', () => {
      const phase = column('GtProjectPhase', 'Fase', {
        data: { customSorts: [customSort], isGroupable: true }
      })
      const { items, dispatch } = renderHook(phase)
      const customSorts = byKey(items, 'CUSTOM_SORTS_HEADER')
      expect(customSorts.subMenuProps.items.map((i) => i.text)).toEqual(['Fasene i rekkefølge'])
      customSorts.subMenuProps.items[0].onClick(null, customSorts.subMenuProps.items[0])
      dispatched(dispatch, 'SET_SORT', expect.objectContaining({ column: phase, customSort }))
    })

    it('edit and add columns for a site admin or the view author, disabled for anyone else', () => {
      const title = column('Title', 'Tittel')
      const settings = (hook: ReturnType<typeof renderHook>) =>
        byKey(hook.items, 'COLUMN_SETTINGS').subMenuProps.items
      expect(settings(renderHook(title)).map((i) => [i.key, i.disabled])).toEqual([
        ['EDIT_COLUMN', true],
        ['DIVIDER_03', undefined],
        ['ADD_COLUMN', true]
      ])
      expect(settings(renderHook(title, { isSiteAdmin: true })).map((i) => i.disabled)).toEqual([
        false,
        undefined,
        false
      ])
      const author = renderHook(title, {}, { currentView: { author: 'kari@contoso.no' } })
      const [edit, , add] = settings(author)
      expect(edit.disabled).toBe(false)
      edit.onClick(null, edit)
      dispatched(author.dispatch, 'TOGGLE_COLUMN_FORM_PANEL', { isOpen: true, column: title })
      add.onClick(null, add)
      dispatched(author.dispatch, 'TOGGLE_COLUMN_FORM_PANEL', { isOpen: true })
    })

    it('the add column has its own two choices: a new column and show/hide columns', () => {
      const { items, dispatch } = renderHook(
        { key: 'ADD_COLUMN', fieldName: '', name: strings.ToggleColumnFormPanelLabel },
        {},
        { currentView: { author: 'kari@contoso.no' } }
      )
      expect(items.map((i) => [i.text, i.disabled])).toEqual([
        [strings.ToggleColumnFormPanelLabel, false],
        [strings.ShowHideColumnsLabel, false]
      ])
      items[0].onClick(null, items[0])
      dispatched(dispatch, 'TOGGLE_COLUMN_FORM_PANEL', { isOpen: true })
      items[1].onClick(null, items[1])
      dispatched(dispatch, 'TOGGLE_EDIT_VIEW_COLUMNS_PANEL', { isOpen: true })
    })

    it("a program view locks the add column's choices", () => {
      const { items } = renderHook(
        { key: 'ADD_COLUMN', fieldName: '', name: strings.ToggleColumnFormPanelLabel },
        { isSiteAdmin: true },
        { currentView: { author: 'ola@contoso.no', isProgramView: true } }
      )
      expect(items.map((i) => i.disabled)).toEqual([true, true])
    })
  })
})
