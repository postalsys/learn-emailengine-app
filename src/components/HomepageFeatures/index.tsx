import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Unified REST API',
    description: (
      <>
        Access all email accounts through a single, consistent REST API regardless
        of the underlying protocol - IMAP, Gmail API, or Microsoft Graph API.
      </>
    ),
  },
  {
    title: 'Real-time Webhooks',
    description: (
      <>
        Receive instant notifications about new emails, email updates, and account
        changes through webhooks. Build reactive email applications with ease.
      </>
    ),
  },
  {
    title: 'Self-hosted & Secure',
    description: (
      <>
        Run EmailEngine on your own infrastructure for complete control over your
        email data. Built-in OAuth2 support for secure authentication.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
