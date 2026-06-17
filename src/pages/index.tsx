import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import { buttonVariants } from '@site/src/components/ui/button';
import { cn } from '@site/src/lib/utils';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className="relative overflow-hidden py-28 md:py-36 text-center">
      {/* Airy cloud / sky backdrop — soft vertical wash + diffuse glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/60 via-background to-background" />
        <div className="absolute left-1/2 top-[-12%] h-[60%] w-[85%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.20),transparent)] blur-2xl" />
        <div className="absolute right-[12%] top-[18%] h-44 w-44 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.14),transparent)] blur-2xl" />
        <div className="absolute left-[8%] top-[42%] h-52 w-52 rounded-full bg-[radial-gradient(closest-side,hsl(var(--accent-foreground)/0.07),transparent)] blur-3xl" />
      </div>

      <div className="container mx-auto px-4 max-w-4xl">
        <span className="mb-8 inline-flex animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-700 items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Blog, docs &amp; dev tools
        </span>
        <Heading
          as="h1"
          className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-100 duration-700 text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
          {siteConfig.title}
        </Heading>
        <p className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-200 duration-700 mx-auto max-w-2xl text-xl md:text-2xl leading-relaxed text-muted-foreground mb-10">
          {siteConfig.tagline}
        </p>
        <div className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both delay-300 duration-700 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'no-underline shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg')}
            to="/blog">
            Read the Blog
          </Link>
          <Link
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'no-underline bg-card/70 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md')}
            to="/docs/intro">
            View Docs
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main className="bg-background">
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
