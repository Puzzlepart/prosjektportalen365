import * as React from 'react';
import * as strings from 'BenefitsOverviewWebPartStrings';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import BenefitsOverview from './components/BenefitsOverview';
import { IBenefitsOverviewProps } from './components/IBenefitsOverviewProps';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';
import { IBenefitsOverviewWebPartProps } from './IBenefitsOverviewWebPartProps';

export default class BenefitsOverviewWebPart extends PortfolioBaseWebPart<IBenefitsOverviewWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IBenefitsOverviewProps> = React.createElement(BenefitsOverview, {
      ...this.properties,
      context: this.context,
      groupByColumns: [
        { name: strings.SiteTitleLabel, key: 'siteTitle', fieldName: 'siteTitle', minWidth: 0 },
        ...BenefitsOverview.defaultProps.groupByColumns,
      ],
    });
    super._render(this.manifest.alias, element);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
  }

  protected onDispose(): void {
    super.onDispose();
  }

  protected get dataVersion(): Version {
    return Version.parse(this.manifest.version);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] };
  }
}
