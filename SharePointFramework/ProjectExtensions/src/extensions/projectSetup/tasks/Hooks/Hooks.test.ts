// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The task reads DEBUG for the engine's log level, and the engine
// is a stand-in that records the schemas it applies.
;(globalThis as any).DEBUG = false
import type { IEngineRecord } from '../testFixtures'
const engine: IEngineRecord = { setups: [], applied: [] }
jest.mock('@pnp/logging', () => jest.requireActual('../testFixtures').fakeLogging())
jest.mock('sp-js-provisioning', () => jest.requireActual('../testFixtures').fakeEngine(engine))

import { Hooks } from '.'

/** A selected extension, its schema read from the hub. */
const extension = (text: string, schema: Record<string, any>) => ({
  text,
  getSchema: jest.fn(() => Promise.resolve(schema))
})

/** Task parameters with the template's schema, and a catalog template's own if given. */
const taskParams = (
  templateSchema: Record<string, any>,
  packageTemplateSchema?: Record<string, any>
) => ({ web: {}, context: {}, templateSchema, packageTemplateSchema }) as any

beforeEach(() => {
  engine.applied = []
  engine.setups = []
})

describe('Hooks', () => {
  it("runs only the hooks: the template's, a catalog template's own, then each extension's", async () => {
    await new Hooks({
      selectedExtensions: [extension('Veimal', { Lists: [], Hooks: [{ Title: 'Veimal' }] })]
    } as any).execute(
      taskParams(
        { Lists: [], Hooks: [{ Title: 'Standardmal' }] },
        { Lists: [], Hooks: [{ Title: 'Veiprosjekt' }] }
      ),
      jest.fn()
    )
    expect(engine.applied).toEqual([
      { Hooks: [{ Title: 'Standardmal' }] },
      { Hooks: [{ Title: 'Veiprosjekt' }] },
      { Hooks: [{ Title: 'Veimal' }] }
    ])
  })

  it('runs no template hooks where the templates have none', async () => {
    await new Hooks({ selectedExtensions: [] } as any).execute(
      taskParams({ Lists: [] }, { Lists: [] }),
      jest.fn()
    )
    expect(engine.applied).toEqual([])
  })
})
