import { ProjectTemplate } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import { NO_TEMPLATE_ID } from './constants'

/**
 * Creates a special "No template" option that can be used to run
 * the setup wizard without applying a template.
 */
export const createNoTemplateOption = (): ProjectTemplate => {
  return new ProjectTemplate(
    {
      Id: NO_TEMPLATE_ID,
      IsDefaultTemplate: false,
      IsDefaultExtensionsLocked: false,
      IsDefaultListContentLocked: false,
      IsAutoConfigurable: false,
      IconName: 'PageRemove',
      ListContentConfigLookupId: [],
      FieldConfigurationName: null,
      File: null,
      FieldValuesAsText: {
        Title: strings.NoTemplateLabel,
        GtDescription: strings.NoTemplateDescription
      },
      GtProjectTemplateId: NO_TEMPLATE_ID,
      GtProjectExtensionsId: [],
      GtProjectColumns: null,
      GtProjectCustomColumns: null,
      GtProjectContentType: null,
      GtProjectStatusContentType: null,
      GtIsProgram: false,
      GtIsParentProject: false,
      IsHiddenTemplate: false,
      GtProjectPhaseTermId: null,
      GtDocumentTemplateLibrary: null,
      GtTimelineContentType: null
    },
    null
  )
}
