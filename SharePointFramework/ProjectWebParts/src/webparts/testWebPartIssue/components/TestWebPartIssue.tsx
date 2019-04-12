import * as React from 'react';
import styles from './TestWebPartIssue.module.scss';
import { ITestWebPartIssueProps } from './ITestWebPartIssueProps';

export default class TestWebPartIssue extends React.Component<ITestWebPartIssueProps, {}> {
  public render(): React.ReactElement<ITestWebPartIssueProps> {
    return (
      <div className={styles.testWebPartIssue}>
        <a href="https://puzzlepart.visualstudio.com/Prosjektportalen-O365/_workitems/edit/45/" className={styles.button}>
          <span className={styles.label}>TestWebPartIssueWebPart</span>
        </a>
      </div>
    );
  }
}
