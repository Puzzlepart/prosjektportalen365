import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import PortfolioOverview from './components/PortfolioOverview';
import { IPortfolioOverviewProps } from './components/IPortfolioOverviewProps';
import { setupWebPart } from '../@setup';
import { IPortfolioOverviewWebPartProps } from './IPortfolioOverviewWebPartProps';
import { Logger, LogLevel } from '@pnp/logging';

function testdecorator(ctor: Function) {
  console.log(ctor);
}

@testdecorator
export default class PortfolioOverviewWebPart extends BaseClientSideWebPart<IPortfolioOverviewWebPartProps> {
  public render(): void {
    Logger.log({ message: '(PortfolioOverviewWebPart) render: Rendering <PortfolioOverview />', level: LogLevel.Info });
    const element: React.ReactElement<IPortfolioOverviewProps> = React.createElement(PortfolioOverview, {
      ...this.properties,
      pageContext: this.context.pageContext,
    });
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(PortfolioOverviewWebPart) onInit: Initializing PortfolioOverviewWebPart', level: LogLevel.Info });
    setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
