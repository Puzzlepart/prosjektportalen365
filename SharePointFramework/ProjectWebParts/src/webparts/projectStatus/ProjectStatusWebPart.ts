import * as React from 'react';
import * as ReactDom from 'react-dom';
import "@pnp/polyfill-ie11";
import ProjectStatus from './components/ProjectStatus';
import BaseWebPart, { IBaseWebPartProps } from '../baseWebPart';

export interface IProjectStatusWebPartProps extends IBaseWebPartProps {
  reportListName: string;
  reportCtId: string;
}

export default class ProjectStatusWebPart extends BaseWebPart<IProjectStatusWebPartProps> {
  constructor() {
    super();
  }

  public async onInit() {
    await super.onInit();
    this.isInitialized = true;
  }

  public render(): void {
    super._render(ProjectStatus);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }
}
