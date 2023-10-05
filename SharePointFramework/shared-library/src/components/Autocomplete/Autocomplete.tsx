import { Callout, FocusZone, FocusZoneDirection, Label, List, SearchBox } from '@fluentui/react'
import React, { FC } from 'react'
import _ from 'underscore'
import { IAutocompleteProps } from '.'
import { SuggestionItem } from './SuggestionItem'
import { useAutocomplete } from './useAutocomplete'
import styles from './Autocomplete.module.scss'

/**
 * Autocomplete component using `<SearchBox />`, `<Callout />`,
 * `<FocusZone />` and `<List />` from `@fluentui/react`.
 */
export const Autocomplete: FC<IAutocompleteProps> = (props) => {
  const {
    state,
    ref,
    searchBoxRef,
    className,
    suggestions,
    onDismissCallout,
    onSetSelected,
    onSearch,
    onClear,
    onKeyDown
  } = useAutocomplete(props)
  return (
    <div className={className} onKeyDown={onKeyDown}>
      {props.label && (
        <Label disabled={props.disabled} required={props.required}>
          {props?.label}
        </Label>
      )}
      <div ref={ref}>
        <SearchBox
          styles={{ root: styles.searchBox }}
          componentRef={searchBoxRef}
          key={state.selectedItem?.key}
          defaultValue={state.value}
          iconProps={{
            iconName: state.selectedItem?.iconName || 'Search',
            ...props.iconProps
          }}
          placeholder={props.placeholder}
          disabled={props.disabled}
          autoComplete='off'
          autoCorrect='off'
          onClear={onClear}
          onChange={onSearch}
        />
      </div>
      <Callout
        gapSpace={2}
        alignTargetEdge={true}
        hidden={_.isEmpty(state.suggestions)}
        onDismiss={() => onDismissCallout(null)}
        calloutMaxHeight={props.maxHeight || 450}
        style={{ width: ref.current?.clientWidth }}
        target={ref?.current}
        directionalHint={5}
        isBeakVisible={false}
      >
        <div>
          <FocusZone direction={FocusZoneDirection.vertical}>
            <List
              tabIndex={0}
              items={suggestions}
              onRenderCell={(item, index) => (
                <SuggestionItem
                  key={item.key}
                  item={item}
                  itemIcons={props.itemIcons}
                  onClick={() => onDismissCallout(item)}
                  onMouseOver={() => onSetSelected(index)}
                />
              )}
            />
          </FocusZone>
        </div>
      </Callout>
    </div>
  )
}

export * from './types'
