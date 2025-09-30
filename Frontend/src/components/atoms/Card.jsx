export default function Card({ children }) {
  return (
    <div className="bg-slate-800 shadow-xl rounded-lg overflow-hidden">
      {children}
    </div>
  );
}
