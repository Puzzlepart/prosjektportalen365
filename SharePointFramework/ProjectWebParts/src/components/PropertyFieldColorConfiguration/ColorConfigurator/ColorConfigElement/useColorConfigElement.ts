import { useRef, useState } from 'react'
import { IColorConfigElementProps } from './types'

/**
 * Component logic hook for `ColorConfigElement`
 *
 * @param props Props
 */
export function useColorConfigElement(props: IColorConfigElementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const rgbColorString = `rgb(${[props.config.r, props.config.g, props.config.b].join(
    ','
  )})` as string
  return {
    ref,
    isEditing,
    setIsEditing,
    rgbColorString
  } as const
}
