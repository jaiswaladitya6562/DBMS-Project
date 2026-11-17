export default function VehicleCard({ vehicle, onDelete }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-lg font-semibold">{vehicle.Vehicle_Number}</div>
          <div className="text-sm text-slate-400">
            {vehicle.Vehicle_Type}
            {vehicle.Model ? ` · ${vehicle.Model}` : ""}
          </div>
        </div>
        <span className="text-xs text-slate-500">#{vehicle.Vehicle_ID}</span>
      </div>
      <div className="mt-3 text-sm text-slate-300">
        {vehicle.Owner_Name} <span className="text-slate-500">· {vehicle.Phone}</span>
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(vehicle)}
          className="mt-3 text-xs text-rose-400 hover:text-rose-300"
        >
          Delete
        </button>
      )}
    </div>
  );
}
