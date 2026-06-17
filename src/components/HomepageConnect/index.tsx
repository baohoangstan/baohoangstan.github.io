import React from 'react';
import Heading from '@theme/Heading';
import { Card, CardHeader, CardTitle, CardContent } from '@site/src/components/ui/card';
import { cn } from '@site/src/lib/utils';

type ConnectItemType = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
  url: string;
  ariaLabel: string;
};

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

const ConnectList: ConnectItemType[] = [
  {
    title: 'GitHub',
    Svg: GitHubIcon,
    description: <>Open-source projects, repositories, and coding experiments.</>,
    url: 'https://github.com/baohoangstan',
    ariaLabel: 'GitHub profile of baohoangstan',
  },
  {
    title: 'LinkedIn',
    Svg: LinkedInIcon,
    description: <>Work experience, background, and the occasional professional update.</>,
    url: 'https://www.linkedin.com/in/baohoangstan',
    ariaLabel: 'LinkedIn profile of baohoangstan',
  },
  {
    title: 'Facebook',
    Svg: FacebookIcon,
    description: <>Personal posts, day-to-day thoughts, and life updates.</>,
    url: 'https://www.facebook.com/xavang1993',
    ariaLabel: 'Facebook profile of xavang1993',
  },
];

function ConnectItem({ title, Svg, description, url, ariaLabel, index }: ConnectItemType & { index: number }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="no-underline block group text-inherit"
    >
      <Card
        className={cn(
          'h-full border-border/60 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-card',
          'animate-in fade-in slide-in-from-bottom-4 fill-mode-both',
        )}
        style={{ animationDuration: '700ms', animationDelay: `${index * 120}ms` }}
      >
        <CardHeader className="items-center text-center pb-2">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-sm transition-transform duration-300 group-hover:scale-105">
            <Svg className="h-8 w-8" role="img" aria-hidden="true" />
          </div>
          <CardTitle>
            <Heading as="h3" className="mb-0 text-foreground transition-colors duration-300 group-hover:text-primary">
              {title}
            </Heading>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p className="leading-relaxed">{description}</p>
        </CardContent>
      </Card>
    </a>
  );
}

export default function HomepageConnect(): JSX.Element {
  return (
    <section className="py-20 md:py-24 bg-background border-t border-border/40">
      <div className="container mx-auto px-4 max-w-6xl">
        <div
          className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
          style={{ animationDuration: '700ms' }}
        >
          <Heading as="h2" className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Connect
          </Heading>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
            Find me around the web — say hi on any of these.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ConnectList.map((item, idx) => (
            <ConnectItem key={idx} index={idx} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
