import React, { FC, useContext } from 'react'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection/BaseSection'
import { SectionContext } from '../context'

export const StatusSection: FC = () => {
  const { headerProps } = useContext(SectionContext)
  if (!headerProps.value) return null
  return (
    <BaseSection>
      <div className='ms-Grid-row'>
        <div className='ms-Grid-col ms-sm12'>
          <StatusElement />
        </div>
      </div>
    </BaseSection>
  )
}
