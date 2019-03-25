import * as React from 'react';
import * as sharedStrings from 'PortfolioWebPartsStrings';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import ExperienceLog from './components/ExperienceLog';
import { IExperienceLogProps } from './components/IExperienceLogProps';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';
import { Logger, LogLevel } from '@pnp/logging';

export interface IExperienceLogWebPartProps {
  title: string;
}

export default class ExperienceLogWebPart extends PortfolioBaseWebPart<IExperienceLogWebPartProps> {
  public render(): void {
    Logger.log({ message: '(ExperienceLogWebPart) render: Rendering <ExperienceLog />', level: LogLevel.Info });
    const element: React.ReactElement<IExperienceLogProps> = React.createElement(ExperienceLog, {
      context: this.context,
      ...this.properties,
      groupByColumns: [{ name: sharedStrings.SiteTitleLabel, key: 'SiteTitle', fieldName: 'SiteTitle', minWidth: 0 }],
    });
    super._render(this.manifest.alias, element);
  }

  protected async onInit(): Promise<void> {
    Logger.log({ message: '(ExperienceLogWebPart) onInit: Initializing ExperienceLogWebPart', level: LogLevel.Info });
    await super.onInit();
  }

  protected onDispose(): void {
    Logger.log({ message: '(ExperienceLogWebPart) onDispose: Disposing <ExperienceLog />', level: LogLevel.Info });
    super.onDispose();
  }

  protected get dataVersion(): Version {
    return Version.parse(this.manifest.version);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] };
  }
}
