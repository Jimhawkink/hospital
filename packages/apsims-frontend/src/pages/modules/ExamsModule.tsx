import { useState } from "react";
import { Plus, FileText, Settings, BarChart } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

// --- Tab Components ---

const ExamConfiguration = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">Exam Types & Grading</h3>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Exam Type</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
                <h4 className="font-medium mb-4 text-slate-700">Exam Types</h4>
                <table className="w-full text-sm text-left">
                    <thead className="text-slate-500 bg-slate-50">
                        <tr>
                            <th className="p-2">Name</th>
                            <th className="p-2">Weight</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {['CAT 1', 'CAT 2', 'Mid Term', 'End Term'].map((type) => (
                            <tr key={type}>
                                <td className="p-2">{type}</td>
                                <td className="p-2">15%</td>
                                <td className="p-2 text-blue-600 cursor-pointer">Edit</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
            <Card className="p-4">
                <h4 className="font-medium mb-4 text-slate-700">Grading System</h4>
                <table className="w-full text-sm text-left">
                    <thead className="text-slate-500 bg-slate-50">
                        <tr>
                            <th className="p-2">Grade</th>
                            <th className="p-2">Range</th>
                            <th className="p-2">Points</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {[
                            { g: 'A', r: '80 - 100', p: 12 },
                            { g: 'A-', r: '75 - 79', p: 11 },
                            { g: 'B+', r: '70 - 74', p: 10 },
                        ].map((item) => (
                            <tr key={item.g}>
                                <td className="p-2 font-bold">{item.g}</td>
                                <td className="p-2">{item.r}</td>
                                <td className="p-2">{item.p}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    </div>
);

const MarksEntry = () => (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex-1">
                <label className="text-xs font-medium text-slate-500">Term</label>
                <select className="w-full mt-1 p-2 border rounded-lg bg-white text-sm">
                    <option>Term 1 2024</option>
                    <option>Term 2 2024</option>
                </select>
            </div>
            <div className="flex-1">
                <label className="text-xs font-medium text-slate-500">Class</label>
                <select className="w-full mt-1 p-2 border rounded-lg bg-white text-sm">
                    <option>Form 1 East</option>
                    <option>Form 4 West</option>
                </select>
            </div>
            <div className="flex-1">
                <label className="text-xs font-medium text-slate-500">Subject</label>
                <select className="w-full mt-1 p-2 border rounded-lg bg-white text-sm">
                    <option>Mathematics</option>
                    <option>English</option>
                </select>
            </div>
            <div className="flex-1">
                <label className="text-xs font-medium text-slate-500">Exam Type</label>
                <select className="w-full mt-1 p-2 border rounded-lg bg-white text-sm">
                    <option>CAT 1</option>
                    <option>End Term</option>
                </select>
            </div>
            <div className="flex items-end">
                <Button>Load List</Button>
            </div>
        </div>

        <Card className="overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 font-medium">
                    <tr>
                        <th className="p-3 border-b">ADM No</th>
                        <th className="p-3 border-b">Student Name</th>
                        <th className="p-3 border-b">Score (Out of 100)</th>
                        <th className="p-3 border-b">Grade</th>
                        <th className="p-3 border-b">Remarks</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {[1, 2, 3, 4, 5].map(i => (
                        <tr key={i} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-slate-500">ADM-{200 + i}</td>
                            <td className="p-3 font-medium text-slate-800">Student {i}</td>
                            <td className="p-3">
                                <input type="number" className="w-20 p-1 border rounded text-center" placeholder="-" />
                            </td>
                            <td className="p-3 font-bold text-slate-400">-</td>
                            <td className="p-3 text-slate-400 italic">Auto-generated</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="p-4 bg-slate-50 border-t flex justify-end">
                <Button>Save Marks</Button>
            </div>
        </Card>
    </div>
);

const ReportsAnalysis = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-4 bg-blue-50 border-blue-100">
                <h4 className="text-blue-600 font-medium mb-1">Top Student</h4>
                <p className="text-2xl font-bold text-slate-900">Jane Doe</p>
                <p className="text-sm text-slate-500">Mean Score: 87.5 (A)</p>
            </Card>
            <Card className="p-4 bg-green-50 border-green-100">
                <h4 className="text-green-600 font-medium mb-1">Class Mean</h4>
                <p className="text-2xl font-bold text-slate-900">72.4</p>
                <p className="text-sm text-slate-500">Grade: B+</p>
            </Card>
            <Card className="p-4 bg-purple-50 border-purple-100">
                <h4 className="text-purple-600 font-medium mb-1">Pass Rate</h4>
                <p className="text-2xl font-bold text-slate-900">98%</p>
                <p className="text-sm text-slate-500">+2% from last term</p>
            </Card>
        </div>

        <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Class Broadsheet / Merit List</h3>
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600">
                    <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Student</th>
                        <th className="p-3">Math</th>
                        <th className="p-3">Eng</th>
                        <th className="p-3">Kisw</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Avg</th>
                        <th className="p-3">Grade</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {[1, 2, 3].map(i => (
                        <tr key={i}>
                            <td className="p-3 font-bold">#{i}</td>
                            <td className="p-3">Student Name {i}</td>
                            <td className="p-3">80</td>
                            <td className="p-3">75</td>
                            <td className="p-3">82</td>
                            <td className="p-3 font-medium">237</td>
                            <td className="p-3 font-bold">79.0</td>
                            <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">A-</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    </div>
);


const ExamsModule = () => {
    const [activeTab, setActiveTab] = useState<'config' | 'marks' | 'reports'>('marks');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Exams & Results</h1>
                    <p className="text-slate-500">Manage exams, grading, and student performance</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('config')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'config' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Configuration
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('marks')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'marks' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Marks Entry
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'reports' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <div className="flex items-center gap-2">
                        <BarChart className="w-4 h-4" /> Reports & Analysis
                    </div>
                </button>
            </div>

            {/* Content Area */}
            <div className="mt-6">
                {activeTab === 'config' && <ExamConfiguration />}
                {activeTab === 'marks' && <MarksEntry />}
                {activeTab === 'reports' && <ReportsAnalysis />}
            </div>
        </div>
    );
};

export default ExamsModule;
