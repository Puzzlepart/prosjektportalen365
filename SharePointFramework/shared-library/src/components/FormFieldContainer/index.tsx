import _ from 'lodash'
import React, { FC } from 'react'
import { FieldDescription } from './FieldDescription'
import { IFormFieldContainerProps } from './types'

export const FormFieldContainer: FC<IFormFieldContainerProps> = (props) => {
  return (
    <div {..._.omit(props, 'description')}>
      {props.children}
      <FieldDescription description={props.description} />
    </div>
  )
}

export * from './types'
export * from './FieldDescription'
