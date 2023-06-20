import { format } from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import { useContext } from 'react'
import { isEmpty } from 'underscore'
import { TemplateSelectDialogContext } from '../context'
import { ITemplateConfigMessageProps } from './types'

/**
 * Component logic hook for `TemplateConfigMessage`
 *
 * @returns `hidden` and `text`
 */
export function useTemplateConfigMessage({ section }: ITemplateConfigMessageProps) {
  const context = useContext(TemplateSelectDialogContext)
  const templateHasExtensions = !isEmpty(context.state.selectedTemplate?.extensions)
  const templateHasContentConfig = !isEmpty(context.state.selectedTemplate?.contentConfig)
  const hidden = !(
    (section === 'ExtensionsSection' && templateHasExtensions) ||
    (section === 'ContentConfigSection' && templateHasContentConfig) ||
    (section === 'TemplateSelector' && (templateHasExtensions || templateHasContentConfig))
  )
  const text = format(
    strings.TemplateConfigText,
    context.state.selectedTemplate?.text,
    [
      templateHasExtensions && strings.ExtensionsSectionHeaderText,
      templateHasContentConfig && strings.ContentConfigSectionHeaderText
    ]
      .filter(Boolean)
      .join(' og ')
      .toLowerCase()
  )
  return { hidden, text } as const
}
