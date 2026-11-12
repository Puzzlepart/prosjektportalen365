import { SPFxContext } from 'pp365-shared-library'
import { EditableSPField } from 'pp365-shared-library/lib/models'
import { IProjectInformationState } from '../types'

/** Builds localized editable properties from loaded fields and template settings, ordered by column. */
export function createProperties(state: IProjectInformationState, spfxContext: SPFxContext) {
  const currentLocale = spfxContext.pageContext.cultureInfo.currentUICultureName.toLowerCase()

  return state.data.fields
    .map((field) =>
      new EditableSPField(field)
        .init(state.data.columns, currentLocale, state.data.template?.fieldConfiguration)
        .setValue(state.data.fieldValues)
    )
    .sort((a, b) => {
      if (!a.column) return 1
      if (!b.column) return -1
      return a.column.sortOrder - b.column.sortOrder
    })
}
