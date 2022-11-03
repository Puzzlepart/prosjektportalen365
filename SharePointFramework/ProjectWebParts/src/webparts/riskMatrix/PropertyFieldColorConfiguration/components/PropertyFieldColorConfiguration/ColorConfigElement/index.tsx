import { Callout, ColorPicker } from '@fluentui/react'
import React, { FC } from 'react'
import styles from './ColorConfigElement.module.scss'
import { IColorConfigElementProps } from './types'
import { useColorConfigElement } from './useColorConfigElement'

export const ColorConfigElement: FC<IColorConfigElementProps> = (props) => {
  const { ref, isEditing, setIsEditing } = useColorConfigElement()
  return (
    <div
      ref={ref}
      className={styles.root}
      style={{ backgroundColor: props.color }}
      onClick={() => setIsEditing(true)}>
      <div className={styles.container}>{props.percentage}%</div>
      {isEditing && (
        <Callout target={ref.current} gapSpace={10} onDismiss={() => setIsEditing(false)}>
          <ColorPicker
            color={props.color}
            showPreview={true}
            onChange={props.onChange}
          />
        </Callout>
      )}
    </div>
  )
}
