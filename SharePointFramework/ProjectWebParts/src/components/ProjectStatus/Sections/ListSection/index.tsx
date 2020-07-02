import { sp } from '@pnp/sp'
import { DetailsList, DetailsListLayoutMode, IColumn, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import * as strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { getObjectValue } from 'shared/lib/helpers'
import { BaseSection } from '../BaseSection/index'
import { StatusElement } from '../../StatusElement'
import { IListSectionData } from './IListSectionData'
import { IListSectionProps } from './IListSectionProps'
import { IListSectionState } from './IListSectionState'
import styles from './ListSection.module.scss'

export class ListSection extends BaseSection<IListSectionProps, IListSectionState<IListSectionData>> {
  constructor(props: IListSectionProps) {
    super(props)
    this.state = { isLoading: true }
  }

  public async componentDidMount() {
    try {
      const data = await this._fetchData()
      this.setState({ data, isLoading: false })
    } catch (error) {
      this.setState({ error, isLoading: false })
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
          {this._renderList()}
        </div>
      </BaseSection>
    )
  }

  /**
   * Render list
   */
  private _renderList() {
    if (this.state.isLoading || !this.state.data) {
      return null
    }
    if (this.state.error) {
      return <MessageBar messageBarType={MessageBarType.error}>{strings.ListSectionDataErrorMessage}</MessageBar>
    }
    return (
      <div className={`${styles.list} ms-Grid-col ms-sm12`}>
        <DetailsList
          columns={getObjectValue<IColumn[]>(this.state, 'data.columns', [])}
          items={getObjectValue<any[]>(this.state, 'data.items', [])}
          selectionMode={SelectionMode.none}
          layoutMode={DetailsListLayoutMode.justified} />
      </div>
    )
  }

  /**
   * Fetch data
   */
  private async _fetchData(): Promise<IListSectionData> {
    const { listTitle, viewQuery, viewFields, rowLimit } = this.props.model
    const list = sp.web.lists.getByTitle(listTitle)
    try {
      const viewXml = `<View><Query>${viewQuery}</Query><RowLimit>${rowLimit}</RowLimit></View>`
      const [items, fields] = await Promise.all([
        list.getItemsByCAMLQuery({ ViewXml: viewXml }, 'FieldValuesAsText') as Promise<any[]>,
        list.fields.select('Title', 'InternalName', 'TypeAsString').get<{ Title: string; InternalName: string; TypeAsString: string }[]>(),
      ])
      if (items.length === 0) return null
      const itemValues = items.map(i => i.FieldValuesAsText)
      const columns: IColumn[] = viewFields
        .filter(vf => fields.filter(fld => fld.InternalName === vf).length === 1)
        .map(vf => {
          const [field] = fields.filter(fld => fld.InternalName === vf)
          return ({
            key: field.InternalName,
            fieldName: field.InternalName,
            name: field.Title,
            minWidth: 100,
            maxWidth: { Text: 250, Note: 250, Choice: 150, Number: 100 }[field.TypeAsString] || 150,
            isResizable: true,
          } as IColumn)
        })
      return { items: itemValues, columns }
    } catch (error) {
      throw error
    }
  }
}
