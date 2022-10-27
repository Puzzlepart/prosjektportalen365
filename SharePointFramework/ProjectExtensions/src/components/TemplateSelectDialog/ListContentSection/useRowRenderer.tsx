import { IDetailsRowProps } from '@fluentui/react'
import { ListContentConfig } from 'models'
import strings from 'ProjectExtensionsStrings'
import React, { useContext } from 'react'
import { CheckLocked } from '../CheckLocked'
import { TemplateSelectDialogContext } from '../context'

export function useRowRenderer({ selectedKeys, searchTerm }) {
  const context = useContext(TemplateSelectDialogContext)
  return (
    detailsRowProps: IDetailsRowProps,
    defaultRender: (props?: IDetailsRowProps) => JSX.Element
  ) => {
    const lcc = detailsRowProps.item as ListContentConfig
    const isLocked = lcc.isLocked(context.state.selectedTemplate)
    detailsRowProps.disabled = isLocked
    if (isLocked) {
      detailsRowProps.onRenderCheck = (props) => (
        <CheckLocked {...props} tooltip={{ text: strings.ListContentLockedTooltipText }} />
      )
      if (lcc.isDefault) {
        detailsRowProps.styles = {
          root: { background: 'rgb(237, 235, 233)', color: 'rgb(50, 49, 48)' }
        }
      }
    }
    if (
      lcc.text.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
      selectedKeys.includes(lcc.key) ||
      (isLocked && lcc.isDefault)
    ) {
      return defaultRender(detailsRowProps)
    } else {
      return null
    }
  }
}
