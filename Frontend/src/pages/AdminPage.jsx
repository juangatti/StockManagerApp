import AdminTabs from "../components/molecules/AdminTabs";

export default function AdminPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">
        Administración del Catálogo
      </h2>
      <AdminTabs />
    </div>
  );
}
