import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { IProjectSetupApplicationCustomizerProperties } from '../extensions/projectSetup/IProjectSetupApplicationCustomizerProperties';
import IProjectSetupApplicationCustomizerData from '../extensions/projectSetup/IProjectSetupApplicationCustomizerData';
import { Schema } from 'sp-js-provisioning';

export interface IBaseTaskParams {
    templateParameters: { [key: string]: string };
    templateExcludeHandlers: string[];
    context: ApplicationCustomizerContext;
    properties: IProjectSetupApplicationCustomizerProperties;
    templateSchema?: Schema;
    data?: IProjectSetupApplicationCustomizerData;
    entity?: any;
}