import React, { FC } from 'react'
import { useCustomEditPanelContext } from '../context'
import { DebugModel } from './DebugModel'
import styles from './CustomEditPanelBody.module.scss'

/**
 * Renders the editable fields and optional model diagnostics.
 */
export const CustomEditPanelBody: FC = () => {
  const context = useCustomEditPanelContext()
  return (
    <div className={styles.customEditPanelBody}>
      {context.props.debug && <DebugModel />}
      {context.fields.map((field, key) => {
        const fieldElement = context.getFieldElement(field)
        return fieldElement && <div key={key}>{fieldElement}</div>
      })}
    </div>
  )
}
