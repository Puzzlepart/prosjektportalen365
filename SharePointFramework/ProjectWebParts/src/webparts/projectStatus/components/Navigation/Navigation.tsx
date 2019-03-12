import * as React from 'react';
import styles from '../ProjectStatus.module.scss';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Link } from 'react-scroll';

const Navigation = ({ entityItem, sections }) => {
  return (
    <div className={styles.navigation}>
  {sections.map((section, key) => (
    <Link
    key={key}
    className={styles.navLink}
    activeClass='active'
    to={`section-${key}`}
    offset={-100}
    spy={true}
    duration={300}
    >
    <Icon iconName={section.iconName} />
    <span>{section.name}</span>
    </Link>
  ))}
    </div>
  );
};

export default Navigation;
