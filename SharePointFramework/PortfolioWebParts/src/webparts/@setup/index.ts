import { sp, SPRest } from '@pnp/sp';
import * as moment from 'moment';
import { Logger, LogLevel, ConsoleListener } from '@pnp/logging';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface ISetupWebPartResult {
    title: string;
}

/**
 * Setup web part
 * 
 * @param {WebPartContext} context Context
 */
export async function setupWebPart(context: WebPartContext): Promise<ISetupWebPartResult> {
    sp.setup({ spfxContext: context });
    Logger.subscribe(new ConsoleListener());
    Logger.activeLogLevel = LogLevel.Info;
    moment.locale('nb');
    let title = (await sp.web.lists.getById(context.pageContext.list.id.toString()).items.getById(context.pageContext.listItem.id).select('Title').get<{ Title: string }>()).Title;
    return { title };
}