import { IColumn } from '@fluentui/react'
import { Web } from '@pnp/sp'
import { ProjectStatusContext } from '../../context'
import { RiskElementModel } from '../../../RiskMatrix'
import { useContext } from 'react'
import { SectionContext } from '../context'

/**
 * Fetch list data
 */
export function useFetchListData() {
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
          .get<{ Title: string; InternalName: string; TypeAsString: string }[]>()
      ])
      if (items.length === 0) return null
      const itemValues = items.map((i) => i.FieldValuesAsText)
      const riskElements = itemValues.map((i) => new RiskElementModel(i))
      const columns: IColumn[] = section.viewFields
        .filter((vf) => fields.filter((fld) => fld.InternalName === vf).length === 1)
        .map((vf) => {
          const [field] = fields.filter((fld) => fld.InternalName === vf)
          return {
            key: field.InternalName,
            fieldName: field.InternalName,
            name: field.Title,
            minWidth: 100,
            maxWidth: { Text: 250, Note: 250, Choice: 150, Number: 100 }[field.TypeAsString] || 150,
            isResizable: true,
            isMultiline: true
          } as IColumn
        })
      return { items: itemValues, columns, riskElements }
    } catch (error) {
      throw error
    }
  }
}
