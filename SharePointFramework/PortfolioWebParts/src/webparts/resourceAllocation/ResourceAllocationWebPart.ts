import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import { sp } from '@pnp/sp';
import * as moment from 'moment';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { IResourceAllocationProps } from './components/IResourceAllocationProps';
import ResourceAllocation from './components/ResourceAllocation';
import { IResourceAllocationWebPartProps } from './IResourceAllocationWebPartProps';

export default class ResourceAllocationWebPart extends BaseClientSideWebPart<IResourceAllocationWebPartProps> {
  public render() {
    Logger.log({ message: '(ResourceAllocationWebPart) render: Rendering <ResourceAllocation />', level: LogLevel.Info });
    const element: React.ReactElement<IResourceAllocationProps> = React.createElement(ResourceAllocation, { ...this.properties });
    ReactDom.render(element, this.domElement);
  }

  public async onInit() {
    moment.locale('nb');
    sp.setup({ spfxContext: this.context });
    Logger.subscribe(new ConsoleListener());
    Logger.activeLogLevel = LogLevel.Info;
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
