import { IBaseTaskParams } from '../../tasks/IBaseTaskParams';
import { IBaseDialogProps } from '../@BaseDialog/IBaseDialogProps';

export interface IProgressModalProps extends IBaseDialogProps {
    /**
     * @todo Describe property
     */
    text: string;
    /**
     * @todo Describe property
     */
    subText: string;
    /**
     * @todo Describe property
     */
    iconName?: string;
    /**
     * @todo Describe property
     */
    taskParams?: IBaseTaskParams;
}
