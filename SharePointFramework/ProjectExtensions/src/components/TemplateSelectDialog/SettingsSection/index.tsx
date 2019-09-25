import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import CollapsableSection from '../../CollapsableSection/index';
import styles from './SettingsSection.module.scss';
import { ISettingsSectionProps } from './ISettingsSectionProps';

// tslint:disable-next-line: naming-convention
export const SettingsSection = (props: ISettingsSectionProps) => {
    return (
        <CollapsableSection
            title={strings.SettingsTitle}
            className={styles.settingsSection}
            contentClassName={styles.content}>
            <div className={styles.item}>
                <Toggle
                    label={strings.IncludeStandardFoldersLabel}
                    defaultChecked={props.defaultChecked.includeStandardFolders}
                    disabled={true}
                    onChanged={includeStandardFolders => props.onChange({ includeStandardFolders })} />
            </div>
            <div className={styles.item}>
                <Toggle
                    label={strings.CopyPlannerTasksLabel}
                    defaultChecked={props.defaultChecked.copyPlannerTasks}
                    onChanged={copyPlannerTasks => props.onChange({ copyPlannerTasks })} />
            </div>
        </CollapsableSection>
    );
};