import {
  ConstrainMode,
  LayerHost,
  MarqueeSelection,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  ShimmeredDetailsList
} from '@fluentui/react'
import { FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'
import React, { FC } from 'react'
import { ListContext } from './context'
import { IListProps } from './types'
import { useList } from './useList'

export const List: FC<IListProps<any>> = (props) => {
  const fluentProviderId = useId('fp-list')
  const listProps = useList(props)

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <ListContext.Provider value={{ props: listProps }}>
          <ScrollablePane {...props.scrollablePane}>
            <MarqueeSelection selection={props.selection}>
              <ShimmeredDetailsList {...listProps} />
            </MarqueeSelection>
            {props.layerHostId && <LayerHost id={props.layerHostId} />}
          </ScrollablePane>
        </ListContext.Provider>
      </FluentProvider>
    </IdPrefixProvider>
  )
}

List.defaultProps = {
  items: [],
  columns: [],
  menuItems: [],
  isListLayoutModeJustified: false,
  selectionMode: SelectionMode.multiple,
  constrainMode: ConstrainMode.unconstrained,
  scrollablePane: {
    scrollbarVisibility: ScrollbarVisibility.auto
  }
}
