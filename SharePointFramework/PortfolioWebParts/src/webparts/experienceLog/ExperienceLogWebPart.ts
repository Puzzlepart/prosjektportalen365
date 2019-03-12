import * as React from 'react';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import ExperienceLog from './components/ExperienceLog';
import { IExperienceLogProps } from './components/IExperienceLogProps';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';

export interface IExperienceLogWebPartProps { }

export default class ExperienceLogWebPart extends PortfolioBaseWebPart<IExperienceLogWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IExperienceLogProps> = React.createElement(ExperienceLog, { context: this.context });
    super._render(this.manifest.alias, element);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
  }

  protected onDispose(): void {
    super.onDispose();
  }

  protected get dataVersion(): Version {
    return Version.parse(this.manifest.version);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] };
  }
}
