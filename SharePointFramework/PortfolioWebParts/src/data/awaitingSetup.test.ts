import {
  AWAITING_SETUP_CANDIDATE_LIMIT,
  findSitesAwaitingSetup,
  IGroupSiteProbe,
  IOwnedGroup,
  isAwaitingSetup,
  PROJECT_SETUP_COMPONENT_IDS,
  selectAwaitingSetupCandidates
} from './awaitingSetup'

const HUB = '11111111-1111-1111-1111-111111111111'
const NOW = new Date('2026-11-26T12:00:00Z')

/** A Microsoft 365 group created the given number of days before `NOW`. */
function group(id: string, daysOld: number, overrides: Partial<IOwnedGroup> = {}): IOwnedGroup {
  return {
    id,
    displayName: `Gruppe ${id}`,
    createdDateTime: new Date(NOW.getTime() - daysOld * 24 * 60 * 60 * 1000).toISOString(),
    groupTypes: ['Unified'],
    ...overrides
  }
}

/** What is read from a site of the hub that still carries the setup extension. */
function probe(overrides: Partial<IGroupSiteProbe> = {}): IGroupSiteProbe {
  return {
    url: 'https://contoso.sharepoint.com/sites/nytt',
    siteId: '22222222-2222-2222-2222-222222222222',
    hubSiteId: HUB,
    customActionComponentIds: [PROJECT_SETUP_COMPONENT_IDS[0]],
    ...overrides
  }
}

describe('selectAwaitingSetupCandidates', () => {
  it('keeps the Microsoft 365 groups within the age limit that no project belongs to, newest first', () => {
    const candidates = selectAwaitingSetupCandidates(
      [
        group('old', 61),
        group('week', 7),
        group('today', 0),
        group('project', 1),
        group('security', 1, { groupTypes: [] }),
        group('undated', 1, { createdDateTime: undefined })
      ],
      ['{PROJECT}', null],
      60,
      NOW
    )
    expect(candidates.map(({ id }) => id)).toEqual(['today', 'week'])
  })

  it('looks none up when the limit is 0 or not set', () => {
    expect(selectAwaitingSetupCandidates([group('a', 1)], [], 0, NOW)).toEqual([])
    expect(selectAwaitingSetupCandidates([group('a', 1)], [], undefined, NOW)).toEqual([])
  })

  it('stops at the newest groups, so a user who owns many costs a bounded number of requests', () => {
    const groups = Array.from({ length: AWAITING_SETUP_CANDIDATE_LIMIT + 5 }, (_, index) =>
      group(`g${index}`, index)
    )
    const candidates = selectAwaitingSetupCandidates(groups, [], 60, NOW)
    expect(candidates).toHaveLength(AWAITING_SETUP_CANDIDATE_LIMIT)
    expect(candidates[0].id).toBe('g0')
  })
})

describe('isAwaitingSetup', () => {
  it('is a site of the hub that carries the setup extension of any channel', () => {
    for (const id of PROJECT_SETUP_COMPONENT_IDS) {
      expect(isAwaitingSetup(probe({ customActionComponentIds: [id.toUpperCase()] }), HUB)).toBe(
        true
      )
    }
    expect(isAwaitingSetup(probe({ hubSiteId: `{${HUB.toUpperCase()}}` }), HUB)).toBe(true)
  })

  it('is not a site joined to the hub without the setup extension, which is no project', () => {
    expect(isAwaitingSetup(probe({ customActionComponentIds: [] }), HUB)).toBe(false)
    expect(isAwaitingSetup(probe({ customActionComponentIds: ['another'] }), HUB)).toBe(false)
  })

  it('is not a site of another hub or of none, the hub itself, or a site that was not read', () => {
    const none = '00000000-0000-0000-0000-000000000000'
    expect(isAwaitingSetup(probe({ hubSiteId: none }), HUB)).toBe(false)
    expect(isAwaitingSetup(probe({ hubSiteId: 'another-hub' }), HUB)).toBe(false)
    expect(isAwaitingSetup(probe({ siteId: HUB }), HUB)).toBe(false)
    expect(isAwaitingSetup(undefined, HUB)).toBe(false)
  })
})

describe('findSitesAwaitingSetup', () => {
  it('gives the sites that await the setup, by their group, and leaves out a site that fails to read', async () => {
    const probes: Record<string, () => Promise<IGroupSiteProbe | undefined>> = {
      ready: () => Promise.resolve(probe({ url: '/sites/ready', siteId: 'site-ready' })),
      provisioning: () => Promise.resolve(undefined),
      denied: () => Promise.reject(new Error('403')),
      other: () => Promise.resolve(probe({ customActionComponentIds: [] }))
    }
    const sites = await findSitesAwaitingSetup(
      Object.keys(probes).map((id) => group(id, 1)),
      HUB,
      (groupId) => probes[groupId]()
    )
    expect(sites).toEqual([
      { groupId: 'ready', siteId: 'site-ready', title: 'Gruppe ready', url: '/sites/ready' }
    ])
  })
})
