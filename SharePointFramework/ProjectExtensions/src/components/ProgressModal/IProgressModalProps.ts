
import { IModalProps } from 'office-ui-fabric-react/lib/Modal';
import { IBaseTaskParams } from '../../tasks/IBaseTaskParams';

export interface IProgressModalProps extends IModalProps {
    text: string;
    subText: string;
    iconName?: string;
    taskParams?: IBaseTaskParams;
}
