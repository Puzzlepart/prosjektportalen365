import { IProjectSetupData } from '../../extensions/projectSetup/IProjectSetupData';
import { IBaseDialogProps } from '../@BaseDialog/IBaseDialogProps';
import { ITemplateSelectDialogState } from './ITemplateSelectDialogState';

export interface ITemplateSelectDialogProps extends IBaseDialogProps {
    /**
     * @todo Describe property
     */
    data: IProjectSetupData;

    /**
     * @todo Describe property
     */
    onSubmit: (state: ITemplateSelectDialogState) => void;
}
