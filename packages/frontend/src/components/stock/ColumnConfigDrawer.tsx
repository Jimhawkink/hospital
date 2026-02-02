import React from "react";
import { X } from "lucide-react";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export default function ColumnConfigDrawer({ open, onOpenChange }: Props) {
  if (!open) return null;

  // This is a visual drawer to match the screenshot.
  // Wire it to your user preferences if you want to persist column choices.
  return (
    <div className="fixed inset-0 z-30">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md overflow-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="text-sm font-medium">Configure columns</div>
          <button className="rounded p-1 hover:bg-gray-100" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 text-sm">
          <div className="mb-3 text-gray-600">Toggle which columns appear in the table.</div>

          <ul className="space-y-2">
            {[
              "Name",
              "SKU",
              "Category",
              "Available units",
              "Expiry date",
              "Manufacturer",
              "Location",
            ].map((label) => (
              <li key={label} className="flex items-center justify-between rounded border px-3 py-2">
                <span>{label}</span>
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300" defaultChecked />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
