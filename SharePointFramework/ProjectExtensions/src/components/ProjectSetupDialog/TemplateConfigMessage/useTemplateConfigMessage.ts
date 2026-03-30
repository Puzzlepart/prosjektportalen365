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
 * @returns messages for `ContentConfigSection`
 */
export function useTemplateConfigMessage(_props: ITemplateConfigMessageProps) {
  const context = useProjectSetupDialogContext()
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
        strings.ContentConfigSectionHeaderText.toLowerCase()
      ),
      hidden: !templateHasContentConfig
    }
  ]

  return messages
}
