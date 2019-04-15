import * as React from 'react';
import styles from './ProjectCard.module.scss';
import * as strings from 'ProjectListWebPartStrings';
import IProjectCardProps from './IProjectCardProps';
import { Persona, PersonaSize, IPersonaSharedProps } from 'office-ui-fabric-react/lib/Persona';
import { DocumentCard, DocumentCardTitle, DocumentCardActions } from 'office-ui-fabric-react/lib/DocumentCard';


/**
 * Project Card Header
 * 
 * @param {IProjectCardProps} props Props 
 */
export const ProjectCardHeader = ({ project, showProjectLogo, shouldTruncateTitle }: IProjectCardProps): JSX.Element => {
  return (
    <div className={styles.header}>
      <div className={styles.logo} hidden={!showProjectLogo}>
        <img src={project.Logo} />
      </div>
      <DocumentCardTitle title={project.Title} shouldTruncate={shouldTruncateTitle} />
    </div>
  );
};

/**
 * Project Card Content
 * 
 * @param {IProjectCardProps} props Props 
 */
export const ProjectCardContent = ({ project, showProjectOwner, showProjectManager }: IProjectCardProps): JSX.Element => {
  const defaultPersonaProps: IPersonaSharedProps = {
    primaryText: strings.NotSet,
    size: PersonaSize.size40,
    imageShouldFadeIn: true,
  };
  const ownerPersonaProps = { ...defaultPersonaProps, ...project.Owner, secondaryText: strings.ProjectOwner };
  const managerPersonaProps = { ...defaultPersonaProps, ...project.Manager, secondaryText: strings.ProjectManager };
  return (
    <div>
      <div className={styles.phase}>{project.Phase || strings.NotSet}</div>
      <div className={styles.personaContainer} hidden={!showProjectOwner}>
        <Persona {...ownerPersonaProps} />
      </div>
      <div className={styles.personaContainer} hidden={!showProjectManager}>
        <Persona {...managerPersonaProps} />
      </div>
    </div>
  );
};

/**
 * Project Card Footer
 * 
 * @param {IProjectCardProps} props Props 
 */
export const ProjectCardFooter = ({ actions }: IProjectCardProps): JSX.Element => {
  return <DocumentCardActions actions={actions} />;
};

/**
 * Project Card
 * 
 * @param {IProjectCardProps} props Props  
 */
export default (props: IProjectCardProps): JSX.Element => {
  return (
    <DocumentCard
      className={styles.projectCard}
      onClickHref={props.project.Url}>
      <ProjectCardHeader {...props} />
      <ProjectCardContent {...props} />
      <ProjectCardFooter {...props} />
    </DocumentCard>
  );
};
