import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'EmailEngine - Self-Hosted Email API',
  tagline: 'Unified REST API for IMAP, SMTP, Gmail & Microsoft 365',
  favicon: 'img/favicon.ico',

  // Plausible Analytics
  scripts: [
    {
      src: 'https://plausible.emailengine.dev/js/script.js',
      defer: true,
      // use aggregated domain
      'data-domain': 'emailengine.app',
    },
  ],

  // Site verification and SEO meta tags
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'algolia-site-verification',
        content: '0846214CC3D8705B',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:type',
        content: 'website',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:site_name',
        content: 'EmailEngine Documentation',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:site',
        content: '@emailengine',
      },
    },
  ],

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://learn.emailengine.app',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'postalsys',
  projectName: 'learn.emailengine.app',
  trailingSlash: false,
  deploymentBranch: 'gh-pages',

  onBrokenLinks: 'warn',

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
      onBrokenMarkdownImages: 'warn',
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Remove edit URL for now
          editUrl: undefined,
          docItemComponent: "@theme/ApiItem", // Derived from docusaurus-theme-openapi-docs
        },
        blog: {
          showReadingTime: true,
          blogTitle: 'EmailEngine Blog',
          blogDescription: 'Technical guides, tutorials, and updates about email API integration',
          postsPerPage: 10,
          blogSidebarTitle: 'Recent Posts',
          blogSidebarCount: 5,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: "api",
        docsPluginId: "classic",
        config: {
          emailengine: {
            specPath: "sources/swagger.json",
            outputDir: "docs/api",
            sidebarOptions: {
              groupPathsBy: "tag",
              sidebarCollapsed: true,
              sidebarCollapsible: true,
            },
            hideSendButton: true, // Disable "Send API Request" button
            version: "2.57.0",
            label: "v2.57.0",
            baseUrl: "/docs/api",
            versions: {},
          } satisfies any,
        } satisfies any,
      },
    ],
    [
      'docusaurus-biel',
      {
        project: 'ctd51bpdtp',
        headerTitle: 'EmailEngine Assistant',
        buttonPosition: 'bottom-right',
        modalPosition: 'sidebar-right',
        buttonStyle: 'dark',
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            from: '/docs/receiving/webhooks',
            to: '/docs/webhooks/overview',
          },
          {
            from: '/docs/advanced/delivery-testing',
            to: '/docs/advanced/inbox-placement-testing',
          },
          {
            from: '/docs/sending/smtp-gateway',
            to: '/docs/sending/smtp-interface',
          },
        ],
      },
    ],
  ],

  themes: [
    "docusaurus-theme-openapi-docs",
    "@docusaurus/theme-mermaid",
  ],

  themeConfig: {
    // Social card for sharing
    image: 'img/logo.png',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'EmailEngine',
      logo: {
        alt: 'EmailEngine Logo',
        src: 'img/logo.png',
        href: 'https://emailengine.app',
        target: '_self',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API Reference',
        },
        {
          href: 'https://github.com/postalsys/emailengine',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://postalsys.com/plans',
          label: 'Get License',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started/introduction',
            },
            {
              label: 'Installation',
              to: '/docs/installation',
            },
            {
              label: 'API Reference',
              to: '/docs/api-reference',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Support',
              to: '/docs/support',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/postalsys/emailengine',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'EmailEngine Website',
              href: 'https://emailengine.app',
            },
            {
              label: 'Get a License',
              href: 'https://postalsys.com/plans',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Postal Systems OÜ. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: [
        'bash',
        'json',
        'javascript',
        'typescript',
        'yaml',
        'toml',
        'ini',
        'nginx',
        'docker',
        'powershell',
        'python',
        'php',
        'diff',
      ],
    },
    algolia: {
      appId: 'HL9UU5VXN0',
      apiKey: 'c142e0ee535a50968d526dff722ed6d5',
      indexName: 'EmailEngine Documentation',
      contextualSearch: true,
      searchPagePath: 'search',
      insights: false,
      // askAi disabled due to marked v16 bug in @docsearch/react@4.4.0
      // askAi: 'TurOtO4ccG7p',
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
