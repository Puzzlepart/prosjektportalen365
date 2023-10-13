import React, { FC } from 'react'
import { BasePanel } from '../BasePanel'
import styles from './CustomEditPanel.module.scss'
import { CustomEditPanelFooter } from './CustomEditPanelFooter'
import { ICustomEditPanelProps } from './types'
import { useCustomEditPanel } from './useCustomEditPanel'
import { DebugModel } from './DebugModel'

/**
 * Custom edit panel for editing a model based on a SharePoint list item.
 */
export const CustomEditPanel: FC<ICustomEditPanelProps> = (props) => {
  const { fields, getFieldElement, model } = useCustomEditPanel(props)
  return (
    <BasePanel
      {...props}
      className={styles.customEditPanel}
      styles={{
        main: {
          overflow: 'hidden'
        }
      }}
      onRenderFooterContent={() => <CustomEditPanelFooter {...props} model={model} />}
      onRenderBody={() => (
        <div className={styles.body}>
          <DebugModel model={model} />
          {fields.map((field, key) => {
            const fieldElement = getFieldElement(field)
            return fieldElement && <div key={key}>{fieldElement}</div>
          })}
        </div>
      )}
    />
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
