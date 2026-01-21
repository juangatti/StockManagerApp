import AdminTabs from "../components/molecules/AdminTabs";

export default function AdminPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-[var(--color-text-primary)] font-display uppercase tracking-wide mb-6">
        Administración del Catálogo
      </h2>
      <AdminTabs />
    </div>
  );
}
