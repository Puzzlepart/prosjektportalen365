import { Web } from '@pnp/sp';
import { ProjectInformation } from 'components/ProjectInformation';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { StatusElement } from '../../StatusElement';
import { IStatusElementProps } from '../../StatusElement/IStatusElementProps';
import { BaseSection } from '../BaseSection';
import { ISummarySectionProps } from './ISummarySectionProps';
import { ISummarySectionState } from './ISummarySectionState';
import styles from './SummarySection.module.scss';

export class SummarySection extends BaseSection<ISummarySectionProps, ISummarySectionState> {
  constructor(props: ISummarySectionProps) {
    super(props);
  }

  /**
   * Renders the <SummarySection /> component
   */
  public render(): React.ReactElement<ISummarySectionProps> {
    return (
      <BaseSection {...this.props}>
        <div className={styles.projectInformation}>
          <ProjectInformation
            hubSite={{ web: new Web(this.props.hubSiteUrl), url: this.props.hubSiteUrl }}
            siteId={this.props.siteId}
            webUrl={this.props.webUrl}
            filterField='GtShowFieldProjectStatus'
            hideActions={true} />
        </div>
        <div className={styles.sections}>
          <div className='ms-Grid' dir='ltr'>
            <div className='ms-Grid-row'>
              {this._renderSections()}
            </div>
          </div>
        </div>
      </BaseSection>
    );
  }

  /**
   * Render sections
   * 
   * @todo Trying to figure out a way to avoid the strings.OverallStatusFieldName check
   */
  private _renderSections() {
    const { report, sections } = this.props;
    return sections.map(sec => {
      const value = report.item[sec.fieldName];
      const comment = report.item[sec.commentFieldName];
      const [columnConfig] = this.props.columnConfig.filter(c => c.columnFieldName === sec.fieldName && c.value === value);
      let props: IStatusElementProps = {
        label: sec.name,
        value,
        comment,
        iconName: sec.iconName,
        iconColor: columnConfig ? columnConfig.color : '#444',
        height: 150,
      };
      if (sec.fieldName === strings.OverallStatusFieldName) {
        props.comment = props.value;
        props.value = '';
      }
      return (
        <div className='ms-Grid-col ms-sm6'>
          <StatusElement {...props} />
        </div>
      );
    });
  }

}
