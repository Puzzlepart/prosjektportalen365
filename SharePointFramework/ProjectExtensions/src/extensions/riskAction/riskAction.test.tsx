// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter is `adapter`; the risk action cell (tested on
// its own) shows the item it got from the customizer's context, in a button that counts an added
// action as the cell's panel does. Usage statistics are the real ones, counting in the window's
// memory; `started` records each time they are started.
const adapter = {
  globalSettings: new Map<string, string>(),
  portalDataService: undefined as any,
  configure: jest.fn(() => Promise.resolve()),
  ensureHiddenFields: jest.fn(() => Promise.resolve()),
  getHiddenFieldValues: jest.fn(() =>
    Promise.resolve(new Map([['7', { tasks: 'Oppgave i Planner' }]]))
  )
}
jest.mock('./dataAdapter', () => ({ DataAdapter: jest.fn(() => adapter) }))
const started = jest.fn()
jest.mock('pp365-shared-library/lib/telemetry', () => {
  const telemetry = jest.requireActual('pp365-shared-library/lib/telemetry')
  return {
    ...telemetry,
    startTelemetry: (init: any) => {
      started(init)
      telemetry.startTelemetry(init)
    }
  }
})
jest.mock('../../components/RiskAction', () => {
  const React = jest.requireActual('react')
  const { useRiskActionFieldCustomizerContext } = jest.requireActual('./context')
  const { useTelemetry } = jest.requireActual('pp365-shared-library/lib/telemetry')
  return {
    RiskAction: () => {
      const { itemContext } = useRiskActionFieldCustomizerContext()
      const telemetry = useTelemetry()
      return React.createElement(
        'button',
        { onClick: () => telemetry.track('riskAction.created') },
        `${itemContext.title}: ${itemContext.fieldValue} (${itemContext.hiddenFieldValues?.tasks})`
      )
    }
  }
})

import { act, fireEvent } from '@testing-library/react'
import * as fs from 'fs'
import * as path from 'path'
import { getTelemetryGate } from 'pp365-shared-library/lib/telemetry'
import {
  clearTestTelemetry,
  countedTelemetry,
  HUB_SITE_ID,
  hubPortal,
  PROJECT_SITE_ID,
  settingsMap,
  settle,
  spfxTestContext,
  telemetryStore
} from 'pp365-shared-library/lib/telemetry/__fixtures__/testFixtures'
import RiskActionFieldCustomizer from '.'

/** The customizer's alias in its manifest, which usage statistics count it by. */
const { alias: ALIAS } = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../../../src/extensions/riskAction/manifest.json'),
    'utf8'
  )
)

/** A cell of the risk list with `ID` 7, as SPFx hands it to the customizer. */
function cell() {
  const values: Record<string, unknown> = { ID: 7, Title: 'Leverandøren går konkurs' }
  return {
    domElement: document.createElement('div'),
    fieldValue: 'Finn en reserveleverandør',
    listItem: { getValueByName: (name: string) => values[name] }
  } as any
}

/**
 * The customizer in the risk list of a project site of the hub, initialised.
 *
 * @param plannerEnabled Whether the hub's settings turn Planner on for risk actions
 * @param settings The hub's other settings, as the adapter has read them
 * @param page Parts of the page context that differ from the risk list's
 */
async function riskActionCustomizer(
  plannerEnabled: boolean,
  settings: Map<string, string> = new Map(),
  page: Record<string, any> = {}
) {
  adapter.globalSettings = new Map(settings).set(
    'RiskActionPlannerEnabled',
    plannerEnabled ? '1' : '0'
  )
  const customizer = new RiskActionFieldCustomizer()
  const { pageContext, manifest } = spfxTestContext({ page: 'project', alias: ALIAS })
  ;(customizer as any).context = {
    manifest,
    pageContext: {
      ...pageContext,
      list: { serverRelativeUrl: '/sites/frisbee/Lists/Usikkerhet' },
      ...page
    }
  }
  await customizer.onInit()
  return customizer
}

beforeEach(() => {
  adapter.ensureHiddenFields.mockClear()
  adapter.getHiddenFieldValues.mockClear()
  adapter.portalDataService = undefined
  started.mockClear()
  clearTestTelemetry()
})

describe('RiskActionFieldCustomizer', () => {
  it('shows the risk action with its Planner tasks when Planner is turned on', async () => {
    const customizer = await riskActionCustomizer(true)
    expect(adapter.configure).toHaveBeenCalledWith(expect.anything(), { loadGlobalSettings: true })
    expect(adapter.ensureHiddenFields).toHaveBeenCalled()
    const event = cell()
    act(() => customizer.onRenderCell(event))
    expect(event.domElement).toHaveTextContent(
      'Leverandøren går konkurs: Finn en reserveleverandør (Oppgave i Planner)'
    )
    act(() => customizer.onDisposeCell(event))
    expect(event.domElement).toBeEmptyDOMElement()
  })

  it('leaves the cell to SharePoint when Planner is turned off', async () => {
    const customizer = await riskActionCustomizer(false)
    expect(adapter.ensureHiddenFields).not.toHaveBeenCalled()
    const event = cell()
    act(() => customizer.onRenderCell(event))
    expect(event.domElement).toBeEmptyDOMElement()
  })
})

/**
 * The field and usage statistics: they start once per list view, with the hub's settings the
 * adapter has read, never once per cell; and what a cell counts, it counts for the field.
 */
describe('RiskActionFieldCustomizer and usage statistics', () => {
  it("starts usage statistics once for the list view, with the hub's settings the adapter has read, however many cells it renders", async () => {
    adapter.portalDataService = hubPortal()
    const customizer = await riskActionCustomizer(true, settingsMap('2'))
    expect(telemetryStore().page).toMatchObject({
      host: 'contoso.sharepoint.com',
      siteId: PROJECT_SITE_ID,
      hubSiteId: HUB_SITE_ID,
      isHubPage: false,
      appVersion: '1.15.0',
      isDebug: false
    })
    // Decided from the map the adapter holds: the hub is not asked for its settings again.
    expect(getTelemetryGate().level).toBe(2)
    expect(adapter.portalDataService.getGlobalSettings).not.toHaveBeenCalled()
    const cells = [cell(), cell(), cell()]
    act(() => cells.forEach((event) => customizer.onRenderCell(event)))
    await settle()
    expect(started).toHaveBeenCalledTimes(1)
    // The hub is asked once what kind of site this is, whatever the number of cells.
    expect(adapter.portalDataService.getSiteKind.mock.calls).toEqual([[PROJECT_SITE_ID]])
    expect(countedTelemetry()).toEqual({ usage: {}, errors: {}, timings: {} })
    act(() => cells.forEach((event) => customizer.onDisposeCell(event)))
  })

  it('counts what a cell does for the field, under the alias of its manifest', async () => {
    const customizer = await riskActionCustomizer(true)
    const event = cell()
    act(() => customizer.onRenderCell(event))
    fireEvent.click(event.domElement.querySelector('button'))
    expect(countedTelemetry().usage).toEqual({ [`${ALIAS} riskAction.created`]: 1 })
    act(() => customizer.onDisposeCell(event))
  })

  it('sets the field up all the same on a page usage statistics cannot read', async () => {
    // No site in the page context: reading it fails, and the failure goes no further.
    const customizer = await riskActionCustomizer(true, new Map(), { site: undefined })
    expect(started).not.toHaveBeenCalled()
    const event = cell()
    act(() => customizer.onRenderCell(event))
    expect(event.domElement).toHaveTextContent('Leverandøren går konkurs')
    act(() => customizer.onDisposeCell(event))
  })
})
