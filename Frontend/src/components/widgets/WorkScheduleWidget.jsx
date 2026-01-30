import { useState } from "react";
import {
  Clock,
  User,
  ChevronRight,
  ChevronLeft,
  Utensils,
  Beer,
} from "lucide-react";

export default function WorkScheduleWidget({ schedules: data }) {
  const { schedules = [], barConfig = null } = data || {};
  const [face, setFace] = useState("personal"); // 'personal' or 'service'

  const toggleFace = () => {
    setFace(face === "personal" ? "service" : "personal");
  };

  return (
    <div className="bg-surface rounded-lg shadow-(--shadow-card) border border-gray-200 overflow-hidden min-h-[400px] flex flex-col">
      {/* Header with Switcher */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${face === "personal" ? "bg-emerald-100" : "bg-primary-light/20"}`}
          >
            {face === "personal" ? (
              <User className="h-6 w-6 text-emerald-600" />
            ) : (
              <Clock className="h-6 w-6 text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary font-display uppercase tracking-tight">
              {face === "personal" ? "Personal de Hoy" : "Horarios del Bar"}
            </h2>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
              {face === "personal"
                ? "Turnos asignados"
                : "Operaciones de servicio"}
            </p>
          </div>
        </div>

        <button
          onClick={toggleFace}
          className="flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-primary transition-colors bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm"
        >
          {face === "personal" ? (
            <>
              Ver Servicio <ChevronRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" /> Ver Personal
            </>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-hidden">
        {face === "personal" ? (
          <div className="space-y-3 h-full overflow-y-auto pr-2 custom-scrollbar max-h-[280px]">
            {schedules.length > 0 ? (
              schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center group transition-all hover:border-emerald-200 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border border-gray-200">
                      {schedule.full_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <span className="text-text-primary font-bold block leading-tight">
                        {schedule.full_name}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                        {schedule.role_name || "Staff"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-text-primary font-bold block text-lg">
                      {schedule.start_time.slice(0, 5)} -{" "}
                      {schedule.end_time.slice(0, 5)}
                    </span>
                    {schedule.notes && (
                      <span className="text-[10px] text-text-muted italic block truncate max-w-[120px]">
                        {schedule.notes}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                  <User className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-text-muted text-sm font-medium italic">
                  Sin personal asignado para hoy.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col justify-center h-full space-y-4">
            {barConfig ? (
              <>
                {/* APERTURA */}
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 flex items-center gap-4 transition-all hover:bg-emerald-50">
                  <div className="bg-emerald-500 p-3 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block">
                      Apertura
                    </span>
                    <span className="text-2xl font-bold text-text-primary font-mono">
                      {barConfig.opening_time.slice(0, 5)} hs
                    </span>
                  </div>
                </div>

                {/* CIERRE COCINA */}
                <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 flex items-center gap-4 transition-all hover:bg-amber-50">
                  <div className="bg-amber-500 p-3 rounded-xl text-white shadow-lg shadow-amber-500/20">
                    <Utensils className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block">
                      Cierre Cocina
                    </span>
                    <span className="text-2xl font-bold text-text-primary font-mono">
                      {barConfig.kitchen_close_time.slice(0, 5)} hs
                    </span>
                  </div>
                </div>

                {/* CIERRE BAR */}
                <div className="bg-primary-light/10 p-5 rounded-2xl border border-primary-light/20 flex items-center gap-4 transition-all hover:bg-primary-light/5">
                  <div className="bg-primary p-3 rounded-xl text-white shadow-lg shadow-primary/20">
                    <Beer className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest block">
                      Último Trago
                    </span>
                    <span className="text-2xl font-bold text-text-primary font-mono">
                      {barConfig.bar_close_time.slice(0, 5)} hs
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                  <Clock className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-text-muted text-sm font-medium italic">
                  Horarios de servicio no configurados.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Stat */}
      {face === "personal" && schedules.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
            Total Staff en Turno: {schedules.length}
          </span>
        </div>
      )}
    </div>
  );
}
