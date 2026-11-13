import { renderHook } from '@testing-library/react'
import { PortfolioOverviewView } from 'pp365-shared-library'
import { TelemetryProvider } from 'pp365-shared-library/lib/telemetry'
import {
  countedTelemetry,
  startTestTelemetry
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import React, { FC, PropsWithChildren } from 'react'
import { CHANGE_VIEW } from '../reducer'
import { useProgramMenuItems } from './useProgramMenuItems'
import { useViewsMenuItems } from './useViewsMenuItems'

/**
 * The views and the programs of the portfolio overview's view selector: each view the filter lets
 * through and each program is a menu item that shows it, a program as the default view scoped to
 * it. A pick is counted as a switch of view, once, for the web part the overview is in: the hub's
 * overview or a program's. A pick of what the overview shows already is no switch.
 */
const QUERY = 'DepartmentId:{5c7d2f6a-3b1e-4d8c-9a0f-6e2b1c4d7f80} contentclass:STS_Site'

const view = (Id: number, Title: string, extra: Record<string, any> = {}) =>
  new PortfolioOverviewView({ Id, Title, GtSearchQuery: QUERY, ...extra }).configure([])

const all = view(1, 'Alle prosjekter', { GtPortfolioIsDefaultView: true })
const active = view(2, 'Aktive prosjekter', { GtPortfolioFabricIcon: 'Play' })
const mine = view(3, 'Mine prosjekter', { GtPortfolioIsPersonalView: true })

const program = {
  id: 'program-1',
  name: 'Program Bygg',
  buildQueries: jest.fn((query: string) => [`${query} program-1`])
}

function contextWith(configuration: Record<string, any> = {}, currentView: any = all) {
  return {
    props: { configuration: { views: [all, active, mine], programs: [program], ...configuration } },
    state: { currentView },
    dispatch: jest.fn()
  } as any
}

const OVERVIEW = 'PortfolioOverviewWebPart'

/** The alias that stands for no web part: the hooks then run outside every web part. */
const NO_WEB_PART = ''

/** The web part the hooks run in, by its alias, or none for `NO_WEB_PART`. */
function inWebPart(alias: string) {
  const WebPart: FC<PropsWithChildren> = ({ children }) =>
    alias ? <TelemetryProvider component={alias}>{children}</TelemetryProvider> : <>{children}</>
  return WebPart
}

const viewItems = (context: any, alias = OVERVIEW, personal = false) =>
  renderHook(() => useViewsMenuItems(context, (v) => !!v.isPersonal === personal), {
    wrapper: inWebPart(alias)
  }).result.current

const programItems = (context: any, alias = OVERVIEW) =>
  renderHook(() => useProgramMenuItems(context), { wrapper: inWebPart(alias) }).result.current

beforeEach(() => {
  jest.clearAllMocks()
  startTestTelemetry()
})

describe('useViewsMenuItems', () => {
  it('lists the views the filter lets through, each checkable by its id, and shows the one picked', () => {
    const context = contextWith()
    const items = viewItems(context)
    expect(items.map((item) => item.text)).toEqual(['Alle prosjekter', 'Aktive prosjekter'])
    expect(items.map((item) => [item.name, item.value])).toEqual([
      ['views', '1'],
      ['views', '2']
    ])
    expect(viewItems(context, OVERVIEW, true).map((item) => item.text)).toEqual(['Mine prosjekter'])
    items[1].onClick(undefined)
    expect(context.dispatch).toHaveBeenCalledTimes(1)
    expect(context.dispatch).toHaveBeenCalledWith(CHANGE_VIEW(active))
  })

  it('counts each view picked as a switch, once, for the web part the overview is in', () => {
    const items = viewItems(contextWith())
    items[1].onClick(undefined)
    expect(countedTelemetry().usage).toEqual({ 'PortfolioOverviewWebPart view.switched': 1 })
    // The overview shows «Aktive prosjekter» now, and «Alle prosjekter» is picked again.
    viewItems(contextWith({}, active))[0].onClick(undefined)
    expect(countedTelemetry().usage).toEqual({ 'PortfolioOverviewWebPart view.switched': 2 })

    // A program reuses the overview under its own web part.
    viewItems(contextWith(), 'ProgramProjectOverviewWebPart')[1].onClick(undefined)
    expect(countedTelemetry().usage).toEqual({
      'PortfolioOverviewWebPart view.switched': 2,
      'ProgramProjectOverviewWebPart view.switched': 1
    })
  })

  it('counts no switch for the view the overview shows already, and shows it all the same', () => {
    const context = contextWith()
    viewItems(context)[0].onClick(undefined)
    expect(context.dispatch).toHaveBeenCalledWith(CHANGE_VIEW(all))
    expect(countedTelemetry().usage).toEqual({})
  })

  it('shows the view all the same outside a web part, or in one the contract gives no views, and counts nothing', () => {
    for (const alias of [NO_WEB_PART, 'PortfolioAggregationWebPart']) {
      const context = contextWith()
      viewItems(context, alias)[1].onClick(undefined)
      expect(context.dispatch).toHaveBeenCalledWith(CHANGE_VIEW(active))
    }
    expect(countedTelemetry().usage).toEqual({})
  })
})

describe('useProgramMenuItems', () => {
  it('offers no programs when the configuration has none', () => {
    expect(programItems(contextWith({ programs: undefined }))).toEqual([])
  })

  it('shows a program as the default view scoped to it, and counts the pick as a switch of view', () => {
    const context = contextWith()
    const [item] = programItems(context)
    expect(item.text).toBe('Program Bygg')
    item.onClick(undefined)
    expect(program.buildQueries).toHaveBeenCalledWith(QUERY)
    const [[{ payload }]] = context.dispatch.mock.calls
    expect(payload).toMatchObject({
      id: 'program-1',
      title: 'Program Bygg',
      searchQueries: [`${QUERY} program-1`]
    })
    expect(countedTelemetry().usage).toEqual({ 'PortfolioOverviewWebPart view.switched': 1 })
  })

  it('counts no switch for the program the overview shows already', () => {
    const context = contextWith({}, { id: program.id })
    programItems(context)[0].onClick(undefined)
    expect(context.dispatch).toHaveBeenCalledTimes(1)
    expect(countedTelemetry().usage).toEqual({})
  })

  it('shows nothing without a default view to scope, and counts nothing', () => {
    const context = contextWith({ views: [active, mine] })
    programItems(context)[0].onClick(undefined)
    expect(context.dispatch).not.toHaveBeenCalled()
    expect(countedTelemetry().usage).toEqual({})
  })
})
