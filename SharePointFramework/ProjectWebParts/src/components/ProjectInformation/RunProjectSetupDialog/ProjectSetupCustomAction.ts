import resource from 'SharedResources'
import { PROJECT_SETUP_COMPONENT_ID } from '../projectSetupComponentId'

/**
 * Creates a custom action for running the setup wizard.
 * Unlike the parent template, `forceTemplate` names no template
 * (`__SELECT_TEMPLATE__`), so the user selects which template to apply,
 * while the setup still knows it runs again: it skips the already set up
 * check and adds back the links the owners had added to the menu.
 */
export const createProjectSetupCustomAction = (progressTitle: string): Record<string, any> => ({
  Title: 'ProjectSetup',
  Location: 'ClientSideExtension.ApplicationCustomizer',
  ClientSideComponentId: PROJECT_SETUP_COMPONENT_ID,
  ClientSideComponentProperties: JSON.stringify({
    templatesLibrary: resource.Lists_TemplateLibrary_Url,
    extensionsLibrary: resource.Lists_ProjectExtensions_Title,
    projectsList: resource.Lists_Projects_Title,
    contentConfigList: resource.Lists_ListContent_Title,
    termSetIds: {
      GtProjectPhase: 'abcfc9d9-a263-4abb-8234-be973c46258a',
      GtResourceRole: '54da9f47-c64e-4a26-80f3-4d3c3fa1b7b2'
    },
    progressDialogContentProps: {
      title: progressTitle
    },
    skipUpdateTemplateParameters: true,
    skipAlreadySetupCheck: true,
    forceTemplate: '__SELECT_TEMPLATE__'
  })
})
