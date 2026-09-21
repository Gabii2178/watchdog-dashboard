type PlaceholderPageProps = {
  title: string;
  description: string;
};

function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <>
      <div className="page-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-description">{description}</p>
        </div>
      </div>
      <section className="card shell-placeholder" aria-label={`${title} not implemented`}>
        <strong>This area is not available yet</strong>
        <p>The navigation destination is reserved for a future WatchDog release.</p>
      </section>
    </>
  );
}

export default PlaceholderPage;
