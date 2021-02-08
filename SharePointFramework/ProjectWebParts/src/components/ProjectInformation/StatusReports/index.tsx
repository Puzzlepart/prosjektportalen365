import { DisplayMode } from '@microsoft/sp-core-library'
import { WebPartTitle } from '@pnp/spfx-controls-react/lib/WebPartTitle'
import { ActionButton } from 'office-ui-fabric-react/lib/Button'
import * as React from 'react'
import { formatDate } from 'pp365-shared/lib/helpers/formatDate'
import { IStatusReportsProps } from './types'
import styles from './StatusReports.module.scss'

export class StatusReports extends React.Component<IStatusReportsProps, {}> {
  public static defaultProps: Partial<IStatusReportsProps> = { iconName: 'PageCheckedin' }

  public render(): React.ReactElement<IStatusReportsProps> {
    return (
      <div className={styles.statusReports} hidden={this.props.hidden}>
        <WebPartTitle
          displayMode={DisplayMode.Read}
          title={this.props.title}
          updateProperty={undefined}
        />
        <ul>
          {this.props.statusReports.map((report, idx) => (
            <li className={styles.item} key={idx}>
              <ActionButton
                href={report.url(this.props.urlSourceParam)}
                text={formatDate(report.created, true)}
                iconProps={{ iconName: this.props.iconName }}
              />
            </li>
          ))}
        </ul>
      </div>
    )
  }
}

export { IStatusReportsProps }
