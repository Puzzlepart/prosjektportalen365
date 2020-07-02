import { PageContext } from '@microsoft/sp-page-context'
import { DataAdapter } from 'data'

export interface IBaseComponentProps {
    title?: string;
    pageContext?: PageContext;
    dataAdapter?: DataAdapter;
}
