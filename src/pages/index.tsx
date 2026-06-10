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
    <header className="relative bg-background border-b py-24 text-center">
      <div className="container mx-auto px-4 max-w-4xl">
        <Heading as="h1" className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          {siteConfig.title}
        </Heading>
        <p className="text-xl md:text-2xl text-muted-foreground mb-10">
          {siteConfig.tagline}
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            className={cn(buttonVariants({ variant: 'default', size: 'lg' }), "no-underline")}
            to="/blog">
            Read the Blog
          </Link>
          <Link
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), "no-underline")}
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
