import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { PortfolioInsights, IPortfolioInsightsProps } from 'components';
import { setupWebPart } from '../@setup';
import { Logger, LogLevel } from '@pnp/logging';

export default class PortfolioInsightsWebPart extends BaseClientSideWebPart<IPortfolioInsightsProps> {
  public render(): void {
    Logger.log({ message: '(PortfolioInsightsWebPart) render: Rendering <PortfolioInsights />', level: LogLevel.Info });
    const element: React.ReactElement<IPortfolioInsightsProps> = React.createElement(PortfolioInsights, {
      pageContext: this.context.pageContext,
      ...this.properties,
    });
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(PortfolioInsightsWebPart) onInit: Initializing PortfolioInsightsWebPart', level: LogLevel.Info });
    setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
