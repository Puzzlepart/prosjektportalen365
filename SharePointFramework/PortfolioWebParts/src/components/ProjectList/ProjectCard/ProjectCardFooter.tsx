import { DocumentCardActions } from '@fluentui/react/lib/DocumentCard'
import React, { FC } from 'react'
import { IProjectCardProps } from './types'

export const ProjectCardFooter: FC<IProjectCardProps> = ({ actions }): JSX.Element => {
  return <DocumentCardActions actions={actions} />
}
