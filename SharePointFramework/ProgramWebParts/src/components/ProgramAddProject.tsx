import * as React from 'react';
import styles from './ProgramAddProject.module.scss';
import { IProgramAddProjectProps } from './IProgramAddProjectProps';
import { escape } from '@microsoft/sp-lodash-subset';

export default class ProgramAddProject extends React.Component<IProgramAddProjectProps, {}> {
  public render(): React.ReactElement<IProgramAddProjectProps> {
    return (
      <div className={styles.programAddProject}>
        <div className={styles.container}>
          <div className={styles.row}>
            <div className={styles.column}>
              <span className={styles.title}>Welcome to SharePoint!</span>
              <p className={styles.subTitle}>Customize SharePoint experiences using Web Parts.</p>
              <p className={styles.description}>{escape(this.props.description)}</p>
              <a href="https://aka.ms/spfx" className={styles.button}>
                <span className={styles.label}>Learn more</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
