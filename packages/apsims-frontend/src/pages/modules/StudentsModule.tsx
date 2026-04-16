import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Download } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";

const StudentsModule = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Student Management</h1>
                    <p className="text-slate-500">Manage admissions, student records, and class lists</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export List
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Admit Student
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-4">
                    <div className="flex items-center gap-2">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or admission..."
                                className="h-9 w-full rounded-lg border border-slate-200 pl-10 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <Button variant="outline" size="sm">
                            <Filter className="mr-2 h-4 w-4" /> Filter
                        </Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Admission Info</th>
                                <th className="px-6 py-3 font-medium">Class / Stream</th>
                                <th className="px-6 py-3 font-medium">Parent Contact</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                                                {['JD', 'AS', 'MK', 'OL', 'PK'][i - 1]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">Student Name {i}</p>
                                                <p className="text-xs text-slate-500">ADM-{202400 + i}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        Form {i % 4 + 1} {i % 2 === 0 ? 'East' : 'West'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-slate-900">Parent Name</p>
                                        <p className="text-xs text-slate-500">0712 345 67{i}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-slate-400 hover:text-slate-600">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                        <p>Showing 5 of 1,250 students</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm">Next</Button>
                        </div>
                    </div>
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Admit New Student"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => setIsModalOpen(false)}>Admit Student</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <h4 className="font-medium text-slate-900 border-b border-slate-100 pb-2">Student Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="First Name" />
                        <Input label="Last Name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Date of Birth" type="date" />
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-900">Gender</label>
                            <select className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                                <option>Select Gender</option>
                                <option>Male</option>
                                <option>Female</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-900">Class</label>
                            <select className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                                <option>Form 1</option>
                                <option>Form 2</option>
                                <option>Form 3</option>
                                <option>Form 4</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-900">Stream</label>
                            <select className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                                <option>East</option>
                                <option>West</option>
                                <option>North</option>
                                <option>South</option>
                            </select>
                        </div>
                    </div>

                    <h4 className="font-medium text-slate-900 border-b border-slate-100 pb-2 mt-4">Parent / Guardian Details</h4>
                    <Input label="Parent Name" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Phone Number" />
                        <Input label="Email Address" type="email" />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default StudentsModule;
