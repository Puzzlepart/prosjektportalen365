import * as React from 'react';
import styles from './SummarySection.module.scss';
import * as strings from 'ProjectStatusWebPartStrings';
import { ISummarySectionProps } from './ISummarySectionProps';
import { ISummarySectionState } from './ISummarySectionState';
import StatusSectionBase from '../StatusSectionBase';
import StatusElement from '../StatusElement';
import ProjectInformation from '../../../projectInformation/components/ProjectInformation';

export default class SummarySection extends StatusSectionBase<ISummarySectionProps, ISummarySectionState> {
  constructor(props: ISummarySectionProps) {
    super(props);
  }

  public render(): React.ReactElement<ISummarySectionProps> {
    const data = this.props.report.item;

    return (
      <div className={styles.summarySection}>
        <div className={styles.container}>
          <div className={styles.row}>
            <div className={styles.column6}>
              <ProjectInformation
                title='Prosjektinformasjon'
                context={this.props.context}
                entity={this.props.entity}
                filterField='GtShowFieldProjectStatus'
                hideEditPropertiesButton={true} />
            </div>
            <div className={styles.column6}>
              <div className={styles.container}>
                <div className={styles.row}>
                  {this.renderSections(data)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   *  Render sections
   * @param data Section data
   */
  private renderSections(data: any) {
    return this.props.sections.map(s => {
      return (
        <div className={styles.column6}>
          {(s.fieldName === strings.OverallStatusFieldName) ? <StatusElement label={s.name} value='' comment={data[s.fieldName]} iconName={s.iconName} height={150} />
            : <StatusElement label={s.name} value={data[s.fieldName]} comment={data[s.commentFieldName]} iconName={s.iconName} height={150} />}
        </div>
      );
    });
  }

}
