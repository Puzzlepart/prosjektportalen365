import * as React from 'react';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, } from '@microsoft/sp-webpart-base';
import ResourceAllocation from './components/ResourceAllocation';
import { IResourceAllocationProps } from './components/IResourceAllocationProps';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';
import { IResourceAllocationWebPartProps } from './IResourceAllocationWebPartProps';

export default class ResourceAllocationWebPart extends PortfolioBaseWebPart<IResourceAllocationWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IResourceAllocationProps> = React.createElement(ResourceAllocation, { ...this.properties });
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
