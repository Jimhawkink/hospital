import { useState } from "react";
import { Plus, Search, Filter, CreditCard, Banknote, History, Wallet } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const FeeStructure = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">Fee Structures</h3>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Set New Fee</Button>
        </div>
        <Card className="overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500">
                    <tr>
                        <th className="p-3">Year</th>
                        <th className="p-3">Term</th>
                        <th className="p-3">Class</th>
                        <th className="p-3">Amount (KES)</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {[1, 2, 3].map(i => (
                        <tr key={i} className="hover:bg-slate-50">
                            <td className="p-3">2024</td>
                            <td className="p-3">Term {i}</td>
                            <td className="p-3">Form {i}</td>
                            <td className="p-3 font-medium">15,000</td>
                            <td className="p-3 text-slate-500">Tuition & Boarding</td>
                            <td className="p-3 text-blue-600 cursor-pointer">Edit</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    </div>
);

const ReceivePayment = () => (
    <div className="space-y-6">
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Receive Payment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Search Student</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Enter ADM No or Name" className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div>
                    {/* Student Details Placeholder */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mt-6 md:mt-0">
                        <p className="font-semibold text-blue-900">Student Name: John Doe</p>
                        <p className="text-sm text-blue-700">ADM: 12345 | Form 2 East</p>
                        <p className="text-sm text-blue-700">Current Balance: <span className="font-bold text-red-600">KES 5,400</span></p>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Amount (KES)" type="number" placeholder="0.00" />
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                    <select className="w-full p-2 border rounded-lg bg-white">
                        <option>Cash</option>
                        <option>Bank Deposit</option>
                        <option>M-Pesa</option>
                        <option>Cheque</option>
                    </select>
                </div>
                <Input label="Transaction Ref / Receipt No." placeholder="e.g. QWE123456" />
            </div>

            <div className="mt-6 flex justify-end">
                <Button size="lg"><CheckCircle className="w-4 h-4 mr-2" /> Process Payment</Button>
            </div>
        </Card>
    </div>
);

import { CheckCircle } from "lucide-react";

const FeeBalances = () => (
    <div className="space-y-4">
        <div className="flex gap-4 mb-4">
            <Input placeholder="Search student..." className="w-64" />
            <select className="p-2 border rounded-lg bg-white text-sm">
                <option>All Classes</option>
                <option>Form 1</option>
                <option>Form 2</option>
            </select>
            <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
        </div>

        <Card className="overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 font-medium">
                    <tr>
                        <th className="p-3">Student</th>
                        <th className="p-3">Class</th>
                        <th className="p-3">Total Billed</th>
                        <th className="p-3">Total Paid</th>
                        <th className="p-3">Balance</th>
                        <th className="p-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {[1, 2, 3, 4, 5].map(i => {
                        const billed = 45000;
                        const paid = i * 8000;
                        const balance = billed - paid;
                        return (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="p-3">
                                    <p className="font-medium text-slate-900">Student {i}</p>
                                    <p className="text-xs text-slate-500">ADM-{3400 + i}</p>
                                </td>
                                <td className="p-3">Form {i % 4 + 1}</td>
                                <td className="p-3 font-medium">45,000</td>
                                <td className="p-3 text-green-600 font-medium">{paid.toLocaleString()}</td>
                                <td className="p-3 font-bold text-red-600">{balance.toLocaleString()}</td>
                                <td className="p-3">
                                    {balance <= 0 ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Cleared</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Arrears</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </Card>
    </div>
);

const FeesModule = () => {
    const [activeTab, setActiveTab] = useState<'structure' | 'payment' | 'balances'>('payment');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Fees Management</h1>
                    <p className="text-slate-500">Track payments, balances, and fee structures</p>
                </div>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('payment')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'payment' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" /> Receive Payment
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('balances')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'balances' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <div className="flex items-center gap-2">
                        <History className="w-4 h-4" /> Balances
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('structure')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'structure' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" /> Fee Structure
                    </div>
                </button>
            </div>

            <div className="mt-6">
                {activeTab === 'structure' && <FeeStructure />}
                {activeTab === 'payment' && <ReceivePayment />}
                {activeTab === 'balances' && <FeeBalances />}
            </div>
        </div>
    );
};

export default FeesModule;
