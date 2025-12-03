import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs">
            Get Started
          </Link>
          <Link
            className="button button--primary button--lg"
            to="/docs/api-reference"
            style={{marginLeft: '1rem'}}>
            API Reference
          </Link>
        </div>
      </div>
    </header>
  );
}

function IntroSection() {
  return (
    <section className={styles.intro}>
      <div className="container">
        <p className={styles.introText}>
          <strong>EmailEngine</strong> is a self-hosted email gateway that connects your application
          to any email account using a simple REST API. Instead of dealing with IMAP, SMTP, OAuth2,
          and provider-specific quirks, you make HTTP requests and receive webhooks.
          EmailEngine handles the complexity of maintaining persistent connections, syncing messages,
          and authenticating with Gmail, Outlook, or any IMAP server.
        </p>
      </div>
    </section>
  );
}

type UseCaseCategory = {
  title: string;
  items: {label: string; link: string; description: string}[];
};

const useCaseCategories: UseCaseCategory[] = [
  {
    title: 'Get Started',
    items: [
      {label: 'Install EmailEngine', link: '/docs/installation', description: 'Docker, npm, or binary'},
      {label: 'Quick Start Guide', link: '/docs/getting-started/quick-start', description: '10-minute setup'},
      {label: 'Introduction', link: '/docs/getting-started/introduction', description: 'Core concepts'},
    ],
  },
  {
    title: 'Connect Email Accounts',
    items: [
      {label: 'Connect Gmail', link: '/docs/accounts/gmail-imap', description: 'OAuth2 for Gmail'},
      {label: 'Connect Outlook', link: '/docs/accounts/outlook-365', description: 'Microsoft 365'},
      {label: 'Connect IMAP', link: '/docs/accounts/imap-smtp', description: 'Any email provider'},
      {label: 'Service Accounts', link: '/docs/accounts/google-service-accounts', description: 'Domain-wide access'},
    ],
  },
  {
    title: 'Send Emails',
    items: [
      {label: 'Send Emails', link: '/docs/sending/basic-sending', description: 'REST API basics'},
      {label: 'Mail Merge', link: '/docs/sending/mail-merge', description: 'Bulk personalized emails'},
      {label: 'Reply to Emails', link: '/docs/sending/threading', description: 'Conversation threading'},
      {label: 'Email Templates', link: '/docs/sending/templates', description: 'Reusable templates'},
    ],
  },
  {
    title: 'Receive Emails',
    items: [
      {label: 'Set Up Webhooks', link: '/docs/webhooks/overview', description: 'Real-time notifications'},
      {label: 'Search Messages', link: '/docs/receiving/searching', description: 'Find emails by criteria'},
      {label: 'Download Attachments', link: '/docs/receiving/attachments', description: 'Retrieve files'},
      {label: 'Handle Bounces', link: '/docs/advanced/bounces', description: 'Delivery failures'},
    ],
  },
  {
    title: 'Deploy to Production',
    items: [
      {label: 'Docker', link: '/docs/installation/docker', description: 'Container deployment'},
      {label: 'SystemD Service', link: '/docs/deployment/systemd', description: 'Linux service'},
      {label: 'Security', link: '/docs/deployment/security', description: 'Hardening guide'},
      {label: 'Performance', link: '/docs/advanced/performance-tuning', description: 'Optimization'},
    ],
  },
  {
    title: 'Build Integrations',
    items: [
      {label: 'PHP SDK', link: '/docs/integrations/php', description: 'Official PHP library'},
      {label: 'CRM Integration', link: '/docs/integrations/crm', description: 'Connect your CRM'},
      {label: 'AI / ChatGPT', link: '/docs/integrations/ai-chatgpt', description: 'AI-powered features'},
      {label: 'Low-Code', link: '/docs/integrations/low-code', description: 'n8n, Make, Zapier'},
    ],
  },
];

function UseCaseSection() {
  return (
    <section className={styles.useCases}>
      <div className="container">
        <Heading as="h2" className={styles.useCasesTitle}>
          What Would You Like to Do?
        </Heading>
        <div className={styles.useCasesGrid}>
          {useCaseCategories.map((category) => (
            <div key={category.title} className={styles.useCaseCategory}>
              <Heading as="h3" className={styles.categoryTitle}>
                {category.title}
              </Heading>
              <ul className={styles.useCaseList}>
                {category.items.map((item) => (
                  <li key={item.link} className={styles.useCaseItem}>
                    <Link to={item.link} className={styles.useCaseLink}>
                      <span className={styles.useCaseLabel}>{item.label}</span>
                      <span className={styles.useCaseDesc}>{item.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Self-hosted Email Gateway"
      description="Streamline email integration for your app or service with a unified REST API that seamlessly connects with IMAP, SMTP, Gmail API, and Microsoft Graph API">
      <HomepageHeader />
      <main>
        <IntroSection />
        <UseCaseSection />
      </main>
    </Layout>
  );
}
