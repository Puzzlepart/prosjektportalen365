import React, { FC } from 'react'
import { BasePanel } from '../BasePanel'
import { DebugModel } from './DebugModel'
import styles from './CustomEditPanel.module.scss'
import { CustomEditPanelFooter } from './CustomEditPanelFooter'
import { ICustomEditPanelProps } from './types'
import { useCustomEditPanel } from './useCustomEditPanel'

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
      onRenderFooterContent={() => <CustomEditPanelFooter  model={model} />}
      onRenderBody={() => (
        <>
          <DebugModel model={model} />
          {fields.map((field, key) => {
            const fieldElement = getFieldElement(field)
            return fieldElement && <div key={key}>{fieldElement}</div>
          })}
        </>
      )}
    />
  )
}

CustomEditPanel.displayName = 'CustomEditPanel'
CustomEditPanel.defaultProps = {
  headerText: 'strings.EditProjectInformationText',
  hiddenFields: ['GtProjectPhase']
}
