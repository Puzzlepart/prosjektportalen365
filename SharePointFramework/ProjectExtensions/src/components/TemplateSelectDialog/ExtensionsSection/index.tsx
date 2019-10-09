import { stringIsNullOrEmpty } from '@pnp/common';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import * as React from 'react';
import { ProjectTemplate } from '../../../models';
import styles from './ExtensionsSection.module.scss';
import { IExtensionsSectionProps } from './IExtensionsSectionProps';

export class ExtensionsSection extends React.PureComponent<IExtensionsSectionProps> {
    public render() {
        return (
            <div className={styles.extensionsSection}>
                <div className={styles.container}>
                    {this.props.extensions.map(ext => (
                        <div key={ext.key} className={styles.item}>
                            <Toggle
                                label={ext.text}
                                inlineLabel={true}
                                onChange={(_event, checked) => this._onChange(ext, checked)} />
                            <div className={styles.description} hidden={stringIsNullOrEmpty(ext.description)}>
                                <span>{ext.description}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    /**
     * On item toggle
     *
     * @param {ProjectTemplate} extension Extension
     * @param {boolean} checked Checked
     */
    private _onChange(extension: ProjectTemplate, checked: boolean): void {
        let selectedExtensions = [];
        if (checked) selectedExtensions = [extension, ...this.props.selectedExtensions];
        else selectedExtensions = this.props.selectedExtensions.filter(ext => extension.text !== ext.text);
        this.props.onChange(selectedExtensions);
    }
}
