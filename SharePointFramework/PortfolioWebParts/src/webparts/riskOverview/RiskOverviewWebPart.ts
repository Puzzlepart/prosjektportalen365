import { BaseClientSideWebPart, IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { Logger, LogLevel } from '@pnp/logging';
import { IRiskOverviewProps, RiskOverview } from 'components';
import * as strings from 'PortfolioWebPartsStrings';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { ISetupWebPartResult, setupWebPart } from '../@setup';

export default class RiskOverviewWebPart extends BaseClientSideWebPart<IRiskOverviewProps> {
  private _setup: ISetupWebPartResult;

  public render(): void {
    Logger.log({ message: '(RiskOverviewWebPart) render: Rendering <RiskOverview />', level: LogLevel.Info });
    const element: React.ReactElement<IRiskOverviewProps> = React.createElement(RiskOverview, {
      ...this.properties,
      ...this._setup,
      pageContext: this.context.pageContext,
      groupByColumns: [{ name: strings.SiteTitleLabel, key: 'SiteTitle', fieldName: 'SiteTitle', minWidth: 0 }],
    });
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(RiskOverviewWebPart) onInit: Initializing RiskOverviewWebPart', level: LogLevel.Info });
    this._setup = await setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] };
  }
}
