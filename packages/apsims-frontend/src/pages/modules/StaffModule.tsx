import { useState } from "react";
import { Plus, Phone, Mail } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";

const StaffModule = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Teaching Staff</h1>
                    <p className="text-slate-500">Manage teachers, departments, and roles</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Teacher
                </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i} className="flex flex-col items-center p-6 text-center">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                            {['JD', 'AM', 'ZK', 'PN', 'EK'][i - 1]}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Teacher Name {i}</h3>
                        <p className="text-sm text-slate-500">Mathematics & Physics</p>
                        <div className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            Full-Time
                        </div>

                        <div className="mt-6 flex w-full justify-center gap-4 border-t border-slate-100 pt-6">
                            <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600">
                                <Phone className="h-4 w-4" /> Call
                            </button>
                            <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600">
                                <Mail className="h-4 w-4" /> Email
                            </button>
                        </div>

                        <Button variant="outline" size="sm" className="mt-4 w-full">View Profile</Button>
                    </Card>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Teacher"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={() => setIsModalOpen(false)}>Add Teacher</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="First Name" placeholder="e.g. John" />
                        <Input label="Last Name" placeholder="e.g. Doe" />
                    </div>
                    <Input label="Email Address" type="email" placeholder="john.doe@school.com" />
                    <Input label="Phone Number" placeholder="+254 7..." />
                    <Input label="TSC Number" placeholder="TSC/..." />
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-900">Departments</label>
                        <select className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                            <option>Mathematics</option>
                            <option>Sciences</option>
                            <option>Humanities</option>
                            <option>Languages</option>
                            <option>Technicals</option>
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default StaffModule;
