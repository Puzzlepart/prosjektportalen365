import strings from 'ProjectWebPartsStrings'
import { ChecklistItemModel, ProjectPhaseModel } from 'pp365-shared-library/lib/models'

/**
 * Phases as the term store gives them, with the local properties the model reads, and checklist
 * items as the "Fasesjekkliste" list holds them.
 */
export const TERM_SET_ID = '11111111-1111-1111-1111-111111111111'

export function checklistItem(
  ID: number,
  Title: string,
  status = strings.StatusOpen,
  GtComment = ''
) {
  return new ChecklistItemModel({
    ID,
    Title,
    GtComment,
    GtChecklistStatus: status,
    GtProjectPhase: {}
  })
}

export function phase(
  id: string,
  name: string,
  properties: Record<string, string> = {},
  items: ChecklistItemModel[] = []
) {
  const stats = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1
    return acc
  }, {})
  return new ProjectPhaseModel(
    {
      id,
      labels: [{ name, isDefault: true, languageTag: 'nb-NO' }],
      localProperties: [
        {
          setId: TERM_SET_ID,
          properties: Object.entries({ ShowOnFrontpage: 'true', ...properties }).map(
            ([key, value]) => ({
              key,
              value
            })
          )
        }
      ]
    } as any,
    TERM_SET_ID,
    { stats, items }
  )
}
