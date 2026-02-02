// src/pages/InvestigationPage.tsx
import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  X,
  Search,
  Mail,
  MoreVertical,
  Info,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InvestigationRequest {
  id: number;
  test_id: number | null;
  department: string | null;
  type: "laboratory" | "imaging";
  status: "requested" | "not_collected" | "collected" | "results_posted";
  request_notes: string | null;
  results?: InvestigationResult[];
  test?: InvestigationTest;
  date_requested?: string;
  requested_by?: number | null;
  custom_name?: string;
}

interface ResultToSave {
  request_id: number;
  parameter: string;
  value: string;
  unit: string | null;
  reference_range: string | null;
  flag: string | null;
  notes: string | null;
  entered_by: number;
  date_entered: string;
}

interface InvestigationResult {
  id: number;
  parameter: string | null;
  value: string;
  unit: string | null;
  reference_range: string | null;
  flag: string | null;
}

interface InvestigationTest {
  id: number;
  name: string;
  department: string;
  type: "laboratory" | "imaging";
  parameters: string | null;
}

interface InvestigationPageProps {
  encounterId?: string;
  activeTab?: "Laboratory" | "Imaging";
  currentUserId?: number; // optional - we read from localStorage if not passed
}

const InvestigationPage: React.FC<InvestigationPageProps> = ({
  encounterId: propEncounterId,
  activeTab: propActiveTab,
  currentUserId: propCurrentUserId,
}) => {
  const encounterId = propEncounterId || "demo-encounter-123";
  const [activeTab, setActiveTab] = useState<"Laboratory" | "Imaging">(
    propActiveTab || "Laboratory"
  );
  const [requests, setRequests] = useState<InvestigationRequest[]>([]);
  const [tests, setTests] = useState<InvestigationTest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [otherRequest, setOtherRequest] = useState("");
  const [requestNotes, setRequestNotes] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [expandedResults, setExpandedResults] = useState<{ [key: number]: boolean }>({ 1: true });
  const [expandedTestItems, setExpandedTestItems] = useState<{ [key: string]: boolean }>({});
  const [resultInputs, setResultInputs] = useState<{ [key: string]: string }>({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // current user & token from localStorage
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("hms_user") || localStorage.getItem("user");
      const token = localStorage.getItem("hms_token") || localStorage.getItem("token");
      setAuthToken(token || null);
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        setCurrentUser(parsed);
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      console.warn("Failed to read logged-in user from localStorage", e);
      setCurrentUser(null);
    }
  }, []);

  // small helper to call API with auth header
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const token = authToken || localStorage.getItem("hms_token") || localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers ? (options.headers as Record<string, string>) : {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const resp = await fetch(url, { ...options, headers });
    return resp;
  };

  const mockTests: InvestigationTest[] = [
    {
      id: 1,
      name: "Haemogram",
      department: "Haematology",
      type: "laboratory",
      parameters:
        '[{"parameter": "Hemoglobin", "unit": "g/dl", "range": "12-16"}, {"parameter": "WBC Count", "unit": "/cmm", "range": "4000-11000"}, {"parameter": "Platelet Count", "unit": "/cmm", "range": "150000-450000"}]',
    },
    { id: 2, name: "ESR", department: "Haematology", type: "laboratory", parameters: '[{"parameter": "ESR", "unit": "mm/hr", "range": "0-20"}]' },
    { id: 3, name: "Factor V Leiden", department: "Haematology", type: "laboratory", parameters: '[{"parameter": "Factor V Leiden", "unit": "", "range": "Normal/Abnormal"}]' },
    {
      id: 4,
      name: "Lipid profile",
      department: "Biochemistry",
      type: "laboratory",
      parameters:
        '[{"parameter": "Total Cholesterol", "unit": "mg/dl", "range": "<200"}, {"parameter": "HDL", "unit": "mg/dl", "range": ">40"}, {"parameter": "LDL", "unit": "mg/dl", "range": "<100"}, {"parameter": "Triglycerides", "unit": "mg/dl", "range": "<150"}]',
    },
    { id: 5, name: "Malaria antigen", department: "Microbiology", type: "laboratory", parameters: '[{"parameter": "Malaria Antigen", "unit": "", "range": "Negative/Positive"}]' },
    { id: 6, name: "Syphilis VDRL", department: "Microbiology", type: "laboratory", parameters: '[{"parameter": "VDRL", "unit": "", "range": "Non-reactive/Reactive"}]' },
    { id: 7, name: "HIV test", department: "Microbiology", type: "laboratory", parameters: '[{"parameter": "HIV", "unit": "", "range": "Negative/Positive"}]' },
    { id: 8, name: "Urinalysis, dipstick", department: "Chemistry", type: "laboratory", parameters: '[{"parameter": "Protein", "unit": "", "range": "Negative"}, {"parameter": "Glucose", "unit": "", "range": "Negative"}, {"parameter": "Ketones", "unit": "", "range": "Negative"}]' },
    { id: 9, name: "Syphilis RPR", department: "Microbiology", type: "laboratory", parameters: '[{"parameter": "RPR", "unit": "", "range": "Non-reactive/Reactive"}]' },
    { id: 10, name: "Hpylori antibody", department: "Microbiology", type: "laboratory", parameters: '[{"parameter": "H. pylori IgG", "unit": "", "range": "Negative/Positive"}]' },
    { id: 11, name: "Conjunctival test", department: "Ophthalmology", type: "laboratory", parameters: '[{"parameter": "Conjunctival swab", "unit": "", "range": "Normal/Abnormal"}]' },
    { id: 12, name: "Chest Xray", department: "Radiology", type: "imaging", parameters: '[{"parameter": "Chest X-ray findings", "unit": "", "range": "Normal/Abnormal"}]' },
  ];

  useEffect(() => {
    setTests(mockTests);
  }, []);

  const filteredTests = tests.filter(
    (test) =>
      test.type === activeTab.toLowerCase() &&
      (test.name.toLowerCase().includes(searchQuery.toLowerCase()) || test.department.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!selectedDepartment || test.department === selectedDepartment)
  );

  const departments = [...new Set(tests.filter((t) => t.type === activeTab.toLowerCase()).map((t) => t.department))];

  const handleAddTest = (testName: string) => {
    if (!selectedTests.includes(testName)) {
      setSelectedTests([...selectedTests, testName]);
    }
    setShowDropdown(false);
    setSearchQuery("");
  };

  const handleRemoveTest = (testName: string) => {
    setSelectedTests(selectedTests.filter((t) => t !== testName));
  };

  const handleRequestInvestigations = async () => {
    if (selectedTests.length === 0 && !otherRequest) return;

    setIsSaving(true);
    try {
      const newRequests: InvestigationRequest[] = [];

      selectedTests.forEach((testName) => {
        const test = tests.find((t) => t.name === testName);
        if (test) {
          newRequests.push({
            id: Date.now() + Math.random(),
            test_id: test.id,
            department: test.department,
            type: test.type,
            status: "not_collected",
            request_notes: requestNotes,
            test: test,
            results: [],
            date_requested: new Date().toLocaleString(),
            requested_by: currentUser?.id ?? propCurrentUserId ?? 1,
          });
        }
      });

      if (otherRequest) {
        newRequests.push({
          id: Date.now() + Math.random(),
          test_id: null,
          department: null,
          type: activeTab.toLowerCase() as "laboratory" | "imaging",
          status: "not_collected",
          request_notes: requestNotes,
          custom_name: otherRequest,
          results: [],
          date_requested: new Date().toLocaleString(),
          requested_by: currentUser?.id ?? propCurrentUserId ?? 1,
        });
      }

      // Optionally persist immediately to backend
      try {
        // build payload that matches backend expectation (array of requests)
        const payload = newRequests.map((nr) => ({
          encounter_id: encounterId === "demo-encounter-123" ? 3 : parseInt(String(encounterId)),
          test_id: nr.test_id,
          test_name: nr.test_id ? undefined : nr.custom_name ?? nr.test?.name ?? null,
          department: nr.department,
          type: nr.type,
          status: nr.status,
          request_notes: nr.request_notes,
          requested_by: nr.requested_by,
          date_requested: new Date().toISOString(),
        }));

        const resp = await apiFetch("/api/investigation-requests", {
          method: "POST",
          body: JSON.stringify({ requests: payload }),
        });

        if (resp.ok) {
          const json = await resp.json();
          // merge created rows (use returned data if any)
          const created = Array.isArray(json.data) ? json.data : [];
          setRequests((prev) => [...prev, ...created]);
        } else {
          // fallback: keep locally
          setRequests((prev) => [...prev, ...newRequests]);
        }
      } catch (err) {
        console.warn("Failed to persist requests, keeping locally:", err);
        setRequests((prev) => [...prev, ...newRequests]);
      }

      setSaveMessage("Request added successfully");
      setShowSuccessToast(true);
      setSelectedTests([]);
      setOtherRequest("");
      setRequestNotes("");
      setTimeout(() => setShowSuccessToast(false), 3000);
      setIsSaving(false);
    } catch (error) {
      console.error("Failed to add request:", error);
      setIsSaving(false);
    }
  };

  const toggleResultExpansion = (requestId: number) => {
    setExpandedResults((prev) => ({
      ...prev,
      [requestId]: !prev[requestId],
    }));
  };

  const toggleTestItemExpansion = (key: string) => {
    setExpandedTestItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleResultInput = (key: string, value: string) => {
    setResultInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveResults = async (requestId: number) => {
    setIsSaving(true);
    let actualRequestId: number;

    try {
      const request = requests.find((r) => r.id === requestId);
      if (!request) {
        throw new Error("Request not found");
      }

      // If mock id -> persist request first
      if (requestId > 1000000000000 || String(requestId).includes(".")) {
        const requestPayload = {
          encounter_id: encounterId === "demo-encounter-123" ? 3 : parseInt(String(encounterId)),
          test_name: request.custom_name || (request.test ? request.test.name : null),
          department: request.department,
          type: request.type,
          status: "collected",
          request_notes: request.request_notes,
          requested_by: currentUser?.id ?? propCurrentUserId ?? 1,
          date_requested: new Date().toISOString(),
        };

        const requestResponse = await apiFetch("/api/investigation-requests", {
          method: "POST",
          body: JSON.stringify({ requests: [requestPayload] }),
        });

        if (!requestResponse.ok) {
          const text = await requestResponse.text();
          throw new Error(text || "Failed to save investigation request");
        }

        const savedRequestJson = await requestResponse.json();
        const savedRequest = Array.isArray(savedRequestJson.data) && savedRequestJson.data.length > 0 ? savedRequestJson.data[0] : savedRequestJson.data;
        actualRequestId = savedRequest?.id || savedRequestJson?.id;
        // update local state to replace mock id with actual id
        setRequests((prev) => prev.map((req) => (req.id === requestId ? { ...req, id: actualRequestId } : req)));
      } else {
        actualRequestId = Math.floor(requestId);
      }

      const resultsToSave: ResultToSave[] = [];

      if (request.custom_name) {
        const resultValue = resultInputs[`${requestId}-result`];
        if (resultValue && resultValue.trim()) {
          resultsToSave.push({
            request_id: actualRequestId,
            parameter: request.custom_name,
            value: resultValue.trim(),
            unit: null,
            reference_range: null,
            flag: null,
            notes: resultInputs[`${requestId}-notes`] || null,
            entered_by: currentUser?.id ?? propCurrentUserId ?? 1,
            date_entered: new Date().toISOString(),
          });
        }
      } else if (request.test && request.test.parameters) {
        try {
          const parameters = JSON.parse(request.test.parameters);
          parameters.forEach((param: any) => {
            const parameterValue = resultInputs[`${requestId}-${param.parameter}`];
            if (parameterValue && parameterValue.trim()) {
              resultsToSave.push({
                request_id: actualRequestId,
                parameter: param.parameter,
                value: parameterValue.trim(),
                unit: param.unit || null,
                reference_range: param.range || null,
                flag: null,
                notes: resultInputs[`${requestId}-notes`] || null,
                entered_by: currentUser?.id ?? propCurrentUserId ?? 1,
                date_entered: new Date().toISOString(),
              });
            }
          });
        } catch (e) {
          console.error("Error parsing parameters:", e);
          throw new Error("Invalid test parameters format");
        }
      }

      if (resultsToSave.length === 0) {
        throw new Error("No results to save - please enter at least one result value");
      }

      // save results
      const response = await apiFetch(`/api/investigation-requests/${actualRequestId}/results`, {
        method: "POST",
        body: JSON.stringify({
          results: resultsToSave,
          additional_notes: resultInputs[`${requestId}-notes`] || null,
          status: "results_posted",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || "Unknown error";
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const savedData = await response.json();

      // Update local state with results and status
      setRequests((prev) =>
        prev.map((req) => {
          if (req.id === requestId || req.id === actualRequestId) {
            return {
              ...req,
              results:
                savedData.results ||
                resultsToSave.map((result, index) => ({
                  id: Date.now() + index,
                  parameter: result.parameter,
                  value: result.value,
                  unit: result.unit,
                  reference_range: result.reference_range,
                  flag: result.flag,
                })),
              status: "results_posted",
            };
          }
          return req;
        })
      );

      // clear resultInputs for this request
      Object.keys(resultInputs).forEach((key) => {
        if (key.startsWith(`${requestId}-`)) {
          setResultInputs((prev) => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
          });
        }
      });

      setSaveMessage("Results saved successfully");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error("Failed to save results:", error);
      setSaveMessage(`Failed to save results: ${error instanceof Error ? error.message : "Unknown error"}`);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim()) {
      setShowDropdown(true);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(e.target.value.trim().length > 0);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      requested: "bg-yellow-100 text-yellow-800",
      not_collected: "bg-red-100 text-red-800",
      collected: "bg-blue-100 text-blue-800",
      results_posted: "bg-green-100 text-green-800",
    };

    const statusText = {
      requested: "Requested",
      not_collected: "Not collected",
      collected: "Collected",
      results_posted: "Results posted",
    };

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
        {statusText[status as keyof typeof statusText]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <button className="text-gray-600 hover:text-gray-800">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h1 className="text-base font-semibold text-gray-900">Investigations</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
              {currentUser?.name ? currentUser.name.split(" ").map((s:string)=>s[0]).slice(0,2).join("") : "JM"}
            </div>
          </div>
        </div>

        <div className="p-3">
          {/* Alert */}
          <div className="bg-red-50 border-l-2 border-red-400 p-2 mb-4 flex items-start space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="text-red-700 text-xs">
              <span className="font-semibold">Attention:</span> Add a diagnosis to use this page.
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("Laboratory")}
              className={`px-0 py-1 text-xs font-medium border-b-2 ${activeTab === "Laboratory" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Laboratory
            </button>
            <button
              onClick={() => setActiveTab("Imaging")}
              className={`px-0 py-1 text-xs font-medium border-b-2 ${activeTab === "Imaging" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Imaging
            </button>
          </div>

          {/* Selected Tests */}
          {selectedTests.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {selectedTests.map((test, index) => (
                <div key={index} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs flex items-center space-x-1">
                  <span>{test}</span>
                  <button onClick={() => handleRemoveTest(test)} className="text-blue-600 hover:text-blue-800">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-700">Search by name/dept*</label>
              <button className="text-xs text-blue-600 hover:text-blue-800">View investigations</button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            {showDropdown && searchQuery && (
              <div className="mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-10">
                <div className="p-2 text-xs text-gray-600 bg-gray-50 border-b">Showing results for:</div>
                {filteredTests.length > 0 ? (
                  filteredTests.map((test) => (
                    <button key={test.id} onClick={() => handleAddTest(test.name)} className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0 text-xs text-gray-700">
                      {test.name}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-xs text-gray-500">No results found</div>
                )}
              </div>
            )}
          </div>

          {/* Other Request */}
          <div className="mb-4">
            <label className="flex items-center text-xs font-medium text-gray-700 mb-1">
              Other request
              <Info className="w-3 h-3 ml-1 text-gray-400" />
            </label>
            <input
              type="text"
              placeholder="Describe investigation"
              value={otherRequest}
              onChange={(e) => setOtherRequest(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <label className="block text-xs font-medium text-gray-700 mt-2 mb-1">Notes</label>
            <textarea
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows={2}
            />
          </div>

          {/* Request Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={handleRequestInvestigations}
              disabled={isSaving || (selectedTests.length === 0 && !otherRequest)}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isSaving ? "Requesting..." : "Request"}
            </button>
          </div>

          {/* Lab Results */}
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Lab results</h2>
            {requests.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">No requests yet.</div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-md bg-white">
                    <div className="flex items-start justify-between p-3 border-b border-gray-200">
                      <div className="flex items-start space-x-2">
                        <button onClick={() => toggleResultExpansion(request.id)} className="text-gray-400 hover:text-gray-600 mt-0.5">
                          {expandedResults[request.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{request.custom_name || (request.test ? request.test.name : "Unknown")}</div>
                          <div className="text-xs text-gray-500">Date: {request.date_requested || "Unknown"}</div>
                          <div className="text-xs text-gray-500">Notes: {request.request_notes || "None"}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(request.status)}
                        <span className="text-xs text-gray-600">{request.requested_by}</span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {expandedResults[request.id] && (
                      <div className="p-3">
                        <div className="border-b border-gray-100 pb-2 mb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button onClick={() => toggleTestItemExpansion(`request-${request.id}`)} className="text-gray-400 hover:text-gray-600">
                                {expandedTestItems[`request-${request.id}`] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                              <span className="text-xs font-medium text-gray-700">{request.custom_name || (request.test ? request.test.name : "Unknown")}</span>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                          {expandedTestItems[`request-${request.id}`] && (
                            <div className="ml-6 mt-2 bg-gray-50 rounded-md p-3">
                              <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Results</label>
                                {request.custom_name && (
                                  <input
                                    type="text"
                                    placeholder="Enter results"
                                    value={resultInputs[`${request.id}-result`] || ""}
                                    onChange={(e) => handleResultInput(`${request.id}-result`, e.target.value)}
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  />
                                )}
                                {request.test && request.test.parameters && (
                                  <div className="space-y-2">
                                    {(() => {
                                      try {
                                        const parameters = JSON.parse(request.test.parameters);
                                        return parameters.map((param: any, index: number) => (
                                          <div key={index} className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-700 w-32">{param.parameter}:</span>
                                            <input
                                              type="text"
                                              placeholder={`Value (${param.unit})`}
                                              value={resultInputs[`${request.id}-${param.parameter}`] || ""}
                                              onChange={(e) => handleResultInput(`${request.id}-${param.parameter}`, e.target.value)}
                                              className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            />
                                            <span className="text-xs text-gray-500 w-24">Ref: {param.range}</span>
                                          </div>
                                        ));
                                      } catch (e) {
                                        return (
                                          <input
                                            type="text"
                                            placeholder="Enter results"
                                            value={resultInputs[`${request.id}-result`] || ""}
                                            onChange={(e) => handleResultInput(`${request.id}-result`, e.target.value)}
                                            className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                          />
                                        );
                                      }
                                    })()}
                                  </div>
                                )}
                              </div>
                              <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                                <input
                                  type="text"
                                  value={resultInputs[`${request.id}-notes`] || ""}
                                  onChange={(e) => handleResultInput(`${request.id}-notes`, e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <div className="text-xs font-medium text-gray-700">Requested by</div>
                                  <div className="text-xs text-gray-600">{request.requested_by} on {request.date_requested}</div>
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-gray-700">Performed by</div>
                                  <div className="text-xs text-gray-600">-</div>
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleSaveResults(request.id)}
                                  disabled={isSaving}
                                  className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50 text-xs font-medium"
                                >
                                  {isSaving ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Success Toast */}
        <AnimatePresence>
          {showSuccessToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-4 right-4 w-64 bg-white border-l-2 border-green-600 shadow-md rounded-md px-2 py-1.5 flex items-center z-50"
            >
              <CheckCircle className="text-green-600 w-3 h-3 flex-shrink-0" />
              <div className="ml-1.5 flex-1">
                <div className="font-semibold text-green-700 text-xs">Success</div>
                <div className="text-gray-700 text-xs">{saveMessage}</div>
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 3, ease: "linear" }}
                  className="h-0.5 bg-green-600 mt-1 rounded-full"
                />
              </div>
              <button onClick={() => setShowSuccessToast(false)} className="ml-1.5 text-gray-500 hover:text-gray-700">
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InvestigationPage;
