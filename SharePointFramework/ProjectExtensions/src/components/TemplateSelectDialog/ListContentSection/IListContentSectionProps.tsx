import { ListContentConfig } from '../../../models/index';

export interface IListContentSectionProps {
    listContentConfig: ListContentConfig[];
    onChange: (obj: { selectedListConfig: ListContentConfig[] }) => void;
}
