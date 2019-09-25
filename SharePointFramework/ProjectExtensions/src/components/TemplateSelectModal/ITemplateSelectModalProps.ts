import IProjectSetupApplicationCustomizerData from '../../extensions/projectSetup/IProjectSetupApplicationCustomizerData';
import { IProjectSetupBaseModalProps } from '../ProjectSetupBaseModal/IProjectSetupBaseModalProps';
import { ITemplateSelectModalState } from './ITemplateSelectModalState';

export interface ITemplateSelectModalProps extends IProjectSetupBaseModalProps {
    /**
     * @todo Describe property
     */
    data: IProjectSetupApplicationCustomizerData;

    /**
     * @todo Describe property
     */
    onSubmit: (state: ITemplateSelectModalState) => void;
}
