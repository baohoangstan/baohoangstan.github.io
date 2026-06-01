import BrowserOnly from '@docusaurus/BrowserOnly';
import toolRegistry from '@site/src/components/Tools';
import styles from '@site/src/components/Tools/styles.module.css';

type ToolProps = {
  id: string;
  clientOnly?: boolean;
};

export default function Tool({id, clientOnly = false}: ToolProps): JSX.Element {
  const tool = toolRegistry.find((item) => item.id === id);

  if (!tool) {
    return <p className={styles.errorMsg}>Unknown tool: {id}</p>;
  }

  const {Component} = tool;

  return (
    <div className={styles.toolCard}>
      <p className={styles.toolDescription}>{tool.description}</p>
      {clientOnly ? (
        <BrowserOnly fallback={<div>Loading…</div>}>
          {() => <Component />}
        </BrowserOnly>
      ) : (
        <Component />
      )}
    </div>
  );
}
