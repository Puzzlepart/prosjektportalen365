import { Web } from '@pnp/sp'
import { ProjectInformation } from 'components/ProjectInformation'
import * as React from 'react'
import { StatusElement } from '../../StatusElement'
import { IStatusElementProps } from '../../StatusElement/IStatusElementProps'
import { BaseSection } from '../BaseSection'
import styles from './SummarySection.module.scss'
import { ISummarySectionProps, ISummarySectionState } from './types'

export class SummarySection extends BaseSection<ISummarySectionProps, ISummarySectionState> {
  constructor(props: ISummarySectionProps) {
    super(props)
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
            page='ProjectStatus'
            hideActions={true}
          />
        </div>
        <div className={styles.sections}>
          <div className='ms-Grid' dir='ltr'>
            <div className='ms-Grid-row'>{this._renderSections()}</div>
          </div>
        </div>
      </BaseSection>
    )
  }

  /**
   * Render sections
   */
  private _renderSections() {
    const { report, sections } = this.props
    return sections.map((sec, idx) => {
      const { value, comment } = report.getStatusValue(sec.fieldName)
      const [columnConfig] = this.props.columnConfig.filter(
        (c) => c.columnFieldName === sec.fieldName && c.value === value
      )
      const props: IStatusElementProps = {
        label: sec.name,
        value,
        comment,
        iconName: sec.iconName,
        iconColor: columnConfig ? columnConfig.color : '#444',
        height: 150
      }
      if (sec.fieldName === 'GtOverallStatus') {
        props.comment = props.value
        props.value = ''
      }
      if (props.value) {
        return (
          <div key={idx} className='ms-Grid-col ms-sm6'>
            <StatusElement {...props} />
          </div>
        );
      }
    })
  }
}
