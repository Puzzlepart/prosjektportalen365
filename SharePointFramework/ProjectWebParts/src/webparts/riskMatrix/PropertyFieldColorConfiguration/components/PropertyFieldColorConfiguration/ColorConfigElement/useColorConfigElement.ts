import { useRef, useState } from 'react'
import { IColorConfigElementProps } from './types'

export function useColorConfigElement(props: IColorConfigElementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  return {
    ref,
    isEditing,
    setIsEditing,
    colorString: `rgb(${props.color.join(',')})` as string
  } as const
}
