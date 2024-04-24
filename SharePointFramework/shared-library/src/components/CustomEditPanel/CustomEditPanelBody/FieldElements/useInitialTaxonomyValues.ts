import { useCallback } from 'react'

interface ITermLabel {
    name: string
    isDefault: boolean
    languageTag: string
}

interface ITagTerm {
    key: string
    name: string
}

interface IModernTaxonomyTerm {
    id: string
    labels: ITermLabel[]
}

export type Term = ITagTerm | IModernTaxonomyTerm;

export const useInitialTaxonomyValues = () => {
    const mapInitialValues = useCallback((term: Term) => {
        if ('id' in term) {
            return { labels: term.labels, id: term.id }
        } else {
            return { labels: [{ name: term.name, isDefault: true, languageTag: 'nb-NO' }], id: term.key }
        }
    }, [])

    return mapInitialValues
}