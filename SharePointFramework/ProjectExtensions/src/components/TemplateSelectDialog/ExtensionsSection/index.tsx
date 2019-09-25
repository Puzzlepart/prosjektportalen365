import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import { ProjectTemplate } from '../../../models/index';
import CollapsableSection from '../../CollapsableSection/index';
import { IExtensionsSectionProps } from './IExtensionsSectionProps';
import { IExtensionsSectionState } from './IExtensionsSectionState';
import styles from './ExtensionsSection.module.scss';


export class ExtensionsSection extends React.Component<IExtensionsSectionProps, IExtensionsSectionState> {
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
                            label={ext.title}
                            onChanged={checked => this._onItemToggle(ext, checked)} />
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
    private _onItemToggle(extension: ProjectTemplate, checked: boolean): void {
        let selectedExtensions = [];
        if (checked) {
            selectedExtensions = [extension, ...this.state.selectedExtensions];
            this.setState({ selectedExtensions });
        }
        else {
            selectedExtensions = this.state.selectedExtensions.filter(ext => extension.title !== ext.title);
            this.setState({ selectedExtensions });
        }
        this.props.onChange({ selectedExtensions });
    }
}
