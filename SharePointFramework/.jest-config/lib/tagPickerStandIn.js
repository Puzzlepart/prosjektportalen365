/**
 * Stand-in for Fluent UI v9's TagPicker parts, for tests that type into a TagPicker.
 *
 * The combobox family (`Combobox`, `Dropdown` and `TagPicker`, all built on
 * `@fluentui/react-combobox`) sends the Jest worker into an endless render loop on React 17 the
 * moment it opens. In the browser it works: Fluent's own TagPicker example on React 17 typed,
 * picked and removed in a handful of renders (phase 4, slice 7). On React 18 the loop is gone (a
 * real TagPicker typed and picked under jsdom, 2026-10-07), but opening it took close to a minute
 * on a loaded machine, so the stand-in stays. It keeps the contract a TagPicker's caller relies
 * on, so the caller's own logic is what the test runs:
 *
 * - the picker hands its `selectedOptions`, `onOptionSelect` and `disabled` to its parts;
 * - the input is a combobox that shows `value` and reports typing through `onChange`;
 * - an option reports a pick with its value and the selected options plus it;
 * - a tag reports its removal with the selected options less it, as Backspace in the empty input
 *   does for the last tag.
 *
 * Usage, above the test's imports:
 *
 *   jest.mock('@fluentui/react-components', () =>
 *     jest.requireActual('pp365-jest-config/lib/tagPickerStandIn').withTagPickerStandIn()
 *   )
 */
function withTagPickerStandIn() {
  const actual = jest.requireActual('@fluentui/react-components')
  const React = jest.requireActual('react')
  const h = React.createElement
  const Picker = React.createContext({ selectedOptions: [], onOptionSelect: undefined })
  const select = (context, event, value, selectedOptions) =>
    context.onOptionSelect && context.onOptionSelect(event, { value, selectedOptions })

  const TagPicker = ({ selectedOptions = [], onOptionSelect, disabled, children }) =>
    h(Picker.Provider, { value: { selectedOptions, onOptionSelect, disabled } }, h('div', null, children))
  const TagPickerControl = ({ className, children }) => h('div', { className }, children)
  const TagPickerGroup = (props) =>
    h('div', { role: 'group', 'aria-label': props['aria-label'] }, props.children)
  const Tag = ({ value, children }) => {
    const context = React.useContext(Picker)
    return h(
      'button',
      {
        type: 'button',
        onClick: (event) =>
          select(context, event, value, context.selectedOptions.filter((option) => option !== value))
      },
      children
    )
  }
  const TagPickerInput = (props) => {
    const context = React.useContext(Picker)
    return h('input', {
      role: 'combobox',
      'aria-label': props['aria-label'],
      placeholder: props.placeholder,
      value: props.value,
      onChange: props.onChange,
      disabled: context.disabled,
      onKeyDown: (event) => {
        if (event.key !== 'Backspace' || event.target.value) return
        const { selectedOptions } = context
        if (selectedOptions.length === 0) return
        select(context, event, selectedOptions[selectedOptions.length - 1], selectedOptions.slice(0, -1))
      }
    })
  }
  const TagPickerList = ({ children }) => h('div', { role: 'listbox' }, children)
  const TagPickerOption = ({ value, children, secondaryContent }) => {
    const context = React.useContext(Picker)
    return h(
      'div',
      {
        role: 'option',
        'aria-selected': false,
        onClick: (event) => select(context, event, value, [...context.selectedOptions, value])
      },
      children,
      secondaryContent ? h('span', null, ' ', secondaryContent) : null
    )
  }

  return {
    __esModule: true,
    ...actual,
    TagPicker,
    TagPickerControl,
    TagPickerGroup,
    Tag,
    TagPickerInput,
    TagPickerList,
    TagPickerOption
  }
}

module.exports = { withTagPickerStandIn }
