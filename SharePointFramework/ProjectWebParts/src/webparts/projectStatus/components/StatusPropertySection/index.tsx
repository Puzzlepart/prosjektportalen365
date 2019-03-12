import * as React from 'react';
import styles from './StatusPropertySection.module.scss';
import { IStatusPropertySectionProps } from './IStatusPropertySectionProps';
import { IStatusPropertySectionState } from './IStatusPropertySectionState';
import StatusSectionBase from '../StatusSectionBase';
import StatusElement from '../StatusElement';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { sp, SPBatch, CamlQuery } from '@pnp/sp';
import { DetailsList, IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { IStatusSectionBaseProps, StatusSectionDefaultProps } from '../StatusSectionBase/IStatusSectionBaseProps';
import SectionModel from '../SectionModel';

export enum ListItemType {
  ProjectDelivery
}

export default class StatusPropertySection extends StatusSectionBase<IStatusPropertySectionProps, IStatusPropertySectionState> {
  public static defaultProps = StatusSectionDefaultProps;

  constructor(props: IStatusPropertySectionProps) {
    super(props);

    this.state = {};
  }

  public async componentDidMount() {
    console.log(this.props);
    if (this.props.section.listTitle) {
      await this.fetchListData(this.props.section);
    }
  }

  public render(): React.ReactElement<IStatusPropertySectionProps> {
    let navUrl = null;
    if (this.props.section.source) {
      navUrl = `${this.props.context.pageContext.web.serverRelativeUrl}/${this.props.section.source}`;
    }

    return (
      <div className={styles.statusPropertySection}>
        <div className={styles.container}>
          <div className={styles.row}>
            <div className={`${styles.statusPropertySectionHeader} ${styles.column12}`}>
              <StatusElement {...this.props.headerProps} iconColumnWidth='column1' bodyColumnWidth='column11' />
            </div>
            {(navUrl) && <div className={styles.sectionIconContainer}>
              <a href={navUrl}>
                <Icon iconName='Forward' />
              </a>
            </div>}
            <div className={`${styles.statusPropertySectionFields} ${styles.column12}`}>
              {super.renderFields()}
              {(this.state.listItems && this.state.listItems.length > 0) &&
                this.renderList(this.state.listItems)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  private async fetchListData(section: SectionModel) {
    let list = await sp.web.lists.getByTitle(section.listTitle);
    let viewXml = ['<View>'];
    if (section.viewQuery) {
      viewXml.push(`<Query>${section.viewQuery}</Query>`);
    }
    if (section.rowLimit) {
      viewXml.push(`<RowLimit>${section.rowLimit}</RowLimit>`);
    }
    viewXml.push('</View>');
    const camlQuery: CamlQuery = { ViewXml: viewXml.join('') };
    let listItems = await list.getItemsByCAMLQuery(camlQuery);

    this.setState({ listItems });
  }

  private renderList(listItems: any[]) {
    let type: ListItemType = this.typeOf(listItems[0].ContentTypeId);
    let columns: IColumn[] = this.getListColumns(type);

    return (
      <DetailsList
        items={listItems}
        columns={columns}
        onRenderItemColumn={this._onRenderItemColumn}
      />
    );
  }

  /**
   * Returns the type of the supplied list items contenttype ID
   * @param contentTypeId ListItem ContentTypeId
   */
  private typeOf(contentTypeId: string): ListItemType {
    if (contentTypeId.match('0x0100D7B74DE815F946D3B0F99D19F9B36B68')) return ListItemType.ProjectDelivery;
    return null;
  }

  private getListColumns(type: ListItemType): IColumn[] {
    switch (type) {
      case ListItemType.ProjectDelivery:
        return this.props.projectDeliveryColumns;

      default:
        return [];
    }
  }

  private _onRenderItemColumn(item?: any, index?: number, column?: IColumn) {
    switch (column.key) {
      case 'title':
        return item.Title;
      case 'acceptanceDate':
        return item.GtDeliveryAcceptanceDate;
      case 'deliveryStatus':
        return item.GtDeliveryStatus;
      case 'deliveryStatusComment':
        return item.GtDeliveryStatusComment;
      case 'qualityExpectations':
        return item.GtDeliveryQualityExpectations;
    }
  }
}
