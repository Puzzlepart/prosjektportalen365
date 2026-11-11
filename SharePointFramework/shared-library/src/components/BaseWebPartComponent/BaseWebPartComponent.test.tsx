// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Every `@pnp/*` import maps to the one PnP stub, so this mock is
// all of them in this file: it keeps the stub and only replaces `Logger` with one that records.
const logged: any[] = []
jest.mock('@pnp/logging', () => {
  const stub = jest.requireActual('@pnp/logging')
  const Logger = { log: (entry: any) => logged.push(entry) }
  return new Proxy(stub, { get: (target, prop) => (prop === 'Logger' ? Logger : target[prop]) })
})

import * as React from 'react'
import { BaseWebPartComponent } from '.'

// The stub's real `LogLevel` values, read from the mock rather than imported from `@pnp/*`.
const { LogLevel } = jest.requireMock('@pnp/logging')

class StatusComponent extends BaseWebPartComponent<any, any> {
  constructor(props: any) {
    super('StatusComponent', props, { isDataLoaded: false })
  }
  public render(): JSX.Element {
    return <div />
  }
}

describe('BaseWebPartComponent', () => {
  it('starts with the state it is given', () => {
    expect(new StatusComponent({}).state).toEqual({ isDataLoaded: false })
  })

  it('logs under its name and the scope of the call, at each level', () => {
    const component = new StatusComponent({})
    component.logInfo('Hentet rapportene', 'fetchData', { count: 3 })
    component.logWarning('Ingen seksjoner', 'fetchData')
    component.logError('Kunne ikke lagre', 'save')
    expect(logged).toEqual([
      {
        message: '(StatusComponent) (fetchData) Hentet rapportene',
        data: { count: 3 },
        level: LogLevel.Info
      },
      {
        message: '(StatusComponent) (fetchData) Ingen seksjoner',
        data: undefined,
        level: LogLevel.Warning
      },
      {
        message: '(StatusComponent) (save) Kunne ikke lagre',
        data: undefined,
        level: LogLevel.Error
      }
    ])
  })
})
