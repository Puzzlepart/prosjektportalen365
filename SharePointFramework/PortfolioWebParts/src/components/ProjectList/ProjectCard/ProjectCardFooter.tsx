import { DocumentCardActions } from 'office-ui-fabric-react/lib/DocumentCard'
import * as React from 'react'
import { IProjectCardProps } from './IProjectCardProps'

/**
 * Project Card Footer
 * 
 * @param {IProjectCardProps} props Props 
 */
// tslint:disable-next-line: naming-convention
export const ProjectCardFooter = ({ actions }: IProjectCardProps): JSX.Element => {
    return <DocumentCardActions actions={actions} />
}