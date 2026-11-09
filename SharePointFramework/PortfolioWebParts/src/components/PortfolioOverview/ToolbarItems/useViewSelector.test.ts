// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The views' and programs' own menu items have hooks of their
// own; here they are what each test says.
jest.mock('./useViewsMenuItems', () => ({ useViewsMenuItems: jest.fn(() => []) }))
jest.mock('./useProgramMenuItems', () => ({ useProgramMenuItems: jest.fn(() => []) }))

import { renderHook } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import { ListMenuItem, format } from 'pp365-shared-library'
import resource from 'SharedResources'
import { SET_VIEW_FORM_PANEL, TOGGLE_COMPACT, TOGGLE_MERGED_VIEW } from '../reducer'
import { useProgramMenuItems } from './useProgramMenuItems'
import { useViewSelector } from './useViewSelector'
import { useViewsMenuItems } from './useViewsMenuItems'

/**
 * The portfolio overview's view selector: the two list modes, the shared, merged, personal and
 * program views, and creating and editing a view, which the user may do as the configuration,
 * the site and the view's author allow.
 */
const AUTHOR = 'kari@contoso.no'
const VIEW = { id: 7, title: 'Alle prosjekter', author: AUTHOR }

function contextWith(props: Record<string, any> = {}, state: Record<string, any> = {}) {
  return {
    props: {
      configuration: { userCanAddViews: true },
      isSiteAdmin: false,
      pageContext: { user: { email: AUTHOR, loginName: `i:0#.f|membership|${AUTHOR}` } },
      showViewSelector: true,
      showProgramViews: false,
      showMergedViewInViewSelector: false,
      portfolios: [],
      onSetPortfolio: jest.fn(),
      ...props
    },
    state: {
      currentView: VIEW,
      isChangingView: false,
      isCompact: false,
      isMergedView: false,
      ...state
    },
    dispatch: jest.fn()
  } as any
}

/** The views' menu items: shared ones, personal ones, and the programs'. */
function givenViews({
  shared = [],
  personal = [],
  programs = []
}: { shared?: ListMenuItem[]; personal?: ListMenuItem[]; programs?: ListMenuItem[] } = {}) {
  ;(useViewsMenuItems as jest.Mock).mockImplementation((_context, filter) =>
    filter({ isPersonal: true }) ? personal : shared
  )
  ;(useProgramMenuItems as jest.Mock).mockImplementation(() => programs)
}

const selectorFor = (context: any) => renderHook(() => useViewSelector(context)).result.current

/** The selector's entries with text, by their text; the rest are dividers, headers or left out. */
const entry = (selector: ListMenuItem, text: string) =>
  selector.items.find((item) => item && item.text === text)

beforeEach(() => givenViews())

describe('useViewSelector', () => {
  it('is named after the view shown, checks it and the list mode, and hides or disables as the props say', () => {
    const selector = selectorFor(contextWith())
    expect(selector.text).toBe(VIEW.title)
    expect(selector.description).toBe(resource.Lists_PortfolioViews_Title)
    expect(selector.checkedValues).toEqual({ views: ['7'], renderMode: ['list'] })
    expect(selector.hidden).toBe(false)
    expect(selectorFor(contextWith({ showViewSelector: false })).hidden).toBe(true)
    expect(selectorFor(contextWith({}, { isChangingView: true })).disabled).toBe(true)
    expect(
      selectorFor(contextWith({}, { isCompact: true, isMergedView: true })).checkedValues
    ).toEqual({ views: ['merged'], renderMode: ['compactList'] })
  })

  it('is named by what it chooses as well as the view it shows (WCAG 2.4.6)', () => {
    expect(selectorFor(contextWith()).ariaLabel).toBe(
      format(strings.SelectorButtonLabel, VIEW.title, resource.Lists_PortfolioViews_Title)
    )
  })

  it('switches the list mode from either mode choice', () => {
    const context = contextWith()
    const selector = selectorFor(context)
    entry(selector, strings.ListViewText).onClick(undefined)
    entry(selector, strings.CompactViewText).onClick(undefined)
    expect(context.dispatch).toHaveBeenCalledTimes(2)
    expect(context.dispatch).toHaveBeenCalledWith(TOGGLE_COMPACT())
  })

  it('lets a user who may add views create one, and the author edit theirs', () => {
    const context = contextWith()
    const selector = selectorFor(context)
    expect(entry(selector, strings.NewViewText).disabled).toBe(false)
    expect(entry(selector, strings.EditViewText).disabled).toBe(false)
    entry(selector, strings.NewViewText).onClick(undefined)
    expect(context.dispatch).toHaveBeenCalledWith(SET_VIEW_FORM_PANEL({ isOpen: true }))
    entry(selector, strings.EditViewText).onClick(undefined)
    expect(context.dispatch).toHaveBeenCalledWith(
      SET_VIEW_FORM_PANEL({ isOpen: true, view: VIEW as any })
    )
  })

  it("lets a site admin edit another's view, and no one without the right to add views", () => {
    const others = { currentView: { ...VIEW, author: 'ola@contoso.no' } }
    expect(entry(selectorFor(contextWith({}, others)), strings.EditViewText).disabled).toBe(true)
    expect(
      entry(selectorFor(contextWith({ isSiteAdmin: true }, others)), strings.EditViewText).disabled
    ).toBe(false)
    const readOnly = selectorFor(contextWith({ configuration: { userCanAddViews: false } }))
    expect(entry(readOnly, strings.NewViewText).disabled).toBe(true)
    expect(entry(readOnly, strings.EditViewText).disabled).toBe(true)
  })

  it('knows the author by the login name when the user has no e-mail', () => {
    const selector = selectorFor(
      contextWith(
        { pageContext: { user: { loginName: AUTHOR } } },
        { currentView: { ...VIEW, author: AUTHOR } }
      )
    )
    expect(entry(selector, strings.EditViewText).disabled).toBe(false)
  })

  it('offers the merged view with more than one portfolio when asked to, and shows it when chosen', () => {
    expect(entry(selectorFor(contextWith()), strings.MergedViewLabel)).toBeUndefined()
    const context = contextWith({
      showMergedViewInViewSelector: true,
      portfolios: [{ uniqueId: 'a' }, { uniqueId: 'b' }]
    })
    entry(selectorFor(context), strings.MergedViewLabel).onClick(undefined)
    expect(context.dispatch).toHaveBeenCalledWith(TOGGLE_MERGED_VIEW(true))
    expect(context.props.onSetPortfolio).toHaveBeenCalledWith(null)
    // A web part that does not follow the portfolio is not told.
    const silent = contextWith({
      showMergedViewInViewSelector: true,
      portfolios: [{ uniqueId: 'a' }, { uniqueId: 'b' }],
      onSetPortfolio: undefined
    })
    expect(() =>
      entry(selectorFor(silent), strings.MergedViewLabel).onClick(undefined)
    ).not.toThrow()
  })

  it('heads the personal views only when there are some', () => {
    expect(entry(selectorFor(contextWith()), strings.PersonalViewsHeaderText)).toBeUndefined()
    givenViews({ personal: [new ListMenuItem('Mine utkast')] })
    const selector = selectorFor(contextWith())
    expect(entry(selector, strings.PersonalViewsHeaderText).type).toBe('header')
    expect(entry(selector, 'Mine utkast')).toBeDefined()
  })

  it('shows the programs only when asked to and there are programs', () => {
    const hidden = selectorFor(contextWith())
    expect(entry(hidden, strings.ProgramsHeaderText)).toBeUndefined()
    expect(entry(hidden, strings.SelectProgramText).style).toEqual({ display: 'none' })
    expect(
      entry(selectorFor(contextWith({ showProgramViews: true })), strings.SelectProgramText).style
    ).toEqual({ display: 'none' })
    givenViews({ programs: [new ListMenuItem('Program A')] })
    const shown = selectorFor(contextWith({ showProgramViews: true }))
    expect(entry(shown, strings.ProgramsHeaderText).style).toEqual({ display: 'flex' })
    expect(entry(shown, strings.SelectProgramText).items.map((item) => item.text)).toEqual([
      'Program A'
    ])
  })
})
