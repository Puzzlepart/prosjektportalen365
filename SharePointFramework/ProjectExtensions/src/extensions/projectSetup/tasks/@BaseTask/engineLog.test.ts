// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. `@pnp/logging` gets a working `Logger`, which the engine and
// the setup share on a page; DEBUG sets the engine's log level.
;(globalThis as any).DEBUG = false
jest.mock('@pnp/logging', () => jest.requireActual('../testFixtures').fakeLogging())

import { captureEngineLog, engineLogLevel } from '.'

const PREFIX = '(ProjectSetup) (ApplyTemplate)'

/** Logs `lines` (`[level, message]`) through the page's `Logger`, as the engine does. */
const log = (lines: Array<[number, string]>) => () => {
  const { Logger } = jest.requireMock('@pnp/logging')
  lines.forEach(([level, message]) => Logger.log({ message, level }))
  return Promise.resolve('applied')
}

beforeEach(() => {
  jest.requireMock('@pnp/logging').Logger.activeLogLevel = 1
  sessionStorage.clear()
})

describe('captureEngineLog', () => {
  it('sends on the warnings and errors logged while the template is applied, without the prefix', async () => {
    const forward = jest.fn()
    const result = await captureEngineLog(
      log([
        [1, `${PREFIX} (Lists): (processList): Processing list Prosjektlogg`],
        [2, `${PREFIX} (Lists): (processFields): Field GtGainLookup keeps its target`],
        [3, '(Files): Failed to add file Prosjektforside.aspx'],
        [3, '']
      ]),
      forward,
      PREFIX
    )
    expect(result).toBe('applied')
    expect(forward.mock.calls.map(([entry]) => entry)).toEqual([
      {
        message: '(Lists): (processFields): Field GtGainLookup keeps its target',
        level: 'warning'
      },
      { message: '(Files): Failed to add file Prosjektforside.aspx', level: 'error' }
    ])
  })

  it('leaves the engine alone when sending a line on fails, and stops when the template is applied', async () => {
    const forward = jest.fn(() => {
      throw new Error('The dialog is gone')
    })
    await expect(captureEngineLog(log([[3, 'Failed']]), forward)).resolves.toBe('applied')
    await log([[3, 'Another error on the page']])()
    expect(forward).toHaveBeenCalledTimes(1)
  })

  it('stops when the template fails as well', async () => {
    const forward = jest.fn()
    await expect(
      captureEngineLog(() => Promise.reject(new Error('Navigation failed')), forward)
    ).rejects.toThrow('Navigation failed')
    await log([[3, 'Another error on the page']])()
    expect(forward).not.toHaveBeenCalled()
  })
})

describe('engineLogLevel', () => {
  it('is warnings and errors, and information as well when debugging', () => {
    expect(engineLogLevel()).toBe(2)
    sessionStorage.DEBUG = '1'
    expect(engineLogLevel()).toBe(1)
  })
})
