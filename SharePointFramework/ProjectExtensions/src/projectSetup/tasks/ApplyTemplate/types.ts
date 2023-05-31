import { format } from '@uifabric/utilities'
import * as strings from 'ProjectExtensionsStrings'
import { ProvisioningError } from 'sp-js-provisioning'
import { BaseTaskError } from '../@BaseTask'

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

export class ApplyTemplateTaskError extends BaseTaskError {
  /**
   * Creates a new instance of `ApplyTemplateTaskError`
   *
   * @param error Provisioning error from `sp-js-provisioning`
   */
  constructor(error: ProvisioningError) {
    super(
      'ApplyTemplate',
      `${format(strings.ApplyTemplateErrorMessage, error.handler)}: ${error.message}`,
      error
    )
  }
}
