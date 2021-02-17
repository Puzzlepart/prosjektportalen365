import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar'
import React, { useContext } from 'react'
import { PortfolioAggregationContext } from '../context'

export const Commands = () => {
    const { props } = useContext(PortfolioAggregationContext)

    return (
        <div hidden={!props.showCommandBar}>
            <CommandBar items={[]} farItems={[]} />
        </div>
    )
}