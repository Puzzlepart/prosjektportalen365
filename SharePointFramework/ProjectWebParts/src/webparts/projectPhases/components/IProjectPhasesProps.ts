import { IProjectPhasesWebPartProps } from "../IProjectPhasesWebPartProps";
import { PageContext } from '@microsoft/sp-page-context';

export interface IProjectPhasesProps extends IProjectPhasesWebPartProps {
  pageContext: PageContext;
}
