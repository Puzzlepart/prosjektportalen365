import { format } from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import { useMemo, useState } from 'react'
import { isEmpty } from 'underscore'
import { ProjectSetupValidation } from '../../../extensions/projectSetup/types'
import { useProjectSetupDialogContext } from '../context'
import { ON_TEMPLATE_CHANGED } from '../reducer'
import { createNoTemplateOption } from '../../../extensions/projectSetup/noTemplate'
import { TemplateSelectorMode } from './types'

export function useTemplateSelector() {
  const context = useProjectSetupDialogContext()
  const hasExistingTemplate = context.props.data.hasExistingTemplate

  const initialMode: TemplateSelectorMode = hasExistingTemplate ? 'notemplate' : 'selecttemplate'
  const [mode, setMode] = useState<TemplateSelectorMode>(initialMode)
  const [query, setQuery] = useState<string>('')

  const defaultTemplate = (() => {
    const [def] = context.props.data.templates.filter((t) => t.isDefault)
    return def || context.props.data.templates[0]
  })()

  const templates = context.props.data.templates.filter((t) => !t.hidden)
  const selectedTemplate = context.state.selectedTemplate
  const isSingleTemplate = templates.length === 1

  const matchingTemplates = useMemo(() => {
    if (!query) return templates
    const lowerQuery = query.toLowerCase()
    return templates.filter(
      (t) =>
        t.text.toLowerCase().includes(lowerQuery) || t.subText?.toLowerCase().includes(lowerQuery)
    )
  }, [templates, query])

  const onModeChanged = (_: any, data: { value: string }) => {
    const newMode = data.value as TemplateSelectorMode
    setMode(newMode)
    if (newMode === 'notemplate') {
      context.dispatch(ON_TEMPLATE_CHANGED(createNoTemplateOption()))
    } else {
      if (defaultTemplate) {
        context.dispatch(ON_TEMPLATE_CHANGED(defaultTemplate))
      }
    }
  }

  const onTemplateSelect = (_: any, data: any) => {
    const templateId = data.optionValue
    const template = templates.find((t) => String(t.id) === templateId)
    if (template) {
      context.dispatch(ON_TEMPLATE_CHANGED(template))
    }
    setQuery('')
  }

  const onClearTemplate = () => {
    context.dispatch(ON_TEMPLATE_CHANGED(null))
    setQuery('')
  }

  const templateHasExtensions = !isEmpty(selectedTemplate?.extensions)
  const templateHasContentConfig = !isEmpty(selectedTemplate?.contentConfig)

  const validationMessage =
    templateHasExtensions || templateHasContentConfig
      ? format(
          strings.TemplateConfigMessage,
          selectedTemplate?.text,
          [
            templateHasExtensions && strings.ExtensionsSectionHeaderText,
            templateHasContentConfig && strings.ContentConfigSectionHeaderText
          ]
            .filter(Boolean)
            .join(' og ')
            .toLowerCase()
        )
      : undefined

  const showPlannerWarning = context.props.validation === ProjectSetupValidation.UserNotGroupMember

  return {
    mode,
    hasExistingTemplate,
    templates,
    matchingTemplates,
    query,
    selectedTemplate,
    isSingleTemplate,
    validationMessage,
    showPlannerWarning,
    onModeChanged,
    onTemplateSelect,
    onClearTemplate,
    setQuery
  }
}
