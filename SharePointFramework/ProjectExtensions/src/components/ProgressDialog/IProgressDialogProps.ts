import { IBaseDialogProps } from '../@BaseDialog/IBaseDialogProps'

export interface IProgressDialogProps extends IBaseDialogProps {
    /**
     * Text
     */
    text: string;
    
    /**
     * Sub text
     */
    subText: string;

    /**
     * Icon name
     */
    iconName?: string;
}
