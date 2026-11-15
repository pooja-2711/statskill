export default function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <div className="panel"><p className="muted">This page will be built next.</p></div>
    </div>
  );
}