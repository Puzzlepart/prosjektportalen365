import { Callout, ColorPicker } from '@fluentui/react'
import React, { FC } from 'react'
import styles from './ColorConfigElement.module.scss'
import { IColorConfigElementProps } from './types'
import { useColorConfigElement } from './useColorConfigElement'

export const ColorConfigElement: FC<IColorConfigElementProps> = (props) => {
  const { ref, isEditing, setIsEditing, colorString } = useColorConfigElement(props)
  return (
    <div
      ref={ref}
      className={styles.root}
      style={{ backgroundColor: colorString }}
      onClick={() => setIsEditing(true)}>
      <div className={styles.container}>{props.percentage}%</div>
      {isEditing && (
        <Callout
          target={ref.current}
          gapSpace={props.gapSpace}
          preventDismissOnScroll={props.preventDismissOnScroll}
          onDismiss={() => setIsEditing(false)}>
          <ColorPicker color={colorString} showPreview={true} onChange={props.onChange} />
        </Callout>
      )}
    </div>
  )
}

ColorConfigElement.defaultProps = {
  gapSpace: 10,
  preventDismissOnScroll: true
}
