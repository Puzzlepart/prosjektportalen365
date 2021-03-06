import { DocumentCardActions } from 'office-ui-fabric-react/lib/DocumentCard'
import React, { FunctionComponent } from 'react'
import { IProjectCardProps } from './types'

export const ProjectCardFooter: FunctionComponent<IProjectCardProps> = ({
  actions
}: IProjectCardProps): JSX.Element => {
  return <DocumentCardActions actions={actions} />
}
