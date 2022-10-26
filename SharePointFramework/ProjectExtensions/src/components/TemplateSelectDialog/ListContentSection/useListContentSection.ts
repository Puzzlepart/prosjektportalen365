import { Selection } from '@fluentui/react'
import { useContext, useEffect, useState } from 'react'
import { TemplateSelectDialogContext } from '../context'

export function useListContentSection() {
    const context = useContext(TemplateSelectDialogContext)
    const [selection, setSelection] = useState<Selection>(new Selection({
        onSelectionChanged
    }))
    function onSelectionChanged() {
        // eslint-disable-next-line prefer-rest-params, no-console
        console.log(selection.getSelection())
    }
    const [searchTerm, onSearch] = useState('')

    useEffect(() => {
        const selectedKeys = context.state.selectedListContentConfig.map((lc) => lc.key)
        for (let i = 0; i < selectedKeys.length; i++) {
            selection.setKeySelected(selectedKeys[i], true, true)
        }
        setSelection(selection)
    }, [context.state.selectedListContentConfig, searchTerm])

    const items = context.props.data.listContentConfig.filter(
        (lcc) => !lcc.hidden && lcc.text.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
    )

    return { selection, items, onSearch } as const
}
