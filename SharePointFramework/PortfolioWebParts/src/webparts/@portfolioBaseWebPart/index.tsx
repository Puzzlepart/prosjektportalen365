import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { sp } from '@pnp/sp';
import * as moment from 'moment';
import { Logger, LogLevel, ConsoleListener } from '@pnp/logging';


export default class PortfolioBaseWebPart<T> extends BaseClientSideWebPart<T> {
    private placeholder: HTMLElement;

    public render(): void { }

    public _render(id: string, element: React.ReactElement<any>): void {
        // try {
        //     ReactDom.unmountComponentAtNode(this.domElement);
        // } catch (error) { }
        // if (!this.placeholder) {
        //     this.placeholder = document.createElement('DIV');
        //     this.placeholder.id = id;
        //     this.domElement.appendChild(this.placeholder);
        // }
        ReactDom.render(element, this.domElement);
    }

    protected async onInit(): Promise<void> {
        await super.onInit();
        sp.setup({ spfxContext: this.context });
        Logger.subscribe(new ConsoleListener());
        Logger.activeLogLevel = LogLevel.Info;
        moment.locale('nb');
    }

    protected onDispose(): void { }
}
