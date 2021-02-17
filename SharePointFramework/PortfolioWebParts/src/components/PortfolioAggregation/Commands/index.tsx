import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar'
import * as strings from 'PortfolioWebPartsStrings'
import React, { useContext } from 'react'
import { PortfolioAggregationContext } from '../context'

export const Commands = () => {
    const { props } = useContext(PortfolioAggregationContext)

    const items: ICommandBarItemProps[] = []

    if (props.showExcelExportButton) {
        items.push({
            key: 'ExcelExport',
            name: strings.ExcelExportButtonLabel,
            iconProps: {
                iconName: 'ExcelDocument',
                styles: { root: { color: 'green !important' } }
            },
            buttonStyles: { root: { border: 'none' } },
            onClick: () => {
                //   this._exportToExcel(ev)
            }
        })
    }

    return (
        <div hidden={!props.showCommandBar}>
            <CommandBar items={items} farItems={[]} />
        </div>
    )
}