import { PropertyPaneDropdown } from '@microsoft/sp-webpart-base';
import { LogLevel } from '@pnp/logging';

export const LOGGING_PAGE = {
    groups: [
        {
            groupFields: [
                PropertyPaneDropdown('logLevel', {
                    label: 'LogLevel',
                    options: [
                        {
                            key: LogLevel.Off,
                            text: 'Off',
                        },
                        {
                            key: LogLevel.Info,
                            text: 'Info',
                        },
                        {
                            key: LogLevel.Warning,
                            text: 'Warning',
                        },
                        {
                            key: LogLevel.Error,
                            text: 'Error',
                        },
                        {
                            key: LogLevel.Verbose,
                            text: 'Verbose',
                        }
                    ]
                }),
            ],
        },
    ]
};