import Heading from '@theme/Heading';
import { Card, CardHeader, CardTitle, CardContent } from '@site/src/components/ui/card';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Support',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        N/A
      </>
    ),
  },
  {
    title: 'About',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        N/A
      </>
    ),
  },
  {
    title: 'Contact',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        N/A
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <Card className="h-full bg-card hover:shadow-md transition-shadow">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <Svg className="h-32 w-32 text-primary" role="img" />
        </div>
        <CardTitle>
          <Heading as="h3" className="mb-0">{title}</Heading>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center text-muted-foreground">
        <p>{description}</p>
      </CardContent>
    </Card>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
