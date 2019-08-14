import { DocumentCardActions } from 'office-ui-fabric-react/lib/DocumentCard';
import * as React from 'react';
import { IProjectCardProps } from './IProjectCardProps';

/**
 * Project Card Footer
 * 
 * @param {IProjectCardProps} props Props 
 */
export const ProjectCardFooter = ({ actions }: IProjectCardProps): JSX.Element => {
    return <DocumentCardActions actions={actions} />;
};