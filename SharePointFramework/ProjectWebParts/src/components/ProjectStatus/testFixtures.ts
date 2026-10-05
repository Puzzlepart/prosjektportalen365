import { SectionModel } from 'pp365-shared-library/lib/models'

/**
 * Stand-ins for the status page's tests: sections as the "Statusseksjoner" list holds them, and a
 * report shaped like `StatusReport` (what the page reads of it), so no test touches PnPjs.
 */
export const STATUS_SECTION_CT = '0x01004CEFE616A94A3A48A27D9DEBDF5EC82802'
export const PROPERTIES_SECTION_CT = '0x01004CEFE616A94A3A48A27D9DEBDF5EC82803'

export function section(
  Id: number,
  Title: string,
  GtSecFieldName: string,
  ContentTypeId = STATUS_SECTION_CT,
  extra: Record<string, any> = {}
) {
  return new SectionModel({
    Id,
    Title,
    GtSecFieldName,
    ContentTypeId,
    GtSecIcon: 'CheckmarkCircle',
    GtSecShowAsSection: true,
    GtSecShowInStatusSection: true,
    GtSortOrder: Id * 10,
    ...extra
  })
}

export function report(values: Record<string, string>, overrides: Record<string, any> = {}) {
  return {
    id: 1,
    published: true,
    publishedDate: new Date('2026-09-01T08:00:00Z'),
    modified: new Date('2026-09-02T08:00:00Z'),
    scopeKey: '',
    snapshotUrl: '',
    persistedSectionData: undefined,
    fieldValues: { _fieldValues: values, _fieldValuesAsText: values },
    getStatusValue: (fieldName: string) => ({
      value: values[fieldName] ?? '',
      comment: values[`${fieldName}Comment`] ?? ''
    }),
    ...overrides
  } as any
}
