import React from "react";
import { BookOpen, Plus, Users } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

const RemedialModule = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Remedial Classes</h1>
                    <p className="text-slate-500">Manage extra classes and student enrollment</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Session
                </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Active</span>
                        </div>
                        <h3 className="font-bold text-slate-900">Mathematics Remedial</h3>
                        <p className="text-sm text-slate-500">Mr. Kamau • Form 4 Candidates</p>

                        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                            <Users className="h-4 w-4" />
                            <span>45 Students Enrolled</span>
                        </div>

                        <Button variant="outline" className="mt-4 w-full">Manage</Button>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default RemedialModule;
