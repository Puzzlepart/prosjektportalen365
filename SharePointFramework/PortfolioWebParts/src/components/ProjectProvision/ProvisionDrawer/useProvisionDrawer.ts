/* eslint-disable prefer-spread */
import { useContext, useState } from 'react'
import { useMotion } from '@fluentui/react-motion-preview'
import { useMotionStyles } from './styles'
import { ProjectProvisionContext } from '../context'

/**
 * Component logic hook for `ProvisionDrawer`. This hook is responsible for
 * fetching data, sorting, filtering and other logic.
 */
export const useProvisionDrawer = () => {
  const context = useContext(ProjectProvisionContext)

  const [level2, setLevel2] = useState(false)
  const motionStyles = useMotionStyles()
  const toolbarBackIconMotion = useMotion<HTMLButtonElement>(level2)
  const toolbarCalendarIconMotion = useMotion<HTMLButtonElement>(!level2)
  const level1Motion = useMotion<HTMLDivElement>(!level2)
  const level2Motion = useMotion<HTMLDivElement>(level2)

  /**
   * Save is disabled if the column name or field name is less than 2 characters.
   */
  const isSaveDisabled =
    context.column.get('name')?.length < 2 || context.column.get('justification')?.length < 2

  return {
    level2,
    setLevel2,
    motionStyles,
    toolbarBackIconMotion,
    toolbarCalendarIconMotion,
    level1Motion,
    level2Motion,
    isSaveDisabled,
    context
  }
}
