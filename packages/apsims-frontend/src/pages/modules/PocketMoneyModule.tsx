import React from "react";
import { Wallet, Plus, ArrowRightLeft } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const PocketMoneyModule = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Student Pocket Money</h1>
                    <p className="text-slate-500">Manage student deposits and withdrawals</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Deposit Details
                    </Button>
                </div>
            </div>

            <Card className="p-6">
                <h3 className="mb-4 font-bold text-slate-900">Student Wallets</h3>
                <div className="mb-4">
                    <Input placeholder="Search student by name or admission number..." />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Student</th>
                                <th className="px-6 py-3 font-medium">Class</th>
                                <th className="px-6 py-3 font-medium">Current Balance</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">Student {i}</td>
                                    <td className="px-6 py-4 text-slate-500">Form 2 East</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">KES {i * 500 + 200}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Button size="sm" variant="outline">View History</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default PocketMoneyModule;
