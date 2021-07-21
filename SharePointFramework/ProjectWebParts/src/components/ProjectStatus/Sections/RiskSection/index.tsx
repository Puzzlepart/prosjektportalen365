import { Web } from '@pnp/sp'
import {
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  SelectionMode
} from 'office-ui-fabric-react/lib/DetailsList'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import * as strings from 'ProjectWebPartsStrings'
import * as React from 'react'
import { RiskMatrix } from '../../../RiskMatrix'
import { RiskElementModel } from '../../../RiskMatrix'
import { StatusElement } from '../../StatusElement'
import { BaseSection } from '../BaseSection'
import { IRiskSectionProps, IRiskSectionState, IRiskSectionData } from './types'
import styles from './RiskSection.module.scss'

export class RiskSection extends BaseSection<IRiskSectionProps, IRiskSectionState> {
  constructor(props: IRiskSectionProps) {
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
   * Renders the <RiskSection /> component
   */
  public render(): React.ReactElement<IRiskSectionProps> {
    return (
      <BaseSection {...this.props}>
        <div className='ms-Grid-row'>
          <div className='ms-Grid-col ms-sm12'>
            <StatusElement {...this.props.headerProps} />
          </div>
          {this._renderContent()}
        </div>
      </BaseSection>
    )
  }

  /**
   * Render content
   */
  private _renderContent() {
    if (this.state.loading || !this.state.data) return null
    if (this.state.error)
      return (
        <MessageBar messageBarType={MessageBarType.error}>
          {strings.ListSectionDataErrorMessage}
        </MessageBar>
      )
    return (
      <>
        <div className='ms-Grid-col ms-sm12'>
          <RiskMatrix {...this.props.riskMatrix} items={this.state.data.riskElements} />
        </div>
        <div className={`${styles.list} ms-Grid-col ms-sm12`}>
          <DetailsList
            columns={this.state.data.columns}
            items={this.state.data.items}
            selectionMode={SelectionMode.none}
            layoutMode={DetailsListLayoutMode.justified}
          />
        </div>
      </>
    )
  }

  /**
   * Fetch data
   */
  private async _fetchListData(): Promise<IRiskSectionData> {
    const { listTitle, viewQuery, viewFields, rowLimit } = this.props.model
    const list = new Web(this.props.webUrl).lists.getByTitle(listTitle)
    const viewXml = `<View><Query>${viewQuery}</Query><RowLimit>${rowLimit}</RowLimit></View>`
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
      const columns: IColumn[] = viewFields
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
