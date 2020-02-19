import { stringIsNullOrEmpty } from '@pnp/common';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import * as React from 'react';
import { ProjectTemplate } from '../../../models';
import { ITemplateSelectorProps } from './ITemplateSelectorProps';
import styles from './TemplateSelector.module.scss';

// tslint:disable-next-line: naming-convention
export const TemplateSelector = (props: ITemplateSelectorProps) => {
    /**
   * On template selected
   * 
   * @param {IDropdownOption} opt Option
   */
    const onTemplateSelected = (opt: ProjectTemplate) => {
        props.onChange(opt);
    };

    return (
        <div className={styles.templateSelector}>
            <div className={styles.dropdown}>
                <Dropdown
                    disabled={props.templates.length <= 1}
                    defaultSelectedKey={props.selectedTemplate.key}
                    onChanged={onTemplateSelected}
                    options={props.templates} />
            </div>
            <div className={styles.description} hidden={stringIsNullOrEmpty(props.selectedTemplate.description)}>
                <span>{props.selectedTemplate.description}</span>
            </div>
        </div>
    );
};