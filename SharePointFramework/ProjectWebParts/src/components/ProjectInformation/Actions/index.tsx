import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { IActionsProps } from './IActionsProps';

// tslint:disable-next-line: naming-convention
export const Actions = (props: IActionsProps) => {
    return (
        <div className={props.className} hidden={props.hidden}>
            <div>
                <DefaultButton
                    text={strings.ViewVersionHistoryText}
                    href={props.versionHistoryUrl}
                    iconProps={{ iconName: 'History' }}
                    style={{ width: 300 }} />
            </div>
            <div>
                <DefaultButton
                    text={strings.EditPropertiesText}
                    href={props.editFormUrl}
                    iconProps={{ iconName: 'Edit' }}
                    style={{ width: 300 }} />
            </div>
            <div hidden={!props.onSyncPropertiesEnabled}>
                <DefaultButton
                    text={strings.SyncProjectPropertiesText}
                    onClick={props.onSyncProperties}
                    iconProps={{ iconName: 'Sync' }}
                    style={{ width: 300 }} />
            </div>
            <div>
                <DefaultButton
                    text={strings.EditSiteInformationText}
                    onClick={() => window['_spLaunchSiteSettings']()}
                    disabled={!window['_spLaunchSiteSettings']}
                    iconProps={{ iconName: 'Info' }}
                    style={{ width: 300 }} />
            </div>
        </div>
    );
};