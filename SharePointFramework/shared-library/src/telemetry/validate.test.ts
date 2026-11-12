import {
  isTelemetryComponent,
  isTelemetryErrorCode,
  isTelemetrySiteType,
  isTelemetryTimingMetric,
  isTelemetryUsage,
  normalizeGuid,
  normalizeHost,
  normalizeHubUrl,
  normalizeVersion,
  sanitizeHeartbeat,
  telemetryHttpStatus,
  timingBucketOf,
  utf8ByteLength
} from './validate'

const HOST = 'contoso.sharepoint.com'

/** The runtime checks behind the typed tracking calls: only what the contract names gets through. */
describe('the contract checks', () => {
  it('know the components, site types, error codes and metrics of the contract', () => {
    expect(isTelemetryComponent('Footer')).toBe(true)
    expect(isTelemetryComponent('ProgramAdministrationWebpart')).toBe(true)
    expect(isTelemetryComponent('ProgramAdministrationWebPart')).toBe(false)
    expect(isTelemetryComponent('ProjectUpgrade')).toBe(false)
    expect(isTelemetryComponent('footer')).toBe(false)
    expect(isTelemetryComponent(undefined)).toBe(false)
    expect(isTelemetrySiteType('parent')).toBe(true)
    expect(isTelemetrySiteType('portfolio')).toBe(false)
    expect(isTelemetryErrorCode('render_failed')).toBe(true)
    expect(isTelemetryErrorCode('Render failed')).toBe(false)
    expect(isTelemetryTimingMetric('init')).toBe(true)
    expect(isTelemetryTimingMetric('dataLoad')).toBe(false)
    expect(telemetryHttpStatus(404)).toBe(404)
    expect(telemetryHttpStatus(418)).toBeUndefined()
    expect(telemetryHttpStatus('404')).toBeUndefined()
  })

  it('let a component count only its own events, with their own variants', () => {
    expect(isTelemetryUsage('Footer', 'page.viewed')).toBe(true)
    expect(isTelemetryUsage('Footer', 'page.viewed', null)).toBe(true)
    expect(isTelemetryUsage('ProjectSetup', 'setup.completed', 'rerun')).toBe(true)
    expect(isTelemetryUsage('ProjectSetup', 'setup.completed')).toBe(true)
    expect(isTelemetryUsage('ProjectSetup', 'setup.completed', 'approve')).toBe(false)
    expect(isTelemetryUsage('ProjectSetup', 'setup.failed', 'new')).toBe(false)
    expect(isTelemetryUsage('Footer', 'loaded')).toBe(false)
    expect(isTelemetryUsage('Footer', 'toString')).toBe(false)
    expect(isTelemetryUsage('Footer', 'hasOwnProperty')).toBe(false)
    expect(isTelemetryUsage('Footer', 7)).toBe(false)
    expect(isTelemetryUsage(undefined, 'page.viewed')).toBe(false)
  })

  it('put a duration in its bucket', () => {
    expect([0, 249.9, 250, 7999, 8000].map(timingBucketOf)).toEqual([0, 0, 1, 5, 6])
    expect([-0.1, NaN, Infinity, '5', null].map(timingBucketOf)).toEqual([-1, -1, -1, -1, -1])
  })
})

describe('the normalisers', () => {
  it('normalizeGuid strips braces, lowercases, and takes only a GUID that is not empty', () => {
    const guid = '5c7d2f6a-3b1e-4d8c-9a0f-6e2b1c4d7f80'
    expect(normalizeGuid(`{${guid.toUpperCase()}}`)).toBe(guid)
    expect(normalizeGuid(` ${guid} `)).toBe(guid)
    expect(normalizeGuid('00000000-0000-0000-0000-000000000000')).toBe('')
    expect(normalizeGuid(guid.replace(/-/g, ''))).toBe('')
    expect(normalizeGuid(`${guid}0`)).toBe('')
    expect(normalizeGuid('')).toBe('')
    expect(normalizeGuid(undefined)).toBe('')
    expect(normalizeGuid({ toString: () => guid })).toBe('')
  })

  it('normalizeHost takes a SharePoint Online host only', () => {
    expect(normalizeHost('Contoso.SharePoint.com')).toBe(HOST)
    expect(normalizeHost('contoso-my.sharepoint.com')).toBe('contoso-my.sharepoint.com')
    expect(normalizeHost('contoso.sharepoint.com:443')).toBe('')
    expect(normalizeHost('contoso.sharepoint.com.example.org')).toBe('')
    expect(normalizeHost('sharepoint.com')).toBe('')
    expect(normalizeHost('a.b.sharepoint.com')).toBe('')
    expect(normalizeHost('localhost')).toBe('')
    expect(normalizeHost(`${'a'.repeat(120)}.sharepoint.com`)).toBe('')
    expect(normalizeHost(undefined)).toBe('')
  })

  it('normalizeHubUrl takes a site collection on the host, and gives it without a trailing slash', () => {
    expect(normalizeHubUrl('https://contoso.sharepoint.com/sites/PP365/', HOST)).toBe(
      'https://contoso.sharepoint.com/sites/pp365'
    )
    expect(normalizeHubUrl('https://contoso.sharepoint.com/teams/pp', HOST)).toBe(
      'https://contoso.sharepoint.com/teams/pp'
    )
    expect(normalizeHubUrl('https://contoso.sharepoint.com', HOST)).toBe(
      'https://contoso.sharepoint.com'
    )
    expect(normalizeHubUrl('https://contoso.sharepoint.com/sites/pp/sub', HOST)).toBe('')
    expect(normalizeHubUrl('https://contoso.sharepoint.com/personal/kari', HOST)).toBe('')
    expect(normalizeHubUrl('https://contoso.sharepoint.com/sites/pp?x=1', HOST)).toBe('')
    expect(normalizeHubUrl('https://contoso.sharepoint.com/sites/p p', HOST)).toBe('')
    expect(normalizeHubUrl('/sites/pp', HOST)).toBe('')
    expect(normalizeHubUrl('https://contoso.sharepoint.com/sites/pp', '')).toBe('')
    expect(normalizeHubUrl(undefined, HOST)).toBe('')
    expect(normalizeHubUrl(`https://contoso.sharepoint.com/sites/${'p'.repeat(500)}`, HOST)).toBe(
      ''
    )
  })

  it('normalizeVersion gives the three-part version', () => {
    expect(normalizeVersion('1.15.0')).toBe('1.15.0')
    expect(normalizeVersion('1.15.0.0')).toBe('1.15.0')
    expect(normalizeVersion('1.15.0.a1b2c3d')).toBe('1.15.0')
    expect(normalizeVersion('1.15.0-beta.1')).toBe('1.15.0')
    expect(normalizeVersion(' 1.15.0 ')).toBe('1.15.0')
    expect(normalizeVersion('1.15')).toBe('')
    expect(normalizeVersion('v1.15.0')).toBe('')
    expect(normalizeVersion('1.1500.0')).toBe('')
    expect(normalizeVersion('*')).toBe('')
    expect(normalizeVersion(undefined)).toBe('')
  })

  it('sanitizeHeartbeat keeps the fields and values of the contract', () => {
    expect(
      sanitizeHeartbeat({
        channel: 'i18n',
        templateVersion: '1.15.0',
        hubLanguage: 'en-US',
        projects: 0,
        programs: 100000,
        parentProjects: 3
      })
    ).toEqual({
      channel: 'i18n',
      templateVersion: '1.15.0',
      hubLanguage: 'en-US',
      projects: 0,
      programs: 100000,
      parentProjects: 3
    })
    expect(sanitizeHeartbeat(undefined)).toEqual({ channel: 'unknown', hubLanguage: 'other' })
    expect(
      sanitizeHeartbeat({
        channel: 'main',
        hubLanguage: 'nb-NO',
        templateVersion: 'Standardmal',
        projects: '12',
        programs: 1.5,
        parentProjects: NaN
      } as never)
    ).toEqual({ channel: 'main', hubLanguage: 'nb-NO' })
  })

  it('utf8ByteLength counts the bytes of a text as it is sent', () => {
    expect(utf8ByteLength('')).toBe(0)
    expect(utf8ByteLength('{"n":1}')).toBe(7)
    expect(utf8ByteLength('æøå')).toBe(6)
    expect(utf8ByteLength('€')).toBe(3)
    expect(utf8ByteLength('😀')).toBe(4)
    expect(utf8ByteLength('a😀b')).toBe(6)
  })
})
