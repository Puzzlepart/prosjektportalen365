import React, { FC, useContext } from 'react'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection/BaseSection'
import { SectionContext } from '../context'

/** Displays a status-only report section when it has a value. */
export const StatusSection: FC = () => {
  const { headerProps } = useContext(SectionContext)
  if (!headerProps.value && !headerProps.comment) return null
  return (
    <BaseSection>
      <StatusElement asHeading />
    </BaseSection>
  )
}
