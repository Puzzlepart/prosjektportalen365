import { format } from '@fluentui/react'
import { Logger, LogLevel } from '@pnp/logging'
import strings from 'ProjectExtensionsStrings'
import { useEffect, useMemo, useState } from 'react'
import { isEmpty } from 'underscore'
import { ProjectSetupValidation } from '../../../extensions/projectSetup/types'
import { useProjectSetupDialogContext } from '../context'
import {
  ON_CLOUD_TEMPLATE_ERROR,
  ON_CLOUD_TEMPLATE_RESOLVED,
  ON_CLOUD_TEMPLATE_RESOLVING,
  ON_TEMPLATE_CHANGED
} from '../reducer'
import { createNoTemplateOption } from '../../../extensions/projectSetup/noTemplate'
import { resolveCloudTemplate } from '../resolveCloudTemplate'
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

  // Skymal: download and resolve the .pppkg once the (cloud) template is
  // selected, so the Extensions/List-content sections can show its bundled
  // artifacts and the provisioning tasks can apply them. Nothing touches the hub.
  const isCloudTemplate = !!selectedTemplate?.isCloudTemplate
  const isResolvingCloudTemplate = !!context.state.isResolvingCloudTemplate
  const cloudTemplateError = context.state.cloudTemplateError
  const cloudTemplateMessage = isCloudTemplate
    ? format(strings.CloudTemplateInfoMessage, selectedTemplate?.text)
    : undefined
  // "At own risk": the resolved package declares it needs hub-side provisioning
  // the cloud path can't reproduce. Warn, don't block (extensions + list content
  // still apply; hub-only parts are skipped).
  const cloudIncompatibleMessage =
    isCloudTemplate &&
    context.state.resolvedCloudTemplate?.package?.manifest?.cloudCompatible === false
      ? format(strings.CloudTemplateNotCompatibleWarning, selectedTemplate?.text)
      : undefined

  useEffect(() => {
    if (!selectedTemplate?.isCloudTemplate) return
    if (context.state.resolvedCloudTemplate?.templateId === selectedTemplate.id) return
    if (context.state.isResolvingCloudTemplate) return
    let cancelled = false
    void (async () => {
      context.dispatch(ON_CLOUD_TEMPLATE_RESOLVING())
      try {
        const resolved = await resolveCloudTemplate(selectedTemplate)
        if (!cancelled) context.dispatch(ON_CLOUD_TEMPLATE_RESOLVED(resolved))
      } catch (error) {
        // Log the raw (often technical/English) error for diagnostics; show the
        // user a clean, fully-localized message instead of interpolating it.
        Logger.log({
          message: `(useTemplateSelector) resolveCloudTemplate failed: ${error?.message}`,
          level: LogLevel.Error
        })
        if (!cancelled) {
          context.dispatch(ON_CLOUD_TEMPLATE_ERROR(strings.CloudTemplateResolveErrorMessage))
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate?.id])

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
            .join(strings.TemplateConfigConjunction)
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
    isCloudTemplate,
    isResolvingCloudTemplate,
    cloudTemplateError,
    cloudTemplateMessage,
    cloudIncompatibleMessage,
    onModeChanged,
    onTemplateSelect,
    onClearTemplate,
    setQuery
  }
}
