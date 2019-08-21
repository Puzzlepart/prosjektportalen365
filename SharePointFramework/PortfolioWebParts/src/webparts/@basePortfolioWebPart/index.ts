import { BaseClientSideWebPart, IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import { sp } from '@pnp/sp';
import { IBaseComponentProps } from 'components/IBaseComponentProps';
import { DataAdapter } from 'data';
import * as moment from 'moment';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import * as merge from 'object-assign';

export class BasePortfolioWebPart<P extends IBaseComponentProps> extends BaseClientSideWebPart<P> {
    public dataAdapter: DataAdapter;
    private __title: string;

    public render(): void {
        throw new Error('Method not implemented.');
    }

    /**
     * Render component
     * 
     * @param {any} component Component 
     * @param {P} props Props
     */
    public renderComponent(component: React.ComponentClass<P>, props?: P): void {
        let _props = merge({ title: this.__title }, this.properties, props, { pageContext: this.context.pageContext, dataAdapter: this.dataAdapter });
        const element: React.ReactElement<P> = React.createElement(component, _props);
        ReactDom.render(element, this.domElement);
    }

    /**
     * Setup
     * 
     * @param {LogLevel} activeLogLevel Active log level for the web part
     * @param {string} locale Locale for moment
     */
    protected async setup(activeLogLevel: LogLevel = LogLevel.Info, locale: string = 'nb') {
        sp.setup({ spfxContext: this.context });
        Logger.subscribe(new ConsoleListener());
        Logger.activeLogLevel = activeLogLevel;
        moment.locale(locale);
        this.__title = (await sp.web.lists.getById(this.context.pageContext.list.id.toString()).items.getById(this.context.pageContext.listItem.id).select('Title').get<{ Title: string }>()).Title;
    }

    protected async onInit(): Promise<void> {
        this.dataAdapter = new DataAdapter(this.context);
        this.context.statusRenderer.clearLoadingIndicator(this.domElement);
        await this.setup();
    }

    protected onDispose(): void {
        ReactDom.unmountComponentAtNode(this.domElement);
    }

    protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
        return { pages: [] };
    }
}
