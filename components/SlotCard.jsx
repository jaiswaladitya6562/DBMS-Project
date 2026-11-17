export default function SlotCard({ slot, selected, onSelect }) {
  const available = slot.Status === "Available";
  const tone = available
    ? selected
      ? "border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-400"
      : "border-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20"
    : slot.Status === "Reserved"
    ? "border-amber-700 bg-amber-500/10 opacity-70"
    : "border-rose-800 bg-rose-500/10 opacity-70";

  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => onSelect?.(slot)}
      className={`rounded-lg border p-3 text-left transition ${tone} ${available ? "cursor-pointer" : "cursor-not-allowed"}`}
    >
      <div className="text-lg font-semibold">{slot.Slot_Number}</div>
      <div className="text-xs text-slate-400">{slot.Slot_Type}</div>
      <div className="mt-1 text-xs">{slot.Status}</div>
    </button>
  );
}
