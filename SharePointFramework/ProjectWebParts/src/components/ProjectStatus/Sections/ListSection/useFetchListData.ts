import { IColumn } from '@fluentui/react'
import { AssignFrom } from '@pnp/core'
import { spfi } from '@pnp/sp'
import { ICamlQuery } from '@pnp/sp/lists'
import _ from 'lodash'
import { SPField } from 'pp365-shared-library/lib/models'
import { useContext } from 'react'
import { useProjectStatusContext } from '../../context'
import { SectionContext } from '../context'
import { IListSectionData } from './types'

const COLUMN_MAX_WIDTH: Record<string, number> = { Text: 250, Note: 250, Choice: 150, Number: 100 }

type UseFetchListDataView = { ListViewXml: string; ViewFields: { Items: string[] } }

/**
 * Fetch list data hook.
 *
 * @returns A function used to fetch data for `ListSection` and `UncertaintySection`.
 */
export function useFetchListData() {
  const context = useProjectStatusContext()
  const { section } = useContext(SectionContext)
  return async (): Promise<IListSectionData> => {
    const web = spfi(context.props.webAbsoluteUrl).using(AssignFrom(context.props.sp.web)).web
    const list = web.lists.getByTitle(section.listTitle)
    try {
      let view: UseFetchListDataView = {
        ListViewXml: `<View><Query>${section.viewQuery}</Query><RowLimit>${section.rowLimit}</RowLimit></View>`,
        ViewFields: { Items: section.viewFields }
      }
      if (section.viewName) {
        try {
          view = await list.views
            .getByTitle(section.viewName)
            .select('ListViewXml', 'ViewFields')
            .expand('ViewFields')()
        } catch {}
      }
      const camlQuery: ICamlQuery = {
        ViewXml: view.ListViewXml.replace(/<ViewFields>[\w\W]*<\/ViewFields>/gm, '')
      }
      const [items, fields] = await Promise.all([
        list.getItemsByCAMLQuery(camlQuery, 'FieldValuesAsText', 'ContentType') as Promise<any[]>,
        list.fields.select('Title', 'InternalName', 'TypeAsString')<SPField[]>()
      ])
      if (_.isEmpty(items)) return null
      const itemValues = items.map((i) => ({ ...i.FieldValuesAsText, ContentType: i?.ContentType }))
      const columns = view.ViewFields.Items.map<string>((vf) => (vf === 'LinkTitle' ? 'Title' : vf))
        .map<SPField>((vf) => fields.find((fld) => fld.InternalName === vf))
        .filter(Boolean)
        .map<IColumn>((field) => ({
          key: field.InternalName,
          fieldName: field.InternalName,
          name: field.Title,
          minWidth: 100,
          maxWidth: COLUMN_MAX_WIDTH[field.TypeAsString] ?? 150,
          isResizable: true,
          isMultiline: field.TypeAsString === 'Note',
          data: {
            type: field?.TypeAsString
          }
        }))
      return {
        items: itemValues,
        columns
      } as IListSectionData
    } catch (error) {
      throw error
    }
  }
}
