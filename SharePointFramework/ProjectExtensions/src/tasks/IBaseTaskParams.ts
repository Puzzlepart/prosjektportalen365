import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { IProjectSetupApplicationCustomizerProperties } from '../extensions/projectSetup/IProjectSetupApplicationCustomizerProperties';
import IProjectSetupApplicationCustomizerData from '../extensions/projectSetup/IProjectSetupApplicationCustomizerData';
import { Schema } from 'sp-js-provisioning';

export interface IBaseTaskParams {
    context: ApplicationCustomizerContext;
    properties: IProjectSetupApplicationCustomizerProperties;
    templateSchema?: Schema;
    templateParameters: { [key: string]: string };
    data: IProjectSetupApplicationCustomizerData;
    entity?: any;
}