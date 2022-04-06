import React from 'react'
import styles from './ProjectCard.module.scss'

interface IProjectLifecycleStatus extends React.HTMLAttributes<HTMLDivElement> {
    lifecycleStatus: string
}

export const ProjectLifecycleStatus: React.FunctionComponent<IProjectLifecycleStatus> = ({
    lifecycleStatus,
    hidden
}) => lifecycleStatus && (
    <div
        hidden={hidden}
        className={styles.tag}
        style={
            lifecycleStatus === 'Aktivt'
                ? { backgroundColor: 'rgb(234,163,0,0.5)', color: 'black' }
                : { backgroundColor: 'rgb(255,0,0,0.5)', color: 'black' }
        }>
        <span>{lifecycleStatus}</span>
    </div>
)
