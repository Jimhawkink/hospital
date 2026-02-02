import React, { useEffect, useRef, useState } from "react";

type Props = {
  onEditDetails: () => void;
  onRestock: () => void;
  onScrap: () => void;
  onStockTake: () => void;
  onArchive: () => void;
  children: React.ReactNode; // the trigger button
};

export default function RowActionsMenu({
  onEditDetails,
  onRestock,
  onScrap,
  onStockTake,
  onArchive,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <div onClick={() => setOpen((v) => !v)}>{children}</div>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-44 origin-top-right rounded-md border border-gray-200 bg-white p-1 shadow-lg">
          <button className="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={onEditDetails}>
            Edit details
          </button>
          <button className="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={onRestock}>
            Restock
          </button>
          <button className="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={onScrap}>
            Scrap
          </button>
          <button className="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={onStockTake}>
            Stock take
          </button>
          <div className="my-1 h-px bg-gray-100" />
          <button className="w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50" onClick={onArchive}>
            Archive
          </button>
        </div>
      )}
    </div>
  );
}
