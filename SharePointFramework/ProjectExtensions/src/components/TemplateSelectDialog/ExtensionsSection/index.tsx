import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import { ProjectTemplate } from '../../../models';
import { CollapsableSection } from '../../CollapsableSection';
import { IExtensionsSectionProps } from './IExtensionsSectionProps';
import styles from './ExtensionsSection.module.scss';


export class ExtensionsSection extends React.PureComponent<IExtensionsSectionProps> {
    /**
     * Constructor
     * 
     * @param {IExtensionsSectionProps} props Properties
     */
    constructor(props: IExtensionsSectionProps) {
        super(props);
        this.state = { selectedExtensions: [] };
    }

    public render() {
        return (
            <CollapsableSection
                hidden={this.props.extensions.length === 0}
                title={strings.ExtensionsTitle}
                className={styles.extensionsSection}
                contentClassName={styles.list}>
                {this.props.extensions.map((ext, idx) => (
                    <div key={idx} className={styles.listItem}>
                        <Toggle
                            label={ext.text}
                            onChanged={checked => this._onChanged(ext, checked)} />
                    </div>
                ))}
            </CollapsableSection>
        );
    }
    /**
     * On item toggle
     *
     * @param {ProjectTemplate} extension Extension
     * @param {boolean} checked Checked
     */
    private _onChanged(extension: ProjectTemplate, checked: boolean): void {
        let selectedExtensions = [];
        if (checked) {
            selectedExtensions = [extension, ...this.props.selectedExtensions];
        }
        else {
            selectedExtensions = this.props.selectedExtensions.filter(ext => extension.text !== ext.text);
        }
        this.props.onChange(selectedExtensions);
    }
}
