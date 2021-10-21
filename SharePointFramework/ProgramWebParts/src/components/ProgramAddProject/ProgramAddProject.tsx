import * as React from 'react';
import styles from './ProgramAddProject.module.scss';
import { IProgramAddProjectProps } from './IProgramAddProjectProps';
import { ProjectTimeline } from '../../../../PortfolioWebParts/lib/components/ProjectTimeline'

export default class ProgramAddProject extends React.Component<IProgramAddProjectProps, {}> {
  public render(): React.ReactElement<IProgramAddProjectProps> {
    return (
      <>
        <ProjectTimeline dataSource="Tedst" />
      </>
    );
  }
}
