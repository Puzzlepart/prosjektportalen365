import * as React from 'react';
import { IStatusSectionProps } from './IStatusSectionProps';
import { IStatusSectionState } from './IStatusSectionState';
import StatusSectionBase from '../@StatusSectionBase';
import StatusElement from '../StatusElement';


export default class StatusSection extends StatusSectionBase<IStatusSectionProps, IStatusSectionState> {
  constructor(props: IStatusSectionProps) {
    super(props);
    this.state = {};
  }

  /**
   * Renders the <StatusSection /> component
   */
  public render(): React.ReactElement<IStatusSectionProps> {
    return (
      <StatusSectionBase {...this.props}>
        <div className='ms-Grid-row'>
          <div className='ms-Grid-col ms-sm12'>
            <StatusElement {...this.props.headerProps} />
          </div>
        </div>
      </StatusSectionBase>
    );
  }
}
