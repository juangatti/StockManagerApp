import { Clock, User } from "lucide-react";

export default function WorkScheduleWidget({ schedules }) {
  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-xl border-l-4 border-emerald-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Clock className="h-8 w-8 text-emerald-400 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-white">Turnos de Hoy</h2>
            <p className="text-xs text-slate-400">Personal activo</p>
          </div>
        </div>
        <span className="text-3xl font-bold text-white bg-emerald-900/50 px-4 py-2 rounded-lg">
          {schedules.length}
        </span>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {schedules.length > 0 ? (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-slate-700/50 p-3 rounded border border-slate-700 flex justify-between items-center text-sm"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-300" />
                  <span className="text-slate-200 font-medium">
                    {schedule.display_name || schedule.full_name}
                  </span>
                </div>
                {schedule.notes && (
                  <span className="text-xs text-slate-500 italic ml-6">
                    "{schedule.notes}"
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="font-mono text-emerald-200 font-bold block">
                  {schedule.start_time.slice(0, 5)} -{" "}
                  {schedule.end_time.slice(0, 5)}
                </span>
                <span className="text-[10px] text-slate-500 uppercase">
                  {schedule.role_name}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500 text-sm text-center py-4">
            Sin personal asignado hoy.
          </p>
        )}
      </div>
    </div>
  );
}
