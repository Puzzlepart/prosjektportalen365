import { IDetailsRowProps } from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import { ContentConfig } from 'pp365-shared-library'
import React from 'react'
import { MandatoryCheck } from '../MandatoryCheck'
import { useProjectSetupDialogContext } from '../context'

/**
 * Row renderer hook for `ContentConfigSection`. Returns an instance of
 * `onRenderRow` that is used by `DetailsList` to render rows.
 */
export function useRowRenderer({ selectedKeys, searchTerm }) {
  const context = useProjectSetupDialogContext()
  return (
    detailsRowProps: IDetailsRowProps,
    defaultRender: (props?: IDetailsRowProps) => JSX.Element
  ) => {
    const contentConfig = detailsRowProps.item as ContentConfig
    const isMandatory = contentConfig.isMandatoryForTemplate(context.state.selectedTemplate)
    detailsRowProps.disabled = isMandatory
    if (isMandatory) {
      detailsRowProps.onRenderCheck = (props) => (
        <MandatoryCheck {...props} tooltip={{ text: strings.ContentConfigLockedTooltipText }} />
      )
      detailsRowProps.styles = {
        root: { background: 'rgb(237, 235, 233)', color: 'rgb(50, 49, 48)' }
      }
    }
    const shouldRenderRow =
      contentConfig.text.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
      selectedKeys.includes(contentConfig.key)
    return shouldRenderRow ? defaultRender(detailsRowProps) : null
  }
}
