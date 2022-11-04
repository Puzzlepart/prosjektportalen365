import { useRef, useState } from 'react'
import _ from 'underscore'
import { IColorConfigElementProps } from './types'

/**
 * Component logic hook for `ColorConfigElement`
 *
 * @param props Props
 */
export function useColorConfigElement(props: IColorConfigElementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const rgbColorString = `rgb(${[...props.config].splice(1).join(',')})` as string
  return {
    ref,
    isEditing,
    setIsEditing,
    rgbColorString,
    percentage: _.first(props.config)
  } as const
}
