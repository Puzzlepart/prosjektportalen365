/* eslint-disable prefer-spread */
import { useState } from 'react'
import { useMotion } from '@fluentui/react-motion-preview'
import { useMotionStyles } from './styles'
import { useEditableColumn } from './useEditableColumn'

/**
 * Component logic hook for `ProvisionDrawer`. This hook is responsible for
 * fetching data, sorting, filtering and other logic.
 */
export const useProvisionDrawer = () => {
  const [l2, setL2] = useState(false)
  const motionStyles = useMotionStyles()
  const toolbarBackIconMotion = useMotion<HTMLButtonElement>(l2)
  const toolbarCalendarIconMotion = useMotion<HTMLButtonElement>(!l2)
  const level1Motion = useMotion<HTMLDivElement>(!l2)
  const level2Motion = useMotion<HTMLDivElement>(l2)

  const { column, setColumn } = useEditableColumn()

  /**
   * Save is disabled if the column name or field name is less than 2 characters.
   */
  const isSaveDisabled =
    column.get('name')?.length < 2 ||
    column.get('justification')?.length < 2

  return {
    l2,
    setL2,
    motionStyles,
    toolbarBackIconMotion,
    toolbarCalendarIconMotion,
    level1Motion,
    level2Motion,
    isSaveDisabled,
    column,
    setColumn
  }
}
