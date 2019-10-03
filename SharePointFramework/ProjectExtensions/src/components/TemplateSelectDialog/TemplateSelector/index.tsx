import { stringIsNullOrEmpty } from '@pnp/common';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import { ProjectTemplate } from '../../../models';
import { ITemplateSelectorProps } from './ITemplateSelectorProps';
import styles from './TemplateSelector.module.scss';

export class TemplateSelector extends React.PureComponent<ITemplateSelectorProps> {
    public render() {
        return (
            <div className={styles.TemplateSelector}>
                <div className={styles.title}>{strings.TemplateSelectorTitle}</div>
                <div className={styles.dropdown}>
                    <Dropdown
                        defaultSelectedKey={this.props.selectedTemplate.key}
                        onChanged={this._onTemplateSelected.bind(this)}
                        options={this.props.templates} />
                </div>
                <div className={styles.description} hidden={stringIsNullOrEmpty(this.props.selectedTemplate.description)}>
                    <span>{this.props.selectedTemplate.description}</span>
                </div>
            </div>
        );
    }

    /**
     * On template selected
     * 
     * @param {IDropdownOption} opt Option
     */
    private _onTemplateSelected(opt: ProjectTemplate) {
        this.props.onChange(opt);
    }
}