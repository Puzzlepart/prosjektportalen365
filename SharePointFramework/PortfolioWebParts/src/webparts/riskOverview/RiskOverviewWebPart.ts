import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'PortfolioWebPartsStrings';
import { setupWebPart } from '../@setup';
import { RiskOverview, IRiskOverviewProps } from 'components';

export default class RiskOverviewWebPart extends BaseClientSideWebPart<IRiskOverviewProps> {
  public render(): void {
    const element: React.ReactElement<IRiskOverviewProps> = React.createElement(RiskOverview, {
      ...this.properties,
      pageContext: this.context.pageContext,
      groupByColumns: [{ name: strings.SiteTitleLabel, key: 'SiteTitle', fieldName: 'SiteTitle', minWidth: 0 }],
    });
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
