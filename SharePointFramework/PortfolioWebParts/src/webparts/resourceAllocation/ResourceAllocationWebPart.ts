import * as React from 'react';
import { Version } from '@microsoft/sp-core-library';
import { IPropertyPaneConfiguration, } from '@microsoft/sp-webpart-base';
import ResourceAllocation from './components/ResourceAllocation';
import { IResourceAllocationProps } from './components/IResourceAllocationProps';
import PortfolioBaseWebPart from '../@portfolioBaseWebPart';
import { IResourceAllocationWebPartProps } from './IResourceAllocationWebPartProps';
import { Logger, LogLevel } from '@pnp/logging';

export default class ResourceAllocationWebPart extends PortfolioBaseWebPart<IResourceAllocationWebPartProps> {
  public render(): void {
    Logger.log({ message: '(ResourceAllocationWebPart) render: Rendering <ResourceAllocation />', level: LogLevel.Info });
    const element: React.ReactElement<IResourceAllocationProps> = React.createElement(ResourceAllocation, { ...this.properties });
    super._render(this.manifest.alias, element);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
  }

  protected onDispose(): void {
    super.onDispose();
  }
}
