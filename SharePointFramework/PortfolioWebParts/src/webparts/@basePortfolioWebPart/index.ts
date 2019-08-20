import { BaseClientSideWebPart, IPropertyPaneConfiguration } from '@microsoft/sp-webpart-base';
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging';
import { sp } from '@pnp/sp';
import { IBaseComponentProps } from 'components';
import * as moment from 'moment';
import * as React from 'react';
import * as ReactDom from 'react-dom';

export class BasePortfolioWebPart<P extends IBaseComponentProps> extends BaseClientSideWebPart<P> {
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
    public renderComponent(component: React.ComponentClass<P>, props: any = {}): void {
        const element: React.ReactElement<any> = React.createElement(component, {
            title: this.__title,
            ...(this.properties as Object),
            ...props,
            pageContext: this.context.pageContext,
        });
        ReactDom.render(element, this.domElement);
    }

    protected async onInit(): Promise<void> {
        sp.setup({ spfxContext: this.context });
        Logger.subscribe(new ConsoleListener());
        Logger.activeLogLevel = LogLevel.Info;
        moment.locale('nb');
        this.__title = (await sp.web.lists.getById(this.context.pageContext.list.id.toString()).items.getById(this.context.pageContext.listItem.id).select('Title').get<{ Title: string }>()).Title;
    }

    protected onDispose(): void {
        ReactDom.unmountComponentAtNode(this.domElement);
    }

    protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
        return { pages: [] };
    }
}
