import { IColumn } from '@fluentui/react'
import { Web } from '@pnp/sp'
import { ProjectStatusContext } from '../../context'
import { useContext } from 'react'
import { SectionContext } from '../context'
import { UncertaintyElementModel } from 'types'
import { IUncertaintySectionData } from './types'
import { SPField } from 'pp365-shared/lib/models'

const columnMaxWidth: Record<string, number> = { Text: 250, Note: 250, Choice: 150, Number: 100 }

/**
 * Fetch list data hook. 
 * 
 * @returns A function used to fetch data for `UncertaintySection`.
 */
export function useFetchListData(): () => Promise<IUncertaintySectionData> {
  const context = useContext(ProjectStatusContext)
  const { section } = useContext(SectionContext)
  return async () => {
    const list = new Web(context.props.webUrl).lists.getByTitle(section.listTitle)
    const viewXml = `<View><Query>${section.viewQuery}</Query><RowLimit>${section.rowLimit}</RowLimit></View>`
    try {
      const [items, fields] = await Promise.all([
        list.getItemsByCAMLQuery({ ViewXml: viewXml }, 'FieldValuesAsText') as Promise<any[]>,
        list.fields
          .select('Title', 'InternalName', 'TypeAsString')
          .get<SPField[]>()
      ])
      if (items.length === 0) return null
      const itemValues = items.map((i) => i.FieldValuesAsText)
      const matrixElements = itemValues.map((i) => new UncertaintyElementModel(i))
      const columns = section.viewFields
        .map<SPField>((viewField) => fields.find((fld) => fld.InternalName === viewField))
        .filter(Boolean)
        .map<IColumn>((field) => ({
          key: field.InternalName,
          fieldName: field.InternalName,
          name: field.Title,
          minWidth: 100,
          maxWidth: columnMaxWidth[field.TypeAsString] ?? 150,
          isResizable: true,
          isMultiline: true
        }))
        // eslint-disable-next-line no-console
        console.log(itemValues[0])
      return { items: itemValues, columns, matrixElements }
    } catch (error) {
      throw error
    }
  }
}
