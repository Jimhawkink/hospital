// src/pages/ExpenseHistoryPage.tsx
import React from "react";

export default function ExpenseHistoryPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Expense History</h1>

      {/* Table header */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* No data row */}
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                No expenses recorded yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
