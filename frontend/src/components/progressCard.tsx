export default function ProgressBar({ value }: { value: number }) {
  const level = value < 50 ? "low" : value < 75 ? "mid" : "high";
  return (
    <div className="progress">
      <div className={`progress-fill ${level}`} style={{ width: `${value}%` }} />
    </div>
  );
}