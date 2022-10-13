import { Web } from '@pnp/sp'
import {
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  SelectionMode
} from '@fluentui/react/lib/DetailsList'
import { MessageBarType } from '@fluentui/react/lib/MessageBar'
import { UserMessage } from 'pp365-shared/lib/components/UserMessage'
import { getObjectValue } from 'pp365-shared/lib/helpers'
import * as strings from 'ProjectWebPartsStrings'
import React from 'react'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection/index'
import styles from './ListSection.module.scss'
import { IListSectionData, IListSectionProps, IListSectionState } from './types'

export class ListSection extends BaseSection<
  IListSectionProps,
  IListSectionState<IListSectionData>
> {
  constructor(props: IListSectionProps) {
    super(props)
    this.state = { loading: true }
  }

  public async componentDidMount() {
    try {
      const data = await this._fetchListData()
      this.setState({ data, loading: false })
    } catch (error) {
      this.setState({ error, loading: false })
    }
  }

  /**
   * Renders the <ListSection /> component
   */
  public render(): React.ReactElement<IListSectionProps> {
    return (
      <BaseSection {...this.props}>
        <div className='ms-Grid-row'>
          <div className='ms-Grid-col ms-sm12'>
            <StatusElement {...this.props.headerProps} />
          </div>
          {this.props.showLists && this._renderList()}
        </div>
      </BaseSection>
    )
  }

  /**
   * Render list
   */
  private _renderList() {
    if (this.state.loading || !this.state.data) {
      return null
    }
    if (this.state.error) {
      return <UserMessage text={strings.ListSectionDataErrorMessage} type={MessageBarType.error} />
    }
    return (
      <div className={`${styles.list} ms-Grid-col ms-sm12`}>
        <DetailsList
          columns={getObjectValue<IColumn[]>(this.state, 'data.columns', [])}
          items={getObjectValue<any[]>(this.state, 'data.items', [])}
          selectionMode={SelectionMode.none}
          layoutMode={DetailsListLayoutMode.justified}
        />
      </div>
    )
  }

  /**
   * Fetch list data
   */
  private async _fetchListData(): Promise<IListSectionData> {
    const { listTitle, viewQuery, viewFields, rowLimit } = this.props.model
    const list = new Web(this.props.webUrl).lists.getByTitle(listTitle)
    try {
      const viewXml = `<View><Query>${viewQuery}</Query><RowLimit>${rowLimit}</RowLimit></View>`
      const [items, fields] = await Promise.all([
        list.getItemsByCAMLQuery({ ViewXml: viewXml }, 'FieldValuesAsText') as Promise<any[]>,
        list.fields
          .select('Title', 'InternalName', 'TypeAsString')
          .get<{ Title: string; InternalName: string; TypeAsString: string }[]>()
      ])
      if (items.length === 0) return null
      const itemValues = items.map((i) => i.FieldValuesAsText)
      const columns: IColumn[] = viewFields
        .filter((vf) => fields.filter((fld) => fld.InternalName === vf).length === 1)
        .map((vf) => {
          const [field] = fields.filter((fld) => fld.InternalName === vf)
          return {
            key: field.InternalName,
            fieldName: field.InternalName,
            name: field.Title,
            minWidth: 100,
            maxWidth:
              {
                Text: 250,
                Note: 250,
                Choice: 150,
                Number: 100
              }[field.TypeAsString] || 150,
            isResizable: true,
            isMultiline: true
          } as IColumn
        })
      return { items: itemValues, columns }
    } catch (error) {
      throw error
    }
  }
}

export * from './types'
