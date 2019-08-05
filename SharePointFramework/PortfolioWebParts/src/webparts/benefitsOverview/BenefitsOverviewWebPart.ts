import * as React from 'react';
import * as ReactDom from 'react-dom';
import BenefitsOverview, { IBenefitsOverviewProps } from './components/BenefitsOverview';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { setupWebPart } from '../@setup';
import { IBenefitsOverviewWebPartProps } from './IBenefitsOverviewWebPartProps';
import { Logger, LogLevel } from '@pnp/logging';

export default class BenefitsOverviewWebPart extends BaseClientSideWebPart<IBenefitsOverviewWebPartProps> {
  public render(): void {
    Logger.log({ message: '(BenefitsOverviewWebPart) render: Rendering <BenefitsOverview />', level: LogLevel.Info });
    const element: React.ReactElement<IBenefitsOverviewProps> = React.createElement(BenefitsOverview, {
      ...this.properties,
      pageContext: this.context.pageContext,
    });
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(BenefitsOverviewWebPart) onInit: Initializing BenefitsOverviewWebPart', level: LogLevel.Info });
    setupWebPart(this.context);
  }

  protected onDispose(): void {
    Logger.log({ message: '(BenefitsOverviewWebPart) onDispose: Disposing <BenefitsOverview />', level: LogLevel.Info });
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
