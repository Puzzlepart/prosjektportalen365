import { IBaseWebPartComponentProps } from 'components/BaseWebPartComponent/IBaseWebPartComponentProps';

export interface IRiskMatrixWebPartProps extends IBaseWebPartComponentProps {
    width: number;
    height: number;
    listName: string;
    viewXml: string;
    probabilityFieldName: string;
    consequenceFieldName: string;
    probabilityPostActionFieldName: string;
    consequencePostActionFieldName: string;
    calloutTemplate: string;
}
