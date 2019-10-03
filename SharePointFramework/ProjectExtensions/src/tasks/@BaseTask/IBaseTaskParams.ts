import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { HubConfigurationService } from 'shared/lib/services';
import { SpEntityPortalService } from 'sp-entityportal-service';
import { Schema, Web } from 'sp-js-provisioning';
import { ISpfxJsomContext } from 'spfx-jsom';
import { IProjectSetupApplicationCustomizerProperties } from '../../extensions/projectSetup/IProjectSetupApplicationCustomizerProperties';

export interface IBaseTaskParams {
    /**
     * @todo Describe property
     */
    web: Web;

    /**
     * @todo Describe property
     */
    webAbsoluteUrl: string;

    /**
     * @todo Describe property
     */
    templateParameters?: { [key: string]: string };

    /**
     * @todo Describe property
     */
    templateExcludeHandlers: string[];

    /**
     * @todo Describe property
     */
    context: ApplicationCustomizerContext;

    /**
     * @todo Describe property
     */
    properties: IProjectSetupApplicationCustomizerProperties;

    /**
     * @todo Describe property
     */
    spfxJsomContext?: ISpfxJsomContext;

    /**
     * @todo Describe property
     */
    templateSchema?: Schema;

    /**
     * @todo Describe property
     */
    spEntityPortalService?: SpEntityPortalService;

    /**
     * @todo Describe property
     */
    hubConfigurationService?: HubConfigurationService;
}