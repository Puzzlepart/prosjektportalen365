export default interface IInitialViewProps {
    className?: string;
    isLoading: boolean;
    currentChecklistItem: any;
    nextCheckPointAction: (statusValue: string, commentsValue: string, updateStatus: boolean) => void;
    commentMinLength?: number;
    commentStyle?: React.CSSProperties;
}

export const InitialViewDefaultProps: Partial<IInitialViewProps> = {
    className: "inner",
    commentMinLength: 4,
};
