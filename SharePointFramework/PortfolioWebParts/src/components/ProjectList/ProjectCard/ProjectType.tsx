import React from 'react'
import styles from './ProjectCard.module.scss'

interface IProjectTypeProps extends React.HTMLAttributes<HTMLDivElement> {
    type: string[]
}

export const ProjectType: React.FunctionComponent<IProjectTypeProps> = ({ type, hidden }) => type && (
    <div hidden={hidden}>
        {type.map((type, idx) => (
            <div
                key={idx}
                className={styles.tag}
                style={{ backgroundColor: 'rgb(234,163,0,0.5)', color: 'black' }}>
                <span>{type}</span>
            </div>
        ))}
    </div>
)