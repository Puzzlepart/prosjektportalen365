import {
  CATALOG_TELEMETRY_KEY,
  DISABLE_TELEMETRY_FLAG,
  ITelemetryGateInput,
  readTelemetrySignals,
  resolveTelemetryGate,
  USAGE_STATISTICS_LEVEL_KEY
} from './gate'

/** The settings of a hub at a level, with the catalog's row as given (`undefined`: no row). */
function settings(level?: string, catalog?: string): Map<string, string> {
  const map = new Map<string, string>([['ShowFooter', '1']])
  if (level !== undefined) map.set(USAGE_STATISTICS_LEVEL_KEY, level)
  if (catalog !== undefined) map.set(CATALOG_TELEMETRY_KEY, catalog)
  return map
}

/** An open gate at Standard, which each test closes in its own way. */
function input(overrides: Partial<ITelemetryGateInput> = {}): ITelemetryGateInput {
  return {
    testerFlag: null,
    globalPrivacyControl: undefined,
    doNotTrack: null,
    hasAnchor: true,
    anchorAvailable: true,
    settings: settings('2', '1'),
    ...overrides
  }
}

/**
 * The gate decides for every sender, and it is fail-closed: only an explicit, valid level row on
 * the page's own hub opens it, and each rule ahead of that row closes it whatever the row says.
 */
describe('resolveTelemetryGate', () => {
  it('gives the level of the setting when nothing closes the gate', () => {
    expect(resolveTelemetryGate(input())).toEqual({ level: 2, catalog: true, reason: 'setting' })
  })

  it.each([
    ['0', 0],
    ['1', 1],
    ['2', 2],
    ['3', 3],
    [' 2 ', 2],
    ['3\n', 3]
  ])('rule 8: the value %j gives level %d', (value, level) => {
    const gate = resolveTelemetryGate(input({ settings: settings(value) }))
    expect(gate.level).toBe(level)
    expect(gate.reason).toBe('setting')
  })

  it('rule 1: the tester flag closes the gate, only as exactly 1', () => {
    expect(resolveTelemetryGate(input({ testerFlag: '1' }))).toEqual({
      level: 0,
      catalog: false,
      reason: 'tester-flag'
    })
    expect(resolveTelemetryGate(input({ testerFlag: '0' })).level).toBe(2)
    expect(resolveTelemetryGate(input({ testerFlag: 'true' })).level).toBe(2)
    expect(resolveTelemetryGate(input({ testerFlag: undefined })).level).toBe(2)
  })

  it("rule 2: the browser's privacy signal closes the gate", () => {
    expect(resolveTelemetryGate(input({ globalPrivacyControl: true }))).toEqual({
      level: 0,
      catalog: false,
      reason: 'privacy-signal'
    })
    expect(resolveTelemetryGate(input({ doNotTrack: '1' })).reason).toBe('privacy-signal')
    // Only the signals themselves: a browser without them, or with them off, sends.
    expect(resolveTelemetryGate(input({ globalPrivacyControl: false })).level).toBe(2)
    expect(resolveTelemetryGate(input({ globalPrivacyControl: 'true' })).level).toBe(2)
    expect(resolveTelemetryGate(input({ doNotTrack: '0' })).level).toBe(2)
    expect(resolveTelemetryGate(input({ doNotTrack: 'unspecified' })).level).toBe(2)
    expect(resolveTelemetryGate(input({ doNotTrack: 1 })).level).toBe(2)
  })

  it('rule 3: a page without a portal of its own hub sends nothing', () => {
    expect(resolveTelemetryGate(input({ hasAnchor: false }))).toEqual({
      level: 0,
      catalog: false,
      reason: 'no-anchor'
    })
  })

  it('rule 4: a hub that is not available sends nothing', () => {
    expect(resolveTelemetryGate(input({ anchorAvailable: false }))).toEqual({
      level: 0,
      catalog: false,
      reason: 'anchor-unavailable'
    })
  })

  it('rule 5: CatalogTelemetryEnabled 0 stops everything, whatever the level', () => {
    expect(resolveTelemetryGate(input({ settings: settings('3', '0') }))).toEqual({
      level: 0,
      catalog: false,
      reason: 'catalog-opt-out'
    })
    expect(resolveTelemetryGate(input({ settings: settings('2', ' 0 ') })).reason).toBe(
      'catalog-opt-out'
    )
    expect(resolveTelemetryGate(input({ settings: settings(undefined, '0') })).reason).toBe(
      'catalog-opt-out'
    )
  })

  it('rule 6: without a level row nothing is sent: the default never comes from code', () => {
    const closed = { level: 0, catalog: false, reason: 'no-level' }
    // A missing row and a disabled one look the same: the map holds enabled rows only.
    expect(resolveTelemetryGate(input({ settings: settings(undefined, '1') }))).toEqual(closed)
    // A hub that could not be read gives an empty map, and a failed read none at all.
    expect(resolveTelemetryGate(input({ settings: new Map() }))).toEqual(closed)
    expect(resolveTelemetryGate(input({ settings: undefined }))).toEqual(closed)
  })

  it.each([[''], ['  '], ['2.0'], ['Standard'], ['4'], ['-1'], ['02'], ['2,0'], ['1 2'], ['two']])(
    'rule 7: the value %j is no level',
    (value) => {
      expect(resolveTelemetryGate(input({ settings: settings(value, '1') }))).toEqual({
        level: 0,
        catalog: false,
        reason: 'invalid-level'
      })
    }
  )

  it('rule 7: a level row without a text value is no level', () => {
    const map = settings(undefined, '1')
    map.set(USAGE_STATISTICS_LEVEL_KEY, null)
    expect(resolveTelemetryGate(input({ settings: map })).reason).toBe('invalid-level')
    map.set(USAGE_STATISTICS_LEVEL_KEY, 2 as unknown as string)
    expect(resolveTelemetryGate(input({ settings: map })).reason).toBe('invalid-level')
  })

  it('applies the rules in order: the first that matches gives the reason', () => {
    const everything: ITelemetryGateInput = {
      testerFlag: '1',
      globalPrivacyControl: true,
      doNotTrack: '1',
      hasAnchor: false,
      anchorAvailable: false,
      settings: settings('x', '0')
    }
    const reasons = [
      { testerFlag: null },
      { globalPrivacyControl: false, doNotTrack: '0' },
      { hasAnchor: true },
      { anchorAvailable: true },
      { settings: settings('x', '1') },
      { settings: settings('2', '1') }
    ].map((change) => {
      const reason = resolveTelemetryGate(everything).reason
      Object.assign(everything, change)
      return reason
    })
    expect(reasons).toEqual([
      'tester-flag',
      'privacy-signal',
      'no-anchor',
      'anchor-unavailable',
      'catalog-opt-out',
      'invalid-level'
    ])
    expect(resolveTelemetryGate(everything).reason).toBe('setting')
  })

  describe('the catalog flag', () => {
    it.each([
      ['0', false],
      ['1', false],
      ['2', true],
      ['3', true]
    ])('at level %s with CatalogTelemetryEnabled 1 it is %j', (level, catalog) => {
      expect(resolveTelemetryGate(input({ settings: settings(level, '1') })).catalog).toBe(catalog)
    })

    it.each([[undefined], ['true'], ['on'], ['2'], ['']])(
      'needs exactly 1: %j gives no catalog events, and leaves the level alone',
      (value) => {
        expect(resolveTelemetryGate(input({ settings: settings('3', value) }))).toEqual({
          level: 3,
          catalog: false,
          reason: 'setting'
        })
      }
    )

    it('takes 1 with whitespace around it', () => {
      expect(resolveTelemetryGate(input({ settings: settings('2', ' 1 ') })).catalog).toBe(true)
    })

    it('is off when the value is 0, with everything else', () => {
      expect(resolveTelemetryGate(input({ settings: settings('3', '0') })).catalog).toBe(false)
    })

    it('is off whenever a rule closes the gate', () => {
      expect(resolveTelemetryGate(input({ testerFlag: '1' })).catalog).toBe(false)
      expect(resolveTelemetryGate(input({ doNotTrack: '1' })).catalog).toBe(false)
      expect(resolveTelemetryGate(input({ hasAnchor: false })).catalog).toBe(false)
      expect(resolveTelemetryGate(input({ anchorAvailable: false })).catalog).toBe(false)
    })
  })
})

describe('readTelemetrySignals', () => {
  afterEach(() => {
    window.sessionStorage.clear()
    delete (navigator as any).globalPrivacyControl
    delete (navigator as any).doNotTrack
    jest.restoreAllMocks()
  })

  it("reads the tester flag from session storage and the browser's two signals", () => {
    window.sessionStorage.setItem(DISABLE_TELEMETRY_FLAG, '1')
    Object.defineProperty(navigator, 'globalPrivacyControl', { configurable: true, value: true })
    Object.defineProperty(navigator, 'doNotTrack', { configurable: true, value: '1' })
    expect(readTelemetrySignals()).toEqual({
      testerFlag: '1',
      globalPrivacyControl: true,
      doNotTrack: '1'
    })
  })

  it('reads nothing else from storage', () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem')
    expect(readTelemetrySignals().testerFlag).toBeNull()
    expect(getItem.mock.calls).toEqual([[DISABLE_TELEMETRY_FLAG]])
    expect(getItem.mock.contexts[0]).toBe(window.sessionStorage)
  })

  it('takes storage that cannot be read as the flag being set', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('The operation is insecure.')
    })
    const signals = readTelemetrySignals()
    expect(signals.testerFlag).toBe('1')
    expect(resolveTelemetryGate(input(signals)).reason).toBe('tester-flag')
  })
})
