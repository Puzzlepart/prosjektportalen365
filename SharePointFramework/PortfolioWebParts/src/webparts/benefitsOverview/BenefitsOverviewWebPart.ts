import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BenefitsOverview, IBenefitsOverviewProps } from 'components';
import { BaseClientSideWebPart, IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { setupWebPart, ISetupWebPartResult } from '../@setup';
import { Logger, LogLevel } from '@pnp/logging';

export default class BenefitsOverviewWebPart extends BaseClientSideWebPart<IBenefitsOverviewProps> {
  private _setup: ISetupWebPartResult;

  public render(): void {
    Logger.log({ message: '(BenefitsOverviewWebPart) render: Rendering <BenefitsOverview />', level: LogLevel.Info });
    const element: React.ReactElement<IBenefitsOverviewProps> = React.createElement(BenefitsOverview, {
      ...this.properties,
      ...this._setup,
      pageContext: this.context.pageContext,
    });
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(BenefitsOverviewWebPart) onInit: Initializing BenefitsOverviewWebPart', level: LogLevel.Info });
    this._setup = await setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] };
  }
}
