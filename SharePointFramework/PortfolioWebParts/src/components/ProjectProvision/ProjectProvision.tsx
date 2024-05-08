import React, { FC } from 'react'
import { IProjectProvisionProps } from './types';

export const ProjectProvision: FC<IProjectProvisionProps> = (props) => {
  return (
    <div>
      <h1>Hello world</h1>
      <h3>{props.description}</h3>
    </div>
  )
}
