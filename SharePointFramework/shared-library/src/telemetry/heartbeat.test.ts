import { TELEMETRY_HUB_LANGUAGES } from './contract'
import { attachTelemetryPortal, getTelemetryGate } from './flush'
import { hubLanguageFromLcid, toUsageSnapshot } from './heartbeat'
import {
  HUB_SNAPSHOT,
  hubPage,
  hubPortal,
  ITelemetryTestBed,
  OTHER_HUB_SITE_ID,
  OTHER_HUB_URL,
  projectPage,
  settingsMap,
  settle,
  telemetryStore,
  telemetryTestBed
} from './__fixtures__/testFixtures'
import { queueHeartbeat, requestHeartbeat, startTelemetry, trackUsage } from './track'

/**
 * The hub's heartbeat, level 1: the hub's language from the web's LCID, the hub's installation
 * facts as a heartbeat carries them, and how the Footer's request for a heartbeat is read through
 * the anchor and sent.
 */
describe('hubLanguageFromLcid', () => {
  it('names Norwegian Bokmål and English (United States), and every other language as other', () => {
    expect(hubLanguageFromLcid(1044)).toBe('nb-NO')
    expect(hubLanguageFromLcid(1033)).toBe('en-US')
    // Nynorsk, Swedish and British English are hub languages the contract does not name.
    expect([2068, 1053, 2057].map((lcid) => hubLanguageFromLcid(lcid))).toEqual([
      'other',
      'other',
      'other'
    ])
  })

  it('reads an LCID that is a text, as a page context may hold it', () => {
    expect(hubLanguageFromLcid('1044')).toBe('nb-NO')
    expect(hubLanguageFromLcid('1033')).toBe('en-US')
  })

  it('answers other for a value that is no LCID', () => {
    const answers = [undefined, null, '', 'nb-NO', NaN, {}, true].map((lcid) =>
      hubLanguageFromLcid(lcid)
    )
    expect(answers).toEqual(answers.map(() => 'other'))
  })

  it('gives languages of the contract only', () => {
    ;[1044, 1033, 1030, undefined].forEach((lcid) =>
      expect(TELEMETRY_HUB_LANGUAGES).toContain(hubLanguageFromLcid(lcid))
    )
  })
})

describe('toUsageSnapshot', () => {
  it('keeps the channel, the three-part version and the counts, and names no language', () => {
    expect(
      toUsageSnapshot({
        channel: 'test',
        templateVersion: '1.15.0.a1b2c3d',
        projects: 412,
        programs: 3,
        parentProjects: 0
      })
    ).toEqual({
      channel: 'test',
      templateVersion: '1.15.0',
      projects: 412,
      programs: 3,
      parentProjects: 0
    })
    expect(toUsageSnapshot({ channel: 'main' })).not.toHaveProperty('hubLanguage')
  })

  it('leaves out what was not read, and takes a hub without an installation as unknown', () => {
    expect(toUsageSnapshot({})).toEqual({ channel: 'unknown' })
    expect(toUsageSnapshot({ projects: 7 })).toEqual({ channel: 'unknown', projects: 7 })
    expect(Object.keys(toUsageSnapshot({ channel: 'kurs', programs: undefined }))).toEqual([
      'channel'
    ])
  })

  it('keeps nothing that is not a value of the contract', () => {
    expect(
      toUsageSnapshot({
        channel: 'kunde-x',
        templateVersion: 'siste',
        projects: '12',
        programs: -1,
        parentProjects: 2.5,
        installUser: 'kari@contoso.no',
        installCommand: 'Install.ps1 -Url https://contoso.sharepoint.com/sites/pp'
      } as never)
    ).toEqual({ channel: 'unknown' })
  })
})

describe('requestHeartbeat', () => {
  let bed: ITelemetryTestBed

  beforeEach(() => {
    bed = telemetryTestBed()
  })

  afterEach(() => bed.restore())

  /** A snapshot read that answers when the test says so. */
  function deferredSnapshot() {
    let answer: (snapshot: unknown) => void
    const getUsageSnapshot = jest.fn(() => new Promise((resolve) => (answer = resolve)))
    return { getUsageSnapshot, answer: (snapshot: unknown) => answer(snapshot) }
  }

  it("reads the hub's facts through the anchor and sends the heartbeat at once", async () => {
    startTelemetry(hubPage({ canManageHub: true }))
    const anchor = hubPortal(settingsMap('1'))
    // The Footer's own portal, attached after a web part's: the anchor is the web part's.
    const footer = hubPortal(settingsMap('1'))
    attachTelemetryPortal(anchor, settingsMap('1'))
    attachTelemetryPortal(footer, settingsMap('1'))

    requestHeartbeat('nb-NO')
    await settle()
    expect(anchor.getUsageSnapshot).toHaveBeenCalledTimes(1)
    expect(footer.getUsageSnapshot).not.toHaveBeenCalled()
    expect(bed.batches()).toHaveLength(1)
    expect(bed.batches()[0].level).toBe(1)
    expect(bed.batches()[0].heartbeat).toEqual({
      channel: 'main',
      templateVersion: '1.15.0',
      hubLanguage: 'nb-NO',
      projects: 12,
      programs: 2,
      parentProjects: 3,
      catalog: false
    })
    expect(telemetryStore().heartbeat).toBeUndefined()
  })

  it('waits for the gate: nothing is read while it is pending, and the heartbeat goes when it has decided', async () => {
    startTelemetry(hubPage({ canManageHub: true }))
    const anchor = hubPortal(settingsMap('2'))
    attachTelemetryPortal(anchor)
    requestHeartbeat('en-US')
    expect(getTelemetryGate().reason).toBe('pending')
    expect(telemetryStore().heartbeatRequest).toBe('en-US')
    expect(anchor.getUsageSnapshot).not.toHaveBeenCalled()

    await settle()
    expect(anchor.getUsageSnapshot).toHaveBeenCalledTimes(1)
    expect(telemetryStore().heartbeatRequest).toBeUndefined()
    expect(bed.batches()).toHaveLength(1)
    expect(bed.batches()[0].heartbeat).toEqual({
      ...HUB_SNAPSHOT,
      hubLanguage: 'en-US',
      catalog: true
    })
  })

  it('reads nothing at level 0, whether the level is known when the heartbeat is asked for or after', async () => {
    startTelemetry(hubPage({ canManageHub: true }))
    const anchor = hubPortal(settingsMap('0'))
    attachTelemetryPortal(anchor)
    requestHeartbeat('nb-NO')
    await settle()
    expect(telemetryStore().heartbeatRequest).toBeUndefined()

    requestHeartbeat('nb-NO')
    await settle()
    expect(telemetryStore().heartbeatRequest).toBeUndefined()
    expect(anchor.getUsageSnapshot).not.toHaveBeenCalled()
    bed.leave()
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it('takes a heartbeat only on a hub page, from a user who may manage the hub', async () => {
    const anchor = hubPortal(settingsMap('2'))
    startTelemetry(hubPage())
    attachTelemetryPortal(anchor, settingsMap('2'))
    requestHeartbeat('nb-NO')
    await settle()

    // A project owner manages the project's web, which is not the hub's.
    startTelemetry(projectPage({ canManageHub: true }))
    requestHeartbeat('nb-NO')
    await settle()
    expect(telemetryStore().heartbeatRequest).toBeUndefined()
    expect(anchor.getUsageSnapshot).not.toHaveBeenCalled()
    bed.leave()
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it('reads the facts once per page load, for the two footers of a site with two channels', async () => {
    startTelemetry(hubPage({ canManageHub: true }))
    const anchor = hubPortal(settingsMap('1'))
    attachTelemetryPortal(anchor)
    requestHeartbeat('nb-NO')
    requestHeartbeat('nb-NO')
    await settle()
    requestHeartbeat('nb-NO')
    queueHeartbeat({ channel: 'test', hubLanguage: 'en-US' })
    await settle()
    bed.leave()
    expect(anchor.getUsageSnapshot).toHaveBeenCalledTimes(1)
    expect(bed.batches()).toHaveLength(1)
    expect(bed.batches()[0].heartbeat.channel).toBe('main')
  })

  it('sends what else is in memory with the heartbeat', async () => {
    startTelemetry(hubPage({ canManageHub: true }))
    attachTelemetryPortal(hubPortal(), settingsMap('2'))
    await settle()
    trackUsage('Footer', 'page.viewed')
    requestHeartbeat('nb-NO')
    await settle()
    expect(bed.batches()).toHaveLength(1)
    expect(bed.batches()[0].usage).toEqual([{ c: 'Footer', e: 'page.viewed', s: 'hub', n: 1 }])
    expect(bed.batches()[0].heartbeat.projects).toBe(12)
  })

  it.each([
    ['fails', () => Promise.reject(Object.assign(new Error('[503]'), { status: 503 }))],
    [
      'throws',
      () => {
        throw new Error('disposed')
      }
    ],
    ['answers that the hub is out of reach', () => Promise.resolve(null)],
    ['is not there, as on a portal that cannot read the facts', undefined]
  ])(
    'sends no heartbeat when the read %s, and does not ask again',
    async (_how, getUsageSnapshot) => {
      startTelemetry(hubPage({ canManageHub: true }))
      const read = jest.fn(getUsageSnapshot as () => unknown)
      const anchor = hubPortal(settingsMap('1'), {
        getUsageSnapshot: getUsageSnapshot && read
      })
      attachTelemetryPortal(anchor, settingsMap('1'))
      expect(() => requestHeartbeat('nb-NO')).not.toThrow()
      await settle()
      requestHeartbeat('nb-NO')
      await settle()
      bed.leave()
      expect(bed.fetch).not.toHaveBeenCalled()
      expect(telemetryStore().heartbeat).toBeUndefined()
      expect(telemetryStore().heartbeatQueued).toBe(true)
      expect(read).toHaveBeenCalledTimes(getUsageSnapshot ? 1 : 0)
    }
  )

  it('keeps only values of the contract, whatever the portal answers and the caller says', async () => {
    startTelemetry(hubPage({ canManageHub: true }))
    const anchor = hubPortal(settingsMap('1'), {
      getUsageSnapshot: jest.fn(() =>
        Promise.resolve({
          channel: 'kunde-x',
          templateVersion: '1.15.0.a1b2c3d',
          projects: 100001,
          installUser: 'kari@contoso.no',
          hubLanguage: 'nb-NO',
          catalog: true
        })
      )
    })
    attachTelemetryPortal(anchor, settingsMap('1'))
    requestHeartbeat('sv-SE' as never)
    await settle()
    expect(bed.batches()[0].heartbeat).toEqual({
      channel: 'unknown',
      templateVersion: '1.15.0',
      hubLanguage: 'other',
      catalog: false
    })
    expect(bed.fetch.mock.calls[0][1].body).not.toContain('kari')
  })

  it('does nothing without a language, before telemetry is started or on a page it cannot read', async () => {
    expect(() => requestHeartbeat('nb-NO')).not.toThrow()
    expect(telemetryStore()).toBeUndefined()

    startTelemetry(hubPage({ canManageHub: true }))
    const anchor = hubPortal(settingsMap('1'))
    attachTelemetryPortal(anchor, settingsMap('1'))
    requestHeartbeat(undefined)
    await settle()
    expect(anchor.getUsageSnapshot).not.toHaveBeenCalled()
  })

  it('drops an answer that comes after the page has moved to another hub', async () => {
    const { getUsageSnapshot, answer } = deferredSnapshot()
    startTelemetry(hubPage({ canManageHub: true }))
    attachTelemetryPortal(hubPortal(settingsMap('1'), { getUsageSnapshot }), settingsMap('1'))
    requestHeartbeat('nb-NO')
    await settle()
    expect(getUsageSnapshot).toHaveBeenCalledTimes(1)

    const otherHub = hubPage({
      siteId: OTHER_HUB_SITE_ID,
      hubSiteId: OTHER_HUB_SITE_ID,
      canManageHub: true
    })
    startTelemetry(otherHub)
    attachTelemetryPortal(
      hubPortal(settingsMap('1'), { hubSiteId: OTHER_HUB_SITE_ID, url: OTHER_HUB_URL }),
      settingsMap('1')
    )
    answer({ ...HUB_SNAPSHOT })
    await settle()
    expect(telemetryStore().heartbeat).toBeUndefined()
    bed.leave()
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it('drops an answer that comes after the browser has asked not to be tracked', async () => {
    const { getUsageSnapshot, answer } = deferredSnapshot()
    startTelemetry(hubPage({ canManageHub: true }))
    attachTelemetryPortal(hubPortal(settingsMap('1'), { getUsageSnapshot }), settingsMap('1'))
    requestHeartbeat('nb-NO')
    await settle()

    bed.setNavigator('globalPrivacyControl', true)
    expect(getTelemetryGate()).toEqual({ level: 0, catalog: false, reason: 'privacy-signal' })
    answer({ ...HUB_SNAPSHOT })
    await settle()
    expect(telemetryStore().heartbeat).toBeUndefined()
    bed.leave()
    expect(bed.fetch).not.toHaveBeenCalled()
  })

  it('waits when the gate decides while the user is on another page than the hub, until the Footer asks again there', async () => {
    startTelemetry(hubPage({ canManageHub: true }))
    const anchor = hubPortal(settingsMap('1'))
    attachTelemetryPortal(anchor)
    requestHeartbeat('nb-NO')
    // The user is on a project page by the time the settings are read.
    startTelemetry(projectPage({ canManageHub: false }))
    await settle()
    expect(getTelemetryGate().level).toBe(1)
    expect(anchor.getUsageSnapshot).not.toHaveBeenCalled()

    startTelemetry(hubPage({ canManageHub: true }))
    requestHeartbeat('nb-NO')
    await settle()
    expect(anchor.getUsageSnapshot).toHaveBeenCalledTimes(1)
    expect(bed.batches()).toHaveLength(1)
    expect(bed.batches()[0].heartbeat.hubLanguage).toBe('nb-NO')
  })
})
