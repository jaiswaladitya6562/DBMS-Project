function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-right">{value ?? "-"}</span>
    </div>
  );
}

export default function ReceiptCard({ receipt }) {
  const parked = !receipt.Exit_Time;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Receipt #{receipt.Receipt_ID}</h3>
        <span
          className={`rounded px-2 py-0.5 text-xs ${
            parked ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700 text-slate-300"
          }`}
        >
          {parked ? "Parked" : "Completed"}
        </span>
      </div>
      <div className="mt-3 divide-y divide-slate-800">
        <Row label="Vehicle" value={`${receipt.Vehicle_Number} (${receipt.Vehicle_Type})`} />
        <Row label="Owner" value={receipt.Owner_Name} />
        <Row label="Slot" value={`${receipt.Slot_Number} (${receipt.Slot_Type})`} />
        <Row label="Rate" value={`₹${receipt.Rate_Per_Hour} / hour`} />
        <Row label="Entry time" value={receipt.Entry_Time} />
        <Row label="Exit time" value={receipt.Exit_Time} />
        {receipt.Duration != null && <Row label="Duration" value={`${receipt.Duration} min`} />}
        {receipt.Amount != null && <Row label="Amount" value={`₹${receipt.Amount}`} />}
      </div>
    </div>
  );
}
