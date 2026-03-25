export function Alert({
  type,
  text
}: {
  type: 'error' | 'ok';
  text?: string;
}) {
  if (!text) return null;

  return (
    <div className={`alert ${type === 'error' ? 'alertError' : 'alertOk'}`} role="status" aria-live="polite">
      {text}
    </div>
  );
}
