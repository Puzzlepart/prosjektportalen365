import * as React from 'react';
import * as ProjectStatusWebPartStrings from 'ProjectStatusWebPartStrings';
import styles from './SummarySection.module.scss';
import { ISummarySectionProps } from './ISummarySectionProps';
import { ISummarySectionState } from './ISummarySectionState';
import StatusSectionBase from '../@StatusSectionBase';
import StatusElement from '../StatusElement';
import { ProjectInformation } from 'components';

export default class SummarySection extends StatusSectionBase<ISummarySectionProps, ISummarySectionState> {
  constructor(props: ISummarySectionProps) {
    super(props);
  }

  /**
   * Renders the <SummarySection /> component
   */
  public render(): React.ReactElement<ISummarySectionProps> {
    return (
      <StatusSectionBase {...this.props}>
        <div className={styles.projectInformation}>
          <ProjectInformation
            hubSiteUrl={this.props.hubSite.url}
            siteId={this.props.pageContext.site.id.toString()}
            webUrl={this.props.pageContext.web.absoluteUrl}
            entity={this.props.entity}
            filterField='GtShowFieldProjectStatus'
            hideActions={true} />
        </div>
        <div className={styles.sections}>
          <div className='ms-Grid'>
            <div className='ms-Grid-row'>
              {this.renderSections()}
            </div>
          </div>
        </div>
      </StatusSectionBase>
    );
  }

  /**
   * Render sections
   * 
   * NOTE: Trying to figure out a way to avoid the ProjectStatusWebPartStrings.OverallStatusFieldName check
   */
  private renderSections() {
    const { report, sections } = this.props;
    return sections.map(s => (
      <div className='ms-Grid-col ms-sm6'>
        {s.fieldName === ProjectStatusWebPartStrings.OverallStatusFieldName
          ? <StatusElement label={s.name} value='' comment={report.item[s.fieldName]} iconName={s.iconName} height={150} />
          : <StatusElement label={s.name} value={report.item[s.fieldName]} comment={report.item[s.commentFieldName]} iconName={s.iconName} height={150} />}
      </div>
    ));
  }

}
