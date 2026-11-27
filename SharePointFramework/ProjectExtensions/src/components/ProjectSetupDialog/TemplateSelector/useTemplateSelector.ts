import { useAnnounce } from '@fluentui/react-components'
import { Logger, LogLevel } from '@pnp/logging'
import strings from 'ProjectExtensionsStrings'
import { useEffect, useMemo, useRef } from 'react'
import { useProjectSetupDialogContext } from '../context'
import {
  ON_CLOUD_TEMPLATE_ERROR,
  ON_CLOUD_TEMPLATE_RESOLVED,
  ON_CLOUD_TEMPLATE_RESOLVING,
  ON_TEMPLATE_CHANGED
} from '../reducer'
import { createNoTemplateOption } from '../../../extensions/projectSetup/noTemplate'
import { resolveCloudTemplate } from '../resolveCloudTemplate'
import { TEMPLATE_CARDS_MAX } from './types'
import { format } from 'pp365-shared-library'
import { trackError } from 'pp365-shared-library/lib/telemetry'

/** Offers the templates to choose from, resolving cloud packages with status announcements. */
export function useTemplateSelector() {
  const context = useProjectSetupDialogContext()
  const hasExistingTemplate = context.props.data.hasExistingTemplate

  const templates = context.props.data.templates
    .filter((t) => !t.hidden)
    // The default template first, where the eye starts; the rest by title.
    .sort(
      (a, b) => Number(!!b.isDefault) - Number(!!a.isDefault) || a.text.localeCompare(b.text, 'nb')
    )
  // A project that has a template can be set up again without one: the first choice then.
  const noTemplate = useMemo(() => createNoTemplateOption(), [])
  const selectedTemplate = context.state.selectedTemplate
  const offered = hasExistingTemplate ? [noTemplate, ...templates] : templates
  // A hidden template can still be the default: shown while it is the one that will be applied.
  const choices =
    selectedTemplate && !offered.some((t) => t.id === selectedTemplate.id)
      ? [...offered, selectedTemplate]
      : offered
  const selectedValue = selectedTemplate ? String(selectedTemplate.id) : ''
  const showAsCards = choices.length <= TEMPLATE_CARDS_MAX

  const onTemplateChange = (value: string) => {
    const template = choices.find((t) => String(t.id) === value)
    if (template) context.dispatch(ON_TEMPLATE_CHANGED(template))
  }

  const isCloudTemplate = !!selectedTemplate?.isCloudTemplate
  const isResolvingCloudTemplate = !!context.state.isResolvingCloudTemplate
  const cloudTemplateError = context.state.cloudTemplateError
  const cloudIncompatibleMessage =
    isCloudTemplate &&
    context.state.resolvedCloudTemplate?.package?.manifest?.cloudCompatible === false
      ? format(strings.CloudTemplateNotCompatibleWarning, selectedTemplate?.text)
      : undefined

  const { announce } = useAnnounce()
  // Ready when the template chosen has been read, not when the reading stops: choosing another
  // template stops it too, with nothing read.
  const isCloudTemplateResolved =
    isCloudTemplate && context.state.resolvedCloudTemplate?.templateId === selectedTemplate?.id
  const wasResolving = useRef(isResolvingCloudTemplate)
  const wasResolved = useRef(isCloudTemplateResolved)
  useEffect(() => {
    if (isResolvingCloudTemplate && !wasResolving.current) {
      announce(strings.CloudTemplateResolvingMessage, { polite: true })
    }
    wasResolving.current = isResolvingCloudTemplate
  }, [isResolvingCloudTemplate])
  useEffect(() => {
    if (isCloudTemplateResolved && !wasResolved.current) {
      announce(strings.CloudTemplateResolved, { polite: true })
    }
    wasResolved.current = isCloudTemplateResolved
  }, [isCloudTemplateResolved])

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
        Logger.log({
          message: `(useTemplateSelector) resolveCloudTemplate failed: ${error?.message}`,
          level: LogLevel.Error
        })
        if (!cancelled) {
          // The wizard is a React root of its own, so the setup's alias is given here. Counted
          // with the message it is told in: a template the user has left is told nowhere.
          trackError('ProjectSetup', error)
          context.dispatch(ON_CLOUD_TEMPLATE_ERROR(strings.CloudTemplateResolveErrorMessage))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedTemplate?.id])

  return {
    choices,
    selectedTemplate,
    selectedValue,
    showAsCards,
    isCloudTemplate,
    isResolvingCloudTemplate,
    cloudTemplateError,
    cloudIncompatibleMessage,
    onTemplateChange
  }
}
