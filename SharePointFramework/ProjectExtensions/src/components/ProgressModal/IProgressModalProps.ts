import { IBaseTaskParams } from '../../tasks/IBaseTaskParams';
import { IProjectSetupBaseModalProps } from '../ProjectSetupBaseModal/IProjectSetupBaseModalProps';

export interface IProgressModalProps extends IProjectSetupBaseModalProps {
    text: string;
    subText: string;
    iconName?: string;
    taskParams?: IBaseTaskParams;
}
