import PrebatchesResume from "../components/organisms/PrebatchesResume";
import PrebatchesTable from "../components/organisms/PrebatchesTable";

export default function PrebatchsPage() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">
        Gestion de Prebatches
      </h2>
      <PrebatchesResume />
      <PrebatchesTable />
    </div>
  );
}
