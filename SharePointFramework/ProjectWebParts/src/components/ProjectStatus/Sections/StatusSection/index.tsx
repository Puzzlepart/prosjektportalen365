import React from 'react'
import { IStatusSectionProps, IStatusSectionState } from './types'
import { BaseSection } from '../BaseSection'
import { StatusElement } from '../../StatusElement'

export class StatusSection extends BaseSection<IStatusSectionProps, IStatusSectionState> {
  constructor(props: IStatusSectionProps) {
    super(props)
    this.state = {}
  }

  /**
   * Renders the <StatusSection /> component
   */
  public render(): React.ReactElement<IStatusSectionProps> {
    return (
      <BaseSection {...this.props}>
        <div className='ms-Grid-row'>
          <div className='ms-Grid-col ms-sm12'>
            <StatusElement {...this.props.headerProps} />
          </div>
        </div>
      </BaseSection>
    )
  }
}
