import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageWiki from '@site/src/components/HomepageWiki';

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Personal wiki — notes, tutorials, dev tools, and writing by Bao Hoang.">
      <main className="bg-background">
        <HomepageWiki />
      </main>
    </Layout>
  );
}
