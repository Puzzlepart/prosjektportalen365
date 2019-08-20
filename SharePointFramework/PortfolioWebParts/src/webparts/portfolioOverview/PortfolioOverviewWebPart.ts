import { BaseClientSideWebPart, IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { Logger, LogLevel } from '@pnp/logging';
import { IPortfolioOverviewProps, PortfolioOverview } from 'components';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { setupWebPart, ISetupWebPartResult } from '../@setup';


export default class PortfolioOverviewWebPart extends BaseClientSideWebPart<IPortfolioOverviewProps> {
  private _setup: ISetupWebPartResult;

  public render(): void {
    Logger.log({ message: '(PortfolioOverviewWebPart) render: Rendering <PortfolioOverview />', level: LogLevel.Info });
    const element: React.ReactElement<IPortfolioOverviewProps> = React.createElement(PortfolioOverview, {
      ...this.properties,
      ...this._setup,
      pageContext: this.context.pageContext,
    });
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(PortfolioOverviewWebPart) onInit: Initializing PortfolioOverviewWebPart', level: LogLevel.Info });
    this._setup = await setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] };
  }
}
