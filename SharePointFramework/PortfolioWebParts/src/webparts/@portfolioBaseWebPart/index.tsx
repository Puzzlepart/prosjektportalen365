import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import * as moment from 'moment';
import { Logger, LogLevel, ConsoleListener } from '@pnp/logging';


export default class PortfolioBaseWebPart<T> extends BaseClientSideWebPart<T> {
    public render(): void { }

    public _render(_id: string, element: React.ReactElement<any>): void {
        ReactDom.render(element, this.domElement);
    }

    protected async onInit(): Promise<void> {
        await super.onInit();
        this.context.statusRenderer.clearLoadingIndicator(this.domElement);
        sp.setup({ spfxContext: this.context });
        Logger.subscribe(new ConsoleListener());
        Logger.activeLogLevel = LogLevel.Info;
        moment.locale('nb');
    }

    protected onDispose(): void {
        ReactDom.unmountComponentAtNode(this.domElement);
    }
}
