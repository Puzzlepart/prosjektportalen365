// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The data adapter is `adapter`; the risk action cell (tested on
// its own) shows the item it got from the customizer's context.
const adapter = {
  globalSettings: new Map<string, string>(),
  configure: jest.fn(() => Promise.resolve()),
  ensureHiddenFields: jest.fn(() => Promise.resolve()),
  getHiddenFieldValues: jest.fn(() =>
    Promise.resolve(new Map([['7', { tasks: 'Oppgave i Planner' }]]))
  )
}
jest.mock('./dataAdapter', () => ({ DataAdapter: jest.fn(() => adapter) }))
jest.mock('../../components/RiskAction', () => {
  const React = jest.requireActual('react')
  const { useRiskActionFieldCustomizerContext } = jest.requireActual('./context')
  return {
    RiskAction: () => {
      const { itemContext } = useRiskActionFieldCustomizerContext()
      return React.createElement(
        'span',
        null,
        `${itemContext.title}: ${itemContext.fieldValue} (${itemContext.hiddenFieldValues?.tasks})`
      )
    }
  }
})

import { act } from '@testing-library/react'
import RiskActionFieldCustomizer from '.'

/** A cell of the risk list with `ID` 7, as SPFx hands it to the customizer. */
function cell() {
  const values: Record<string, unknown> = { ID: 7, Title: 'Leverandøren går konkurs' }
  return {
    domElement: document.createElement('div'),
    fieldValue: 'Finn en reserveleverandør',
    listItem: { getValueByName: (name: string) => values[name] }
  } as any
}

async function riskActionCustomizer(plannerEnabled: boolean) {
  adapter.globalSettings = new Map([['RiskActionPlannerEnabled', plannerEnabled ? '1' : '0']])
  const customizer = new RiskActionFieldCustomizer()
  ;(customizer as any).context = {
    pageContext: { list: { serverRelativeUrl: '/sites/frisbee/Lists/Usikkerhet' } }
  }
  await customizer.onInit()
  return customizer
}

beforeEach(() => {
  adapter.ensureHiddenFields.mockClear()
  adapter.getHiddenFieldValues.mockClear()
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
