import { TimelineGroupType } from 'pp365-shared-library/lib/interfaces'
import { transformItems } from './useResourceAllocationDataFetch'

/**
 * The allocations as timeline items: a bar per allocation or absence in the resource's row, its
 * fill fading with the share allocated and its edge in the full colour, which the timeline
 * darkens where it stands out too little from its rows.
 */
const ABSENCE = '0x010029F45E75BA9CE340A83EFFB2927E11F4'
const GROUPS = [{ id: 0, title: 'Kari Nordmann', type: TimelineGroupType.User }] as any[]
const PROPS = { itemColor: '51,153,51', itemAbsenceColor: '26,111,179' } as any

function result(load: string, contentTypeId: string, absence?: string) {
  return {
    RefinableString71: 'Kari Nordmann',
    RefinableString72: 'Prosjektleder',
    SiteTitle: 'Frisbeegolfbane',
    SiteName: 'https://contoso.sharepoint.com/sites/frisbee',
    ContentTypeId: contentTypeId,
    GtResourceLoadOWSNMBR: load,
    GtResourceAbsenceOWSCHCS: absence,
    GtStartDateOWSDATE: '2026-01-05',
    GtEndDateOWSDATE: '2026-03-01'
  } as any
}

describe('transformItems', () => {
  it('edges each bar in its full colour, while its fill fades with the allocation (WCAG 1.4.11)', () => {
    const [allocation, absence] = transformItems(
      [result('0.5', '0x0100AB'), result('1', `${ABSENCE}00`, 'Ferie')],
      GROUPS,
      PROPS
    )
    expect(allocation.title).toBe('Prosjektleder - Frisbeegolfbane (50%)')
    expect(allocation.itemProps.style.backgroundColor).toBe('rgba(51,153,51, 0.5)')
    expect(allocation.data.edgeColor).toBe('rgb(51,153,51)')
    expect(absence.title).toBe('Ferie (100%)')
    expect(absence.data.edgeColor).toBe('rgb(26,111,179)')
  })
})
