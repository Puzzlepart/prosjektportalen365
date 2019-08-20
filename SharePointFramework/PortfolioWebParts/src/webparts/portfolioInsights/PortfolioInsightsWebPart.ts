import { BaseClientSideWebPart, IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { Logger, LogLevel } from '@pnp/logging';
import { IPortfolioInsightsProps, PortfolioInsights } from 'components';
import 'office-ui-fabric-react/dist/css/fabric.min.css';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { ISetupWebPartResult, setupWebPart } from '../@setup';

export default class PortfolioInsightsWebPart extends BaseClientSideWebPart<IPortfolioInsightsProps> {
  private _setup: ISetupWebPartResult;

  public render(): void {
    Logger.log({ message: '(PortfolioInsightsWebPart) render: Rendering <PortfolioInsights />', level: LogLevel.Info });
    const element: React.ReactElement<IPortfolioInsightsProps> = React.createElement(PortfolioInsights, {
      ...this.properties,
      ...this._setup,
      pageContext: this.context.pageContext,
    });
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(PortfolioInsightsWebPart) onInit: Initializing PortfolioInsightsWebPart', level: LogLevel.Info });
    this._setup = await setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] };
  }
}
