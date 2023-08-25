import { SPFxContext } from 'pp365-shared-library'
import { ProjectInformationField } from 'pp365-shared-library/lib/models'
import { IProjectInformationState } from '../types'

/**
 * Create properties from the `state`. Also `webPartContext` is needed to get the current locale.
 * The field configuration from the `template` is used to determine what configuration to use
 * for the `ProjectInformationField` objects.
 *
 * @param state State of the `ProjectInformation` component.
 * @param spfxContext SPFx context
 */
export function createProperties(state: IProjectInformationState, spfxContext: SPFxContext) {
  const currentLocale = spfxContext.pageContext.cultureInfo.currentUICultureName.toLowerCase()
  return state.data.fields
    .map((field) =>
      new ProjectInformationField(field)
        .init(state.data.columns, currentLocale, state.data.template?.fieldConfiguration)
        .setValue(state.data.fieldValues)
    )
    .sort((a, b) => {
      if (!a.column) return 1
      if (!b.column) return -1
      return a.column.sortOrder - b.column.sortOrder
    })
}
