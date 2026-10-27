import { PlaceholderName } from '@microsoft/sp-application-base'
import {
  PLACEHOLDER_TRACE_KEY,
  PLACEHOLDER_TRACE_PREFIX,
  tracePlaceholders
} from './placeholderTrace'

/** A customizer context stand-in whose placeholder and navigation events the test fires itself. */
function customizerContext(names: PlaceholderName[] = [PlaceholderName.Top]) {
  const handlers = { changed: [] as Array<() => void>, navigated: [] as Array<() => void> }
  const context = {
    placeholderProvider: {
      placeholderNames: names,
      changedEvent: {
        add: jest.fn((_observer: unknown, handler: () => void) => handlers.changed.push(handler))
      }
    },
    application: {
      navigatedEvent: {
        add: jest.fn((_observer: unknown, handler: () => void) => handlers.navigated.push(handler))
      }
    }
  }
  return { context, handlers }
}

/** The lines of the trace written to the console, parsed. */
function traceLines(info: jest.SpyInstance): Array<Record<string, unknown>> {
  return info.mock.calls
    .filter(([prefix]) => prefix === PLACEHOLDER_TRACE_PREFIX)
    .map(([, json]) => JSON.parse(json))
}

let info: jest.SpyInstance

beforeEach(() => {
  info = jest.spyOn(console, 'info').mockImplementation(() => undefined)
})

afterEach(() => {
  info.mockRestore()
  window.sessionStorage.clear()
  window.localStorage.clear()
  document.body.replaceChildren()
})

describe('tracePlaceholders', () => {
  it('is off unless asked for: it subscribes to nothing and writes nothing', () => {
    const { context } = customizerContext()
    const trace = tracePlaceholders(context as any)
    trace('tryCreateContent', { acquired: false })
    expect(context.placeholderProvider.changedEvent.add).not.toHaveBeenCalled()
    expect(context.application.navigatedEvent.add).not.toHaveBeenCalled()
    expect(info).not.toHaveBeenCalled()
  })

  it('logs the placeholders as it starts, on each change and navigation, and each step it is told', () => {
    window.sessionStorage.setItem(PLACEHOLDER_TRACE_KEY, '1')
    const { context, handlers } = customizerContext([PlaceholderName.Top])
    const trace = tracePlaceholders(context as any)
    // SharePoint defines the bottom placeholder later, and says so.
    context.placeholderProvider.placeholderNames = [PlaceholderName.Top, PlaceholderName.Bottom]
    const bottom = document.createElement('div')
    bottom.setAttribute('data-sp-placeholder', 'Bottom')
    document.body.appendChild(bottom)
    for (const changed of handlers.changed) changed()
    for (const navigated of handlers.navigated) navigated()
    trace('tryCreateContent', { acquired: true })
    const lines = traceLines(info)
    expect(lines).toEqual([
      expect.objectContaining({ step: 'onInit', placeholderNames: ['Top'], bottomElement: false }),
      expect.objectContaining({
        step: 'changedEvent',
        placeholderNames: ['Top', 'Bottom'],
        bottomElement: true
      }),
      expect.objectContaining({ step: 'navigatedEvent' }),
      expect.objectContaining({ step: 'tryCreateContent', acquired: true })
    ])
    expect(lines[0].ms).toEqual(expect.any(Number))
  })

  it('reads the flag from localStorage too, which every new tab shares', () => {
    window.localStorage.setItem(PLACEHOLDER_TRACE_KEY, '1')
    tracePlaceholders(customizerContext().context as any)
    expect(traceLines(info)).toEqual([expect.objectContaining({ step: 'onInit' })])
  })

  it('stays off when the browser refuses its storage', () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    try {
      const { context } = customizerContext()
      tracePlaceholders(context as any)
      expect(context.placeholderProvider.changedEvent.add).not.toHaveBeenCalled()
      expect(info).not.toHaveBeenCalled()
    } finally {
      getItem.mockRestore()
    }
  })
})
