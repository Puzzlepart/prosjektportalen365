import { IBaseDialogProps } from '../@BaseDialog/IBaseDialogProps';

export interface IProgressDialogProps extends IBaseDialogProps {
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
}
