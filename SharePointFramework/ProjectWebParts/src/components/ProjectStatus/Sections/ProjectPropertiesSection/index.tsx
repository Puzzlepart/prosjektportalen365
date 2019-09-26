import * as React from 'react';
import styles from './ProjectPropertiesSection.module.scss';
import { IProjectPropertiesSectionProps } from './IProjectPropertiesSectionProps';
import { BaseSection } from '../BaseSection';
import { StatusElement } from '../../StatusElement';
import { StatusSectionField } from '../StatusSectionField';

export class ProjectPropertiesSection extends BaseSection<IProjectPropertiesSectionProps, {}> {
  constructor(props: IProjectPropertiesSectionProps) {
    super(props);
  }

  /**
   * Renders the <ProjectPropertiesSection /> component
   */
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

  public renderFields() {
    if (this.props.model.viewFields) {
      const { entityFields, entityItem } = this.props;
      return this.props.model.viewFields.map(fn => {
        const [fld] = entityFields.filter(ef => ef.InternalName === fn);
        if (fld) {
          return <StatusSectionField label={fld.Title} value={entityItem[fn]} />;
        }
        return null;
      });
    }
    return null;
  }
}
