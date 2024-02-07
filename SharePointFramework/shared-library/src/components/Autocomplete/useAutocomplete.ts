import { ISearchBox } from '@fluentui/react'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { INIT, RESET } from './actions'
import styles from './Autocomplete.module.scss'
import { useAutocompleteReducer } from './reducer'
import { IAutocompleteProps } from './types'
import { useAutocompleteEvents } from './useAutocompleteEvents'

/**
 * Component logic hook for Autocomplete component. This hook is responsible for
 * managing the state of the component and providing the necessary callbacks.
 *
 * - Uses `useAutocompleteReducer` to manage the state of the component.
 * - Uses `useAutocompleteEvents` to provide the necessary callbacks.
 * - Uses `useLayoutEffect` to initialize the state of the component when
 * `props.items` or `props.defaultSelectedKey` changes.
 * - Uses `useEffect` to reset the state of the component when `props.selectedKey`
 * is `null` or `undefined`.
 * - Uses `useMemo` to memoize the `suggestions` array.
 * - Uses `useRef` and `useEffect` to focus the search box when `props.autoFocus` is `true`.
 *
 * @param props - Props
 *
 * @category Autocomplete
 */
export function useAutocomplete(props: IAutocompleteProps) {
  const [state, dispatch] = useAutocompleteReducer({
    value: '',
    selectedItem: null,
    selectedIndex: -1,
    suggestions: []
  })
  const ref = useRef<HTMLDivElement>()

  useLayoutEffect(() => dispatch(INIT({ props })), [props.defaultSelectedKey, props.items])

  useEffect(() => {
    if (props.selectedKey === null) dispatch(RESET())
  }, [props.selectedKey])

  const classNames = [styles.root]

  const suggestions = useMemo(
    () =>
      state.suggestions.map((suggestion_, index) => ({
        ...suggestion_,
        isSelected: index === state.selectedIndex
      })),
    [state.suggestions, state.selectedIndex]
  )

  const { onDismissCallout, onSetSelected, onSearch, onClear, onKeyDown } = useAutocompleteEvents({
    props,
    dispatch
  })

  const searchBoxRef = useRef<ISearchBox>()
  useEffect(() => {
    if (props.autoFocus) searchBoxRef?.current.focus()
  }, [props])

  return {
    state,
    ref,
    searchBoxRef,
    className: classNames.join(' '),
    suggestions,
    onDismissCallout,
    onSetSelected,
    onSearch,
    onClear,
    onKeyDown
  } as const
}
