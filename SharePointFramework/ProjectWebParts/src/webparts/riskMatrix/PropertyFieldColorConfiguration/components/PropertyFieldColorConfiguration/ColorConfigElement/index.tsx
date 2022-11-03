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
      {isEditing && (
        <Callout target={ref.current} gapSpace={10} onDismiss={() => setIsEditing(false)}>
          <ColorPicker
            color={props.color}
            showPreview={true}
            onChange={(_ev, color) => props.onChange([color.r, color.g, color.b])}
          />
        </Callout>
      )}
    </div>
  )
}
