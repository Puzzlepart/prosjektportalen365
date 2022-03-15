import React, { FunctionComponent } from 'react'
import { Card } from './Card/Card'
import { IProjectCardProps } from './types'

export const ProjectCard: FunctionComponent<IProjectCardProps> = (props) => {
  return <Card {...props} />
}
