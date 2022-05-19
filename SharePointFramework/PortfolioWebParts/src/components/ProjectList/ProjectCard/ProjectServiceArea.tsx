import React from 'react'
import styles from './ProjectCard.module.scss'

interface IProjectServiceAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  serviceArea: string[]
}

export const ProjectServiceArea: React.FunctionComponent<IProjectServiceAreaProps> = ({
  serviceArea,
  hidden
}) =>
  serviceArea && (
    <div hidden={hidden}>
      {serviceArea.map((text, idx) => (
        <div
          key={idx}
          className={styles.tag}
          style={{ backgroundColor: '#EAA30080', color: 'black' }}>
          <span>{text}</span>
        </div>
      ))}
    </div>
  )
