import React, { FC } from 'react'
import { BasePanel } from '../BasePanel'
import styles from './CustomEditPanel.module.scss'
import { CustomEditPanelBody } from './CustomEditPanelBody/CustomEditPanelBody'
import { CustomEditPanelFooter } from './CustomEditPanelFooter'
import { CustomEditPanelContext } from './context'
import { ICustomEditPanelProps } from './types'
import { useCustomEditPanel } from './useCustomEditPanel'

/**
 * Custom edit panel for editing a model based on a SharePoint list item.
 */
export const CustomEditPanel: FC<ICustomEditPanelProps> = (props) => {
  const context = useCustomEditPanel(props)
  return (
    <CustomEditPanelContext.Provider value={context}>
      <BasePanel
        {...props}
        className={styles.customEditPanel}
        styles={{
          main: {
            overflow: 'hidden'
          }
        }}
        onRenderFooterContent={() => (
          <CustomEditPanelFooter isSaveDisabled={context.isSaveDisabled()} />
        )}
        onRenderBody={() => <CustomEditPanelBody />}
      />
    </CustomEditPanelContext.Provider>
  )
}

CustomEditPanel.displayName = 'CustomEditPanel'
CustomEditPanel.defaultProps = {
  isOpen: false,
  hiddenFields: [],
  fields: [],
  submit: {
    onSubmit: async () => {
      // Default empty submit handler.
    }
  }
}
