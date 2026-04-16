import { useState } from "react";
import { Plus, Search, Users, Shield, UserCog } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";

const SubordinateStaffModule = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const staffRoles = [
        { role: "Cook", icon: UserCog, color: "text-orange-600", bg: "bg-orange-100" },
        { role: "Security", icon: Shield, color: "text-blue-600", bg: "bg-blue-100" },
        { role: "Groundsman", icon: Users, color: "text-green-600", bg: "bg-green-100" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Subordinate Staff</h1>
                    <p className="text-slate-500">Manage support staff (Cooks, Security, Groundsmen)</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Staff
                </Button>
            </div>

            {/* Stats / Categories */}
            <div className="grid gap-4 sm:grid-cols-3">
                {staffRoles.map((item) => (
                    <Card key={item.role} className="flex items-center gap-4 p-4">
                        <div className={`rounded-lg p-3 ${item.bg} ${item.color}`}>
                            <item.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{item.role}s</p>
                            <h3 className="text-xl font-bold text-slate-900">12</h3>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-4">
                    <h3 className="font-semibold text-slate-900">Staff List</h3>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            className="h-9 w-full rounded-lg border border-slate-200 pl-10 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Name</th>
                                <th className="px-6 py-3 font-medium">Role</th>
                                <th className="px-6 py-3 font-medium">Phone</th>
                                <th className="px-6 py-3 font-medium">Date Hired</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">Staff Member {i}</td>
                                    <td className="px-6 py-4">
                                        {i % 3 === 0 ? "Security" : i % 2 === 0 ? "Cook" : "Groundsman"}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">0712 345 67{i}</td>
                                    <td className="px-6 py-4 text-slate-500">Jan 12, 2023</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add Subordinate Staff"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => setIsModalOpen(false)}>Add Staff</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="First Name" />
                        <Input label="Last Name" />
                    </div>
                    <Input label="Phone Number" />
                    <Input label="ID Number" />
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-900">Role</label>
                        <select className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                            <option>Cook</option>
                            <option>Watchman / Security</option>
                            <option>Groundsman</option>
                            <option>Cleaner</option>
                            <option>Driver</option>
                            <option>Matron</option>
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SubordinateStaffModule;
