import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@site/src/components/ui/card';
import { cn } from '@site/src/lib/utils';

/* ---------------------------------------------------------------- icons -- */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

function BookIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5z" />
    </svg>
  );
}

function WrenchIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2l-5.6 5.6a1.5 1.5 0 0 0 2.1 2.1l5.6-5.6a4 4 0 0 0 5.2-5.4l-2.4 2.4-2.1-.6-.6-2.1z" />
    </svg>
  );
}

function FeedIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="5" cy="19" r="1.4" />
    </svg>
  );
}

function UserIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg {...stroke} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6" />
    </svg>
  );
}

function ArrowRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg {...stroke} {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function GitHubIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function LinkedInIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zm15.11 13.02h-3.56v-5.6c0-1.34-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.7H9.33V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z" />
    </svg>
  );
}

function FacebookIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/* ----------------------------------------------------------------- data -- */

type WikiLink = { label: string; to: string };

type Section = {
  title: string;
  blurb: string;
  Icon: React.ComponentType<React.ComponentProps<'svg'>>;
  to: string;
  cta: string;
  links: WikiLink[];
};

const SECTIONS: Section[] = [
  {
    title: 'Tutorials',
    blurb: 'Step-by-step guides and notes on setup, debugging, and tooling.',
    Icon: BookIcon,
    to: '/docs/intro',
    cta: 'Browse tutorials',
    links: [
      { label: 'Start here — Intro', to: '/docs/intro' },
      { label: 'Dev workspace setup', to: '/docs/workspace/team/series' },
      { label: 'Debug Node.js & PHP', to: '/docs/other/debug/nodejs' },
      { label: 'OpenVPN the easy way', to: '/docs/other/vpn/openvpn' },
    ],
  },
  {
    title: 'Tools',
    blurb: 'Small in-browser developer utilities — no install, no tracking.',
    Icon: WrenchIcon,
    to: '/tools/formatter/json',
    cta: 'Open tools',
    links: [
      { label: 'JSON formatter & validator', to: '/tools/formatter/json' },
      { label: 'Base64 encode / decode', to: '/tools/encode-decode/base64' },
      { label: 'UUID v4 generator', to: '/tools/generators/uuid' },
      { label: 'Schema config generator', to: '/tools/schema-config/general' },
    ],
  },
  {
    title: 'Blog',
    blurb: 'Longer-form writing — projects, ideas, and the occasional ramble.',
    Icon: FeedIcon,
    to: '/blog',
    cta: 'Read the blog',
    links: [
      { label: 'Welcome', to: '/blog/welcome' },
    ],
  },
  {
    title: 'About',
    blurb: 'A little about me — what I enjoy and what I am working toward.',
    Icon: UserIcon,
    to: '/about/hobbies',
    cta: 'More about me',
    links: [
      { label: 'Hobbies', to: '/about/hobbies' },
      { label: 'Wishlist', to: '/about/wishlist' },
      { label: 'Goals', to: '/about/goal' },
    ],
  },
];

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/baohoangstan', Icon: GitHubIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/baohoangstan', Icon: LinkedInIcon },
  { label: 'Facebook', href: 'https://www.facebook.com/xavang1993', Icon: FacebookIcon },
];

/* ------------------------------------------------------------- sections -- */

function IdentityBand() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className="relative overflow-hidden border-b border-border/50">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/55 via-background to-background" />
        <div className="absolute left-1/2 top-[-20%] h-[55%] w-[80%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.16),transparent)] blur-2xl" />
      </div>

      <div className="container mx-auto px-4 max-w-5xl py-16 md:py-20">
        <span className="mb-6 inline-flex animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-700 items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3.5 py-1 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Personal wiki
        </span>
        <Heading
          as="h1"
          className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-100 duration-700 text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          {siteConfig.title}
        </Heading>
        <p className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-200 duration-700 max-w-2xl text-lg md:text-xl leading-relaxed text-muted-foreground mb-8">
          {siteConfig.tagline}
        </p>
        <div className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-300 duration-700 flex items-center gap-3">
          {SOCIALS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/70 text-muted-foreground shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md">
              <Icon className="h-5 w-5" role="img" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}

function SectionCard({ section, index }: { section: Section; index: number }) {
  const { title, blurb, Icon, to, cta, links } = section;
  return (
    <Card
      className={cn(
        'group flex h-full flex-col border-border/60 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        'animate-in fade-in slide-in-from-bottom-4 fill-mode-both',
      )}
      style={{ animationDuration: '700ms', animationDelay: `${index * 110}ms` }}>
      <CardHeader className="pb-3">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm transition-transform duration-300 group-hover:scale-105">
          <Icon className="h-6 w-6" role="img" aria-label={title} />
        </div>
        <CardTitle>
          <Heading as="h3" className="mb-0 text-xl text-foreground">{title}</Heading>
        </CardTitle>
        <CardDescription className="leading-relaxed">{blurb}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <ul className="m-0 list-none space-y-1 p-0">
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground no-underline transition-colors hover:bg-accent/50 hover:text-foreground">
                <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to={to}
          className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-medium text-primary no-underline transition-all hover:gap-2.5">
          {cta}
          <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}

export default function HomepageWiki(): JSX.Element {
  return (
    <>
      <IdentityBand />
      <section className="bg-background py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700">
            <Heading as="h2" className="mb-2 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Browse the wiki
            </Heading>
            <p className="m-0 text-muted-foreground">
              Pick a starting point — everything on the site lives under one of these.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {SECTIONS.map((section, idx) => (
              <SectionCard key={section.title} section={section} index={idx} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
