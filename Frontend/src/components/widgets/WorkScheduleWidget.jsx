import { Clock, User } from "lucide-react";

export default function WorkScheduleWidget({ schedules }) {
  return (
    <div className="bg-surface p-6 rounded-lg shadow-(--shadow-card) border border-gray-200">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
        <div className="flex items-center">
          <Clock className="h-8 w-8 text-emerald-600 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-text-primary font-display uppercase">
              Turnos de Hoy
            </h2>
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
              Personal activo
            </p>
          </div>
        </div>
        <span className="text-3xl font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg font-mono">
          {schedules.length}
        </span>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {schedules.length > 0 ? (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center text-sm hover:bg-white hover:shadow-sm transition-all"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-500" />
                  <span className="text-text-primary font-bold">
                    {schedule.display_name || schedule.full_name}
                  </span>
                </div>
                {schedule.notes && (
                  <span className="text-text-secondary italic ml-6 border-l-2 border-gray-300 pl-2">
                    "{schedule.notes}"
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="font-mono text-emerald-700 font-bold block text-lg">
                  {schedule.start_time.slice(0, 5)} -{" "}
                  {schedule.end_time.slice(0, 5)}
                </span>
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">
                  {schedule.role_name}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-text-muted text-sm text-center py-8 italic bg-gray-50 rounded-lg">
            Sin personal asignado hoy.
          </p>
        )}
      </div>
    </div>
  );
}
