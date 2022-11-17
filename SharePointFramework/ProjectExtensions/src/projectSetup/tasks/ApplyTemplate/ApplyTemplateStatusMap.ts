import * as strings from 'ProjectExtensionsStrings'

export const APPLY_TEMPLATE_STATUS_MAP: Record<string, { text: string; iconName: string }> = {
  Files: { text: strings.ApplyTemplateFiles, iconName: 'OpenFile' },
  Lists: { text: strings.ApplyTemplateLists, iconName: 'PageListSolid' },
  Navigation: { text: strings.ApplyTemplateNavigation, iconName: 'MiniLink' },
  WebSettings: { text: strings.ApplyTemplateWebSettings, iconName: 'Settings' },
  ComposedLook: { text: strings.ApplyTemplateComposedLook, iconName: 'Design' },
  SiteFields: { text: strings.ApplyTemplateSiteFields, iconName: 'NumberField' },
  ContentTypes: { text: strings.ApplyTemplateContentTypes, iconName: 'ExploreContent' },
  ClientSidePages: { text: strings.ApplyTemplateClientSidePages, iconName: 'Page' }
}
