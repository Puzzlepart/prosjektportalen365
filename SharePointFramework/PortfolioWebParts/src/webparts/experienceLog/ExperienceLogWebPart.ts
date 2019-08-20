import { BaseClientSideWebPart, IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { Logger, LogLevel } from '@pnp/logging';
import { ExperienceLog, IExperienceLogProps } from 'components';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { ISetupWebPartResult, setupWebPart } from '../@setup';

export default class ExperienceLogWebPart extends BaseClientSideWebPart<IExperienceLogProps> {
  private _setup: ISetupWebPartResult;

  public render(): void {
    Logger.log({ message: '(ExperienceLogWebPart) render: Rendering <ExperienceLog />', level: LogLevel.Info });
    const element: React.ReactElement<IExperienceLogProps> = React.createElement(ExperienceLog, {
      ...this.properties,
      ...this._setup,
      pageContext: this.context.pageContext,
      groupByColumns: [{ name: PortfolioWebPartsStrings.SiteTitleLabel, key: 'SiteTitle', fieldName: 'SiteTitle', minWidth: 0 }],
    } as IExperienceLogProps);
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(ExperienceLogWebPart) onInit: Initializing ExperienceLogWebPart', level: LogLevel.Info });
    this._setup = await setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] };
  }
}
