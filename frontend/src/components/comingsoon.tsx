export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="panel" style={{ textAlign: "center" }}>
      <h2>{title}</h2>
      <p className="muted">This page is coming soon.</p>
    </div>
  );
}