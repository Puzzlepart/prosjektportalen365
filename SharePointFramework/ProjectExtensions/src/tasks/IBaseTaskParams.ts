import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { Schema, Web } from 'sp-js-provisioning';
import { ISpfxJsomContext } from 'spfx-jsom';
import IProjectSetupApplicationCustomizerData from '../extensions/projectSetup/IProjectSetupApplicationCustomizerData';
import { IProjectSetupApplicationCustomizerProperties } from '../extensions/projectSetup/IProjectSetupApplicationCustomizerProperties';

export interface IBaseTaskParams {
    web: Web;
    templateParameters: { [key: string]: string };
    templateExcludeHandlers: string[];
    context: ApplicationCustomizerContext;
    properties: IProjectSetupApplicationCustomizerProperties;
    spfxJsomContext?: ISpfxJsomContext;
    templateSchema?: Schema;
    data?: IProjectSetupApplicationCustomizerData;
    entity?: any;
}