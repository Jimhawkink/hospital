import React, { useState } from "react";
import { Plus, TrendingUp, DollarSign, Calendar } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";

const IncomeModule = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Income Management</h1>
                    <p className="text-slate-500">Track other income sources (donations, rentals, etc.)</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Record Income
                </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-green-100 p-3 text-green-600">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Income (YTD)</p>
                            <h3 className="text-2xl font-bold text-slate-900">KES 1.2M</h3>
                        </div>
                    </div>
                </Card>
                {/* Add more stats as needed */}
            </div>

            <Card className="p-6">
                <h3 className="mb-4 font-bold text-slate-900">Recent Income Records</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-100 text-slate-500">
                            <tr>
                                <th className="pb-3 font-medium">Source</th>
                                <th className="pb-3 font-medium">Category</th>
                                <th className="pb-3 font-medium">Amount</th>
                                <th className="pb-3 font-medium">Date</th>
                                <th className="pb-3 font-medium">Recorded By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {[1, 2, 3].map((i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="py-3 font-medium text-slate-900">School Bus Rental</td>
                                    <td className="py-3 text-slate-500">Rentals</td>
                                    <td className="py-3 text-green-600 font-medium">+ KES 15,000</td>
                                    <td className="py-3 text-slate-500">Oct 24, 2024</td>
                                    <td className="py-3 text-slate-500">John Doe</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Record Income"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => setIsModalOpen(false)}>Save Record</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <Input label="Source / Payer" placeholder="e.g., Church Group" />
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-900">Category</label>
                        <select className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                            <option>Donations</option>
                            <option>Rentals</option>
                            <option>Farm Produce</option>
                            <option>Grants</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <Input label="Amount" type="number" />
                    <Input label="Description" placeholder="Details..." />
                </div>
            </Modal>
        </div>
    );
};

export default IncomeModule;
