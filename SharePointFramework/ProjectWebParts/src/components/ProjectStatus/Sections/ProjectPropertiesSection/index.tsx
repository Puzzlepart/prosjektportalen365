import * as React from 'react';
import styles from './ProjectPropertiesSection.module.scss';
import { IProjectPropertiesSectionProps } from './IProjectPropertiesSectionProps';
import { BaseSection } from '../BaseSection';
import { StatusElement } from '../../StatusElement';
import { StatusSectionField } from '../StatusSectionField';
import { stringIsNullOrEmpty } from '@pnp/common';

export class ProjectPropertiesSection extends BaseSection<IProjectPropertiesSectionProps, {}> {
  public render(): React.ReactElement<IProjectPropertiesSectionProps> {
    return (
      <BaseSection {...this.props}>
        <div className='ms-Grid-row'>
          <div className='ms-Grid-col ms-sm12'>
            <StatusElement {...this.props.headerProps} />
          </div>
          <div className={`${styles.fields} ms-Grid-col ms-sm12`}>
            {this.renderFields()}
          </div>
        </div>
      </BaseSection>
    );
  }

  /**
   * Render fields specified in model.viewFields
   */
  public renderFields() {
    if (this.props.model.viewFields) {
      return this.props.model.viewFields.map(fieldName => {
        const [fld] = this.props.fields.filter(f => [f.InternalName, f.Title].indexOf(fieldName) !== -1);
        if (fld && !stringIsNullOrEmpty(this.props.fieldValues[fieldName])) {
          return <StatusSectionField label={fld.Title} value={this.props.fieldValues[fieldName]} />;
        }
        return null;
      });
    }
    return null;
  }
}
