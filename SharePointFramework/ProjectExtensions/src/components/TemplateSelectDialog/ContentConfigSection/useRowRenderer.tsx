import { IDetailsRowProps } from '@fluentui/react'
import { ContentConfig } from 'models'
import strings from 'ProjectExtensionsStrings'
import React, { useContext } from 'react'
import { CheckLocked } from '../CheckLocked'
import { TemplateSelectDialogContext } from '../context'

/**
 * Row renderer hook for `ContentConfigSection`. Returns an instance of
 * `onRenderRow`.
 */
export function useRowRenderer({ selectedKeys, searchTerm }) {
  const context = useContext(TemplateSelectDialogContext)
  return (
    detailsRowProps: IDetailsRowProps,
    defaultRender: (props?: IDetailsRowProps) => JSX.Element
  ) => {
    const lcc = detailsRowProps.item as ContentConfig
    const isMandatory = lcc.isMandatory(context.state.selectedTemplate)
    detailsRowProps.disabled = isMandatory
    if (isMandatory) {
      detailsRowProps.onRenderCheck = (props) => (
        <CheckLocked {...props} tooltip={{ text: strings.ContentConfigLockedTooltipText }} />
      )
      detailsRowProps.styles = {
        root: { background: 'rgb(237, 235, 233)', color: 'rgb(50, 49, 48)' }
      }
    }
    const shouldRenderRow =
      lcc.text.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
      selectedKeys.includes(lcc.key)
    return shouldRenderRow ? defaultRender(detailsRowProps) : null
  }
}
