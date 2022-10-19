import { DocumentCardActions } from '@fluentui/react/lib/DocumentCard'
import React, { FunctionComponent } from 'react'
import { IProjectCardProps } from './types'

export const ProjectCardFooter: FunctionComponent<IProjectCardProps> = ({
  actions
}): JSX.Element => {
  return <DocumentCardActions actions={actions} />
}
