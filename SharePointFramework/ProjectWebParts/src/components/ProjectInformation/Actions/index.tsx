import { DefaultButton, IButtonProps } from 'office-ui-fabric-react/lib/Button';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { IActionsProps } from './IActionsProps';
import styles from './Actions.module.scss';
import { ActionType } from './ActionType';

// tslint:disable-next-line: naming-convention
export const Actions = (props: IActionsProps) => {
    const actions: ActionType[] = [
        [strings.ViewVersionHistoryText, props.versionHistoryUrl, 'History'],
        [strings.EditPropertiesText, props.editFormUrl, 'Edit'],
        [strings.SyncProjectPropertiesText, props.onSyncProperties, 'Sync'],
        [strings.EditSiteInformationText, window['_spLaunchSiteSettings'], 'Info', !window['_spLaunchSiteSettings']],
        ...(props.customActions || [])
    ];

    return (
        <div className={styles.actions} hidden={props.hidden}>
            {actions.map(([text, hrefOrOnClick, iconName, disabled]) => {
                let buttonProps: IButtonProps = { text, iconProps: { iconName }, disabled };
                if (typeof hrefOrOnClick === 'string') buttonProps.href = hrefOrOnClick;
                else buttonProps.onClick = hrefOrOnClick;
                return (
                    <div>
                        <DefaultButton {...buttonProps} style={{ width: 300 }} />
                    </div>
                );
            })}
        </div>
    );
};