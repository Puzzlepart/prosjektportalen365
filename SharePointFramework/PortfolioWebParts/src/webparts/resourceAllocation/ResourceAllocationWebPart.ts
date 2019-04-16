import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import ResourceAllocation from './components/ResourceAllocation';
import { IResourceAllocationProps } from './components/IResourceAllocationProps';
import { IResourceAllocationWebPartProps } from './IResourceAllocationWebPartProps';
import { Logger, LogLevel, ConsoleListener } from '@pnp/logging';
import { sp } from '@pnp/sp';

export default class ResourceAllocationWebPart extends BaseClientSideWebPart<IResourceAllocationWebPartProps> {
  public render() {
    Logger.log({ message: '(ResourceAllocationWebPart) render: Rendering <ResourceAllocation />', level: LogLevel.Info });
    const element: React.ReactElement<IResourceAllocationProps> = React.createElement(ResourceAllocation, { ...this.properties });
    ReactDom.render(element, this.domElement);
  }

  public async onInit() {
    
    sp.setup({ spfxContext: this.context });
    Logger.subscribe(new ConsoleListener());
    Logger.activeLogLevel = LogLevel.Info;
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
