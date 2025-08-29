import { format } from '@fluentui/react'
import { IUserMessageProps } from 'pp365-shared-library'
import strings from 'ProjectExtensionsStrings'
import { isEmpty } from 'underscore'
import { ProjectSetupValidation } from '../../../extensions/projectSetup/types'
import { useProjectSetupDialogContext } from '../context'
import { ITemplateConfigMessageProps } from './types'

/**
 * Component logic hook for `TemplateConfigMessage`
 *
 * @returns `hidden` and `text`
 */
export function useTemplateConfigMessage({ section }: ITemplateConfigMessageProps) {
  const context = useProjectSetupDialogContext()
  const templateHasExtensions = !isEmpty(context.state.selectedTemplate?.extensions)
  const templateHasContentConfig = !isEmpty(context.state.selectedTemplate?.contentConfig)

  const messages: IUserMessageProps[] = [
    {
      text: strings.PlannerMemberWarningMessage,
      intent: 'warning',
      hidden: context.props.validation !== ProjectSetupValidation.UserNotGroupMember
    },
    {
      text: format(
        strings.TemplateConfigMessage,
        context.state.selectedTemplate?.text,
        [
          templateHasExtensions && strings.ExtensionsSectionHeaderText,
          templateHasContentConfig && strings.ContentConfigSectionHeaderText
        ]
          .filter(Boolean)
          .join(' og ')
          .toLowerCase()
      ),
      hidden: !(
        (section === 'ExtensionsSection' && templateHasExtensions) ||
        (section === 'ContentConfigSection' && templateHasContentConfig) ||
        (section === 'TemplateSelector' && (templateHasExtensions || templateHasContentConfig))
      )
    }
  ]

  return messages
}
