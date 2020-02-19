import { stringIsNullOrEmpty } from '@pnp/common';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import * as React from 'react';
import { ProjectTemplate } from '../../../models';
import styles from './ExtensionsSection.module.scss';
import { IExtensionsSectionProps } from './IExtensionsSectionProps';

// tslint:disable-next-line: naming-convention
export const ExtensionsSection = (props: IExtensionsSectionProps) => {
    /**
     * On item toggle
     *
     * @param {ProjectTemplate} extension Extension
     * @param {boolean} checked Checked
     */
    const onChange = (extension: ProjectTemplate, checked: boolean): void => {
        let selectedExtensions = [];
        if (checked) selectedExtensions = [extension, ...props.selectedExtensions];
        else selectedExtensions = props.selectedExtensions.filter(ext => extension.text !== ext.text);
        props.onChange(selectedExtensions);
    };

    const selectedKeys = props.selectedExtensions.map(lc => lc.key);


    return (
        <div className={styles.extensionsSection}>
            <div className={styles.container}>
                {props.extensions.map(ext => (
                    <div key={ext.key} className={styles.item}>
                        <Toggle
                            label={ext.text}
                            defaultChecked={selectedKeys.indexOf(ext.key) !== -1}
                            inlineLabel={true}
                            onChange={(_event, checked) => onChange(ext, checked)} />
                        <div className={styles.description} hidden={stringIsNullOrEmpty(ext.subText)}>
                            <span>{ext.subText}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};