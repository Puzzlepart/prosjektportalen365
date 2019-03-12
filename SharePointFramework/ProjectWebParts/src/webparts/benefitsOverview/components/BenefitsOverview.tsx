import * as React from 'react';
import styles from './BenefitsOverview.module.scss';
import { DisplayMode } from '@microsoft/sp-core-library';
import { WebPartTitle } from "@pnp/spfx-controls-react/lib/WebPartTitle";
import { IBenefitsOverviewProps } from './IBenefitsOverviewProps';

export default class BenefitsOverview extends React.Component<IBenefitsOverviewProps, {}> {
  public render(): React.ReactElement<IBenefitsOverviewProps> {
    return (
      <div className={styles.benefitsOverview}>
        <div className={styles.container}>
          <div className={styles.row}>
            <div className={styles.column}>
              <WebPartTitle
                displayMode={DisplayMode.Read}
                title={this.props.title}
                updateProperty={_title => {}} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
