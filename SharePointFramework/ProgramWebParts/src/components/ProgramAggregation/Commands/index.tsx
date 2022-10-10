import { CommandBar, ICommandBarProps } from 'office-ui-fabric-react/lib/CommandBar'
import ExcelExportService from 'pp365-shared/lib/services/ExcelExportService'
import strings from 'ProgramWebPartsStrings'
import React, { FunctionComponent, useContext } from 'react'
import { ProgramAggregationContext } from '../context'

export const Commands: FunctionComponent = () => {
  const context = useContext(ProgramAggregationContext)

  const cmd: ICommandBarProps = {
    items: [],
    farItems: []
  }

  if (context.props.showExcelExportButton) {
    cmd.items.push({
      key: 'ExcelExport',
      name: strings.ExcelExportButtonLabel,
      iconProps: {
        iconName: 'ExcelDocument',
        styles: { root: { color: 'green !important' } }
      },
      buttonStyles: { root: { border: 'none' } },
      onClick: () => {
        ExcelExportService.configure({ name: context.props.title })
        ExcelExportService.export(context.state.items, [
          {
            key: 'SiteTitle',
            fieldName: 'SiteTitle',
            name: strings.SiteTitleLabel,
            minWidth: null
          },
          ...(context.state.columns as any[])
        ])
      }
    })
  }

  return (
    <div hidden={!context.props.showCommandBar}>
      <CommandBar {...cmd} />
    </div>
  )
}
