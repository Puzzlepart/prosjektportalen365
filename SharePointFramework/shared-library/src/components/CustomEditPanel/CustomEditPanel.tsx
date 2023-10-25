import React, { FC } from 'react'
import { BasePanel } from '../BasePanel'
import styles from './CustomEditPanel.module.scss'
import { CustomEditPanelFooter } from './CustomEditPanelFooter'
import { ICustomEditPanelProps } from './types'
import { useCustomEditPanel } from './useCustomEditPanel'
import { DebugModel } from './DebugModel'
import { CustomEditPanelContext } from './context'

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
        onRenderFooterContent={() => <CustomEditPanelFooter />}
        onRenderBody={() => (
          <div className={styles.body}>
            {props.debug && <DebugModel />}
            {context.fields.map((field, key) => {
              const fieldElement = context.getFieldElement(field)
              return fieldElement && <div key={key}>{fieldElement}</div>
            })}
          </div>
        )}
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
