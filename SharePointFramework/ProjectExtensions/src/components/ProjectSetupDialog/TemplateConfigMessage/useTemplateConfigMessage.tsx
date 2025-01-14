import { format } from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import { isEmpty } from 'underscore'
import { useProjectSetupDialogContext } from '../context'
import { ITemplateConfigMessageProps } from './types'
import { IUserMessageProps } from 'pp365-shared-library'
import { ProjectSetupValidation } from 'projectSetup/types'

/**
 * Component logic hook for `TemplateConfigMessage`
 *
 * @returns `hidden` and `text`
 */
export function useTemplateConfigMessage({ section }: ITemplateConfigMessageProps) {
  const context = useProjectSetupDialogContext()
  const templateHasExtensions = !isEmpty(context.state.selectedTemplate?.extensions)
  const templateHasContentConfig = !isEmpty(context.state.selectedTemplate?.contentConfig)

  const messages: IUserMessageProps[] = []

  messages.push({
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
  })

  messages.push({
    text: 'Du må være medlem av prosjektgruppen for å kunne konfigurere Planner. Vennligst legg deg selv til som medlem eller spør en administrator og prøv deretter igjen.',
    intent: 'warning',
    hidden: context.props.validation !== ProjectSetupValidation.UserIsOwnerOnly
  })

  return messages
}
