import { CommandBar, ICommandBarProps } from 'office-ui-fabric-react/lib/CommandBar'
import { IContextualMenuItem } from 'office-ui-fabric-react/lib/ContextualMenu'
import * as strings from 'PortfolioWebPartsStrings'
import React, { useContext } from 'react'
import { isEmpty } from 'underscore'
import { PortfolioAggregationContext } from '../context'
import { SET_DATA_SOURCE } from '../reducer'

export const Commands = () => {
    const { props, state, dispatch } = useContext(PortfolioAggregationContext)

    const cmd: ICommandBarProps = {
        items: [],
        farItems: []
    }

    if (props.showExcelExportButton) {
        cmd.items.push({
            key: 'ExcelExport',
            name: strings.ExcelExportButtonLabel,
            iconProps: {
                iconName: 'ExcelDocument',
                styles: { root: { color: 'green !important' } }
            },
            buttonStyles: { root: { border: 'none' } },
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onClick: () => { }
        })
    }

    if (!isEmpty(state.dataSources)) {
        cmd.farItems.push({
            key: 'DataSources',
            name: state.dataSource,
            iconProps: { iconName: 'DataConnectionLibrary' },
            disabled: state.dataSources.length === 1,
            buttonStyles: { root: { border: 'none' } },
            subMenuProps: {
                items: state.dataSources.map((ds) => ({
                    key: `DataSources_${ds.id}`,
                    name: ds.title,
                    iconProps: { iconName: ds.iconName || 'DataConnectionLibrary' },
                    canCheck: true,
                    checked: ds.title === state.dataSource,
                    onClick: () => dispatch(SET_DATA_SOURCE({ dataSource: ds }))
                })) as IContextualMenuItem[]
            }
        })
    }

    return (
        <div hidden={!props.showCommandBar}>
            <CommandBar {...cmd} />
        </div>
    )
}