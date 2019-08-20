import { BaseClientSideWebPart, IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { Logger, LogLevel } from '@pnp/logging';
import { DeliveriesOverview, IDeliveriesOverviewProps } from 'components';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { ISetupWebPartResult, setupWebPart } from '../@setup';

export default class DeliveriesOverviewWebPart extends BaseClientSideWebPart<IDeliveriesOverviewProps> {
  private _setup: ISetupWebPartResult;

  public render(): void {
    Logger.log({ message: '(DeliveriesOverviewWebPart) render: Rendering <DeliveriesOverview />', level: LogLevel.Info });
    const element: React.ReactElement<IDeliveriesOverviewProps> = React.createElement(
      DeliveriesOverview, {
        ...this.properties,
        ...this._setup,
        pageContext: this.context.pageContext,
        groupByColumns: [{ name: PortfolioWebPartsStrings.SiteTitleLabel, key: 'SiteTitle', fieldName: 'SiteTitle', minWidth: 0 }],
      }
    );
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(DeliveriesOverviewWebPart) onInit: Initializing DeliveriesOverviewWebPart', level: LogLevel.Info });
    this._setup = await setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] };
  }
}
