import { format } from '@uifabric/utilities'
import * as strings from 'ProjectExtensionsStrings'
import { ProvisioningError, Schema } from 'sp-js-provisioning'
import { BaseTaskError } from '../@BaseTask'

interface IApplyTemplateStatus {
  text: string
  iconName: string

  /**
   * Returns one advanced log message per item the handler will apply,
   * enumerated from the template schema. The provisioning library gives
   * no per-item feedback, so the messages are emitted when the handler starts.
   */
  getLogMessages?: (schema: Schema) => string[]
}

export const APPLY_TEMPLATE_STATUS_MAP = new Map<string, IApplyTemplateStatus>([
  ['Files', { text: strings.ApplyTemplateFiles, iconName: 'OpenFile' }],
  [
    'Lists',
    {
      text: strings.ApplyTemplateLists,
      iconName: 'PageListSolid',
      getLogMessages: (schema) => (schema.Lists ?? []).map((list) => `Applying list: ${list.Title}`)
    }
  ],
  [
    'Navigation',
    {
      text: strings.ApplyTemplateNavigation,
      iconName: 'MiniLink',
      getLogMessages: (schema) =>
        [
          ...(schema.Navigation?.QuickLaunch ?? []),
          ...(schema.Navigation?.TopNavigationBar ?? [])
        ].map((node) => `Applying navigation link: ${node.Title}`)
    }
  ],
  ['WebSettings', { text: strings.ApplyTemplateWebSettings, iconName: 'Settings' }],
  ['ComposedLook', { text: strings.ApplyTemplateComposedLook, iconName: 'Design' }],
  [
    'SiteFields',
    {
      text: strings.ApplyTemplateSiteFields,
      iconName: 'NumberField',
      getLogMessages: (schema) =>
        (schema.SiteFields ?? []).map((fieldXml) => {
          const [, displayName] = fieldXml.match(/DisplayName="([^"]*)"/) ?? []
          const [, internalName] = fieldXml.match(/ Name="([^"]*)"/) ?? []
          return `Applying site field: ${displayName ?? internalName ?? ''}`
        })
    }
  ],
  [
    'ContentTypes',
    {
      text: strings.ApplyTemplateContentTypes,
      iconName: 'ExploreContent',
      getLogMessages: (schema) =>
        (schema.ContentTypes ?? []).map(
          (contentType) => `Applying content type: ${contentType.Name}`
        )
    }
  ],
  [
    'ClientSidePages',
    {
      text: strings.ApplyTemplateClientSidePages,
      iconName: 'Page',
      getLogMessages: (schema) =>
        (schema.ClientSidePages ?? []).map((page) => `Applying page: ${page.Title ?? page.Name}`)
    }
  ],
  [
    'CustomActions',
    {
      text: strings.ApplyTemplateCustomActions,
      iconName: 'SetAction',
      getLogMessages: (schema) =>
        (schema.CustomActions ?? []).map((action) => `Applying custom action: ${action.Title}`)
    }
  ]
])

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
