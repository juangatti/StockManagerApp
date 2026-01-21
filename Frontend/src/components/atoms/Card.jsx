export default function Card({ children }) {
  return (
    <div className="bg-[var(--color-surface)] shadow-[var(--shadow-card)] rounded-lg overflow-hidden border border-gray-200">
      {children}
    </div>
  );
}
