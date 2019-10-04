import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import { CollapsableSection } from '../../CollapsableSection';
import styles from './SettingsSection.module.scss';
import { ISettingsSectionProps } from './ISettingsSectionProps';

// tslint:disable-next-line: naming-convention
export const SettingsSection = (props: ISettingsSectionProps) => {
    function onChange(event: React.MouseEvent<HTMLElement, MouseEvent>, checked?: boolean) {
        props.onChange((event.currentTarget as HTMLElement).id, checked);
    }

    return (
        <CollapsableSection
            title={strings.SettingsSectionTitle}
            className={styles.settingsSection}
            contentClassName={styles.content}>
            <div className={styles.item}>
                <Toggle
                    id='includeStandardFolders'
                    label={strings.IncludeStandardFoldersLabel}
                    defaultChecked={props.defaultSettings.includeStandardFolders}
                    disabled={true}
                    onChange={onChange} />
            </div>
            <div className={styles.item}>
                <Toggle
                    id='copyPlannerTasks'
                    label={strings.CopyPlannerTasksLabel}
                    defaultChecked={props.defaultSettings.copyPlannerTasks}
                    onChange={onChange} />
            </div>
        </CollapsableSection>
    );
};

export * from './ISettingsSectionProps';