import Heading from '@theme/Heading';
import { Card, CardHeader, CardTitle, CardContent } from '@site/src/components/ui/card';
import { cn } from '@site/src/lib/utils';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

/* Consistent, calm stroke icons (sized + colored by the badge wrapper). */
const iconBase = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
};

function SupportIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg {...iconBase} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="m4.9 4.9 4 4M15.1 15.1l4 4M19.1 4.9l-4 4M8.9 15.1l-4 4" />
    </svg>
  );
}

function AboutIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg {...iconBase} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6" />
    </svg>
  );
}

function ContactIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg {...iconBase} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.5 7 7.3 5.2a2 2 0 0 0 2.4 0L20.5 7" />
    </svg>
  );
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Support',
    Svg: SupportIcon,
    description: <>Notes, guides, and small tools to help you get unstuck.</>,
  },
  {
    title: 'About',
    Svg: AboutIcon,
    description: <>A little about me and what this corner of the web is for.</>,
  },
  {
    title: 'Contact',
    Svg: ContactIcon,
    description: <>Say hi — I&apos;m always happy to connect and chat.</>,
  },
];

function Feature({ title, Svg, description, index }: FeatureItem & { index: number }) {
  return (
    <Card
      className={cn(
        'group h-full border-border/60 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        'animate-in fade-in slide-in-from-bottom-4 fill-mode-both',
      )}
      style={{ animationDuration: '700ms', animationDelay: `${index * 120}ms` }}>
      <CardHeader className="items-center text-center pb-2">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-sm transition-transform duration-300 group-hover:scale-105">
          <Svg className="h-8 w-8" role="img" aria-label={title} />
        </div>
        <CardTitle>
          <Heading as="h3" className="mb-0">{title}</Heading>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center text-muted-foreground">
        <p className="leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className="py-20 md:py-24 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} index={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
