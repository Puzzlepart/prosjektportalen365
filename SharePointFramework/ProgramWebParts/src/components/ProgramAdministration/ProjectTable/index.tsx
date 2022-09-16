import React, { FunctionComponent } from 'react'
import { ListView } from '@pnp/spfx-controls-react/lib/ListView'
import { IProjectTableProps } from './types'
import strings from 'ProgramWebPartsStrings'

export const ProjectTable: FunctionComponent<IProjectTableProps> = ({
  fields,
  projects,
  onSelect,
  selectionMode,
  width
}) => {
  return (
    <div style={width ? { width, height: '600px', overflowX: 'auto' } : {}}>
      <ListView
        items={projects}
        viewFields={fields}
        selectionMode={selectionMode}
        showFilter
        filterPlaceHolder={strings.ProgramSearchProjectsText}
        selection={(item: any[]): void => onSelect(item)}
      />
    </div>
  )
}
