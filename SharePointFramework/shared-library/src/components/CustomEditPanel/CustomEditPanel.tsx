import React, { FC } from 'react'
import { BasePanel } from '../BasePanel'
import styles from './CustomEditPanel.module.scss'
import { CustomEditPanelBody } from './CustomEditPanelBody/CustomEditPanelBody'
import { CustomEditPanelFooter } from './CustomEditPanelFooter'
import { CustomEditPanelContext } from './context'
import { ICustomEditPanelProps } from './types'
import { useCustomEditPanel } from './useCustomEditPanel'
import { withDefaults } from '../../util'

const CUSTOM_EDIT_PANEL_DEFAULT_PROPS: Partial<ICustomEditPanelProps> = {
  open: false,
  hiddenFields: [],
  fields: [],
  submit: {
    onSubmit: async () => {
      // Default empty submit handler.
    }
  }
}

/**
 * Custom edit panel for editing a model based on a SharePoint list item.
 */
export const CustomEditPanel: FC<ICustomEditPanelProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, CUSTOM_EDIT_PANEL_DEFAULT_PROPS)
  const context = useCustomEditPanel(props)
  return (
    <CustomEditPanelContext.Provider value={context}>
      <BasePanel
        {...props}
        className={styles.customEditPanel}
        footer={<CustomEditPanelFooter isSaveDisabled={context.isSaveDisabled()} />}
      >
        <CustomEditPanelBody />
      </BasePanel>
    </CustomEditPanelContext.Provider>
  )
}

CustomEditPanel.displayName = 'CustomEditPanel'
