export default function Card({ children }) {
  return (
    <div className="bg-surface shadow-(--shadow-card) rounded-lg overflow-hidden border border-gray-200">
      {children}
    </div>
  );
}
