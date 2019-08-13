import { DocumentCard } from 'office-ui-fabric-react/lib/DocumentCard';
import * as React from 'react';
import IProjectCardProps from './IProjectCardProps';
import styles from './ProjectCard.module.scss';
import { ProjectCardHeader } from './ProjectCardHeader';
import { ProjectCardContent } from './ProjectCardContent';
import { ProjectCardFooter } from './ProjectCardFooter';

/**
 * Project Card
 * 
 * @param {IProjectCardProps} props Props  
 */
export default (props: IProjectCardProps): JSX.Element => {
  return (
    <DocumentCard
      className={styles.projectCard}
      onClickHref={props.project.url}>
      <ProjectCardHeader {...props} />
      <ProjectCardContent {...props} />
      <ProjectCardFooter {...props} />
    </DocumentCard>
  );
};
