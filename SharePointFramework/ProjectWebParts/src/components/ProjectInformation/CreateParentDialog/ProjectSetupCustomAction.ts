import resources from 'SharedResources'

export const createProjectSetupCustomAction = (progressTitle: string): Record<string, any> => ({
  Title: 'ProjectSetup',
  Location: 'ClientSideExtension.ApplicationCustomizer',
  ClientSideComponentId: 'ce34553d-ab47-4107-8dd1-e980d953996d',
  ClientSideComponentProperties: JSON.stringify({
    templatesLibrary: resources.Lists_TemplateOptions_Title,
    extensionsLibrary: resources.Lists_ProjectExtensions_Title,
    projectsList: resources.Lists_Projects_Title,
    contentConfigList: resources.Lists_ListContent_Title,
    termSetIds: {
      GtProjectPhase: 'abcfc9d9-a263-4abb-8234-be973c46258a',
      GtResourceRole: '54da9f47-c64e-4a26-80f3-4d3c3fa1b7b2'
    },
    forceTemplate: resources.Lists_TemplateOptions_ParentTemplate_Title,
    progressDialogContentProps: {
      title: progressTitle
    },
    skipUpdateTemplateParameters: true
  })
})
