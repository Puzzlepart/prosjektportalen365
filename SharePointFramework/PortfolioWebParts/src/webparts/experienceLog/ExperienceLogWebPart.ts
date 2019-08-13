import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import { ExperienceLog, IExperienceLogProps } from 'components';
import { setupWebPart } from '../@setup';
import { Logger, LogLevel } from '@pnp/logging';

export default class ExperienceLogWebPart extends BaseClientSideWebPart<IExperienceLogProps> {
  public render(): void {
    Logger.log({ message: '(ExperienceLogWebPart) render: Rendering <ExperienceLog />', level: LogLevel.Info });
    const element: React.ReactElement<IExperienceLogProps> = React.createElement(ExperienceLog, {
      ...this.properties,
      pageContext: this.context.pageContext,
      groupByColumns: [{ name: PortfolioWebPartsStrings.SiteTitleLabel, key: 'SiteTitle', fieldName: 'SiteTitle', minWidth: 0 }],
    } as IExperienceLogProps);
    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(ExperienceLogWebPart) onInit: Initializing ExperienceLogWebPart', level: LogLevel.Info });
    setupWebPart(this.context);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
