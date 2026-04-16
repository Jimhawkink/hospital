import React from "react";
import { Calendar, Plus, Clock } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

const TimetableModule = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Timetable</h1>
                    <p className="text-slate-500">Manage class schedules and teacher allocations</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create Timetable
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-6">
                    <h3 className="mb-4 font-bold text-slate-900">Active Timetables</h3>
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 p-4 hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Form {i} Stream A</p>
                                        <p className="text-xs text-slate-500">Updated 2 days ago</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">View</Button>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="mb-4 font-bold text-slate-900">Today's Overview</h3>
                    <div className="space-y-4">
                        {/* Placeholder for today's schedule preview */}
                        <p className="text-sm text-slate-500">Select a class to view detailed timetable.</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TimetableModule;
