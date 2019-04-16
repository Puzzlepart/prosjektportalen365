import { sp } from '@pnp/sp';
import * as moment from 'moment';
import { Logger, LogLevel, ConsoleListener } from '@pnp/logging'; 
import { WebPartContext } from '@microsoft/sp-webpart-base';


/**
 * Setup web part
 * 
 * @param {WebPartContext} context Context
 */
export function setupWebPart(context: WebPartContext) {
    sp.setup({ spfxContext: context });
    Logger.subscribe(new ConsoleListener());
    Logger.activeLogLevel = LogLevel.Info;
    moment.locale('nb');
}