import { BaseClientSideWebPart, IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import '@pnp/polyfill-ie11';
import { sp } from '@pnp/sp';
import { IBaseComponentProps } from 'components/IBaseComponentProps';
import { DataAdapter } from 'data';
import * as moment from 'moment';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import * as merge from 'object-assign';
import { ApplicationInsightsLogListener } from 'shared/lib/logging';
import { virtual } from '@microsoft/decorators';

export class BasePortfolioWebPart<T extends IBaseComponentProps> extends BaseClientSideWebPart<T> {
    public dataAdapter: DataAdapter;
    private _pageTitle: string;

    @virtual
    public render(): void {
        throw new Error('Method not implemented.');
    }

    /**
     * Render component
     * 
     * @param {any} component Component 
     * @param {T} props Props
     */
    public renderComponent(component: React.ComponentClass<T>, props?: T): void {
        let combinedProps = merge({ title: this._pageTitle }, this.properties, props, { pageContext: this.context.pageContext, dataAdapter: this.dataAdapter });
        const element: React.ReactElement<T> = React.createElement(component, combinedProps);
        ReactDom.render(element, this.domElement);
    }

    /**
     * Setup
     * 
     * @param {LogLevel} activeLogLevel Active log level for the web part
     * @param {string} locale Locale for moment
     */
    protected async _setup(activeLogLevel: LogLevel = LogLevel.Info, locale: string = 'nb') {
        sp.setup({ spfxContext: this.context });
        Logger.subscribe(new ConsoleListener());
        Logger.subscribe(new ApplicationInsightsLogListener(this.context.pageContext));
        Logger.activeLogLevel = activeLogLevel;
        moment.locale(locale);
        try {
            this._pageTitle = (await sp.web.lists.getById(this.context.pageContext.list.id.toString()).items.getById(this.context.pageContext.listItem.id).select('Title').get<{ Title: string }>()).Title;
        } catch (error) { }
    }

    public async onInit(): Promise<void> {
        this.dataAdapter = new DataAdapter(this.context);
        this.context.statusRenderer.clearLoadingIndicator(this.domElement);
        await this._setup();
    }

    public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
        return { pages: [] };
    }
}
