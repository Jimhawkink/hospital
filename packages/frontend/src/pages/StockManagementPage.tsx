import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid"; // Import UUID library
import { useStocks, addStock, updateStock, deleteStock, Stock } from "../api/stock";
import { Search, Filter, Settings, Plus, Edit, Package, Archive, Trash2, RotateCcw } from "lucide-react";

// Enhanced Stock interface to match the database schema
interface EnhancedStock {
  id: string;
  productName: string;
  productType: string;
  sku?: string;
  category: string;
  basePackage: string;
  unitsPerPackage: number;
  sellingPrice: number;
  availableOnPOS: boolean;
  minStockNotification: number;
  quantity?: number;
  availableUnits?: number;
  status?: "available" | "out-of-stock" | "low-stock";
  expiryDate?: string;
  batchNo?: string;
  createdAt: string;
  updatedAt: string;
  packages?: Package[];
  availableqty: number;
  buyingprice: number;
}

interface Package {
  id: string;
  name: string;
  sellingPrice: number;
  unitsPerPack: number;
  availableForPurchase: boolean;
}

type TabType = "available" | "movement" | "batches" | "archive";

export default function StockManagementPage() {
  const { stocks, isLoading, isError, mutate, errorDetails } = useStocks();
  
  // Debug: Log the stocks data to see what we're getting from the API
  React.useEffect(() => {
    if (stocks) {
      console.log("📦 Stocks data from API:", stocks);
      console.log("📦 Number of stocks:", stocks.length);
    }
  }, [stocks]);

  const [activeTab, setActiveTab] = useState<TabType>("available");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<EnhancedStock | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editFormData, setEditFormData] = useState<Partial<EnhancedStock>>({});
  const [addFormData, setAddFormData] = useState<any>({
    productName: "",
    productType: "Medicine",
    sku: "",
    category: "",
    basePackage: "Tablet",
    unitsPerPackage: 1,
    sellingPrice: 0,
    buyingprice: 0,
    minStockNotification: 10,
    expiryDate: "",
    batchNo: "",
    availableOnPOS: true,
    unitsCollected: 1
  });
  const [dropdownVisible, setDropdownVisible] = useState<string | null>(null);
  const [unitsCollected, setUnitsCollected] = useState<number>(1);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to format dates
  const formatDateForDisplay = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format for input
    } catch (error) {
      return "";
    }
  };

  // Transform stocks data to match enhanced interface
  const enhancedStocks: EnhancedStock[] = stocks?.map(stock => {
    const productName = (stock as any).productName || stock.name || "Unknown Product";
    const productType = (stock as any).productType || "Medicine";
    const basePackage = (stock as any).basePackage || "unit";
    const unitsPerPackage = (stock as any).unitsPerPackage || 1;
    const sellingPrice = (stock as any).sellingPrice || stock.sellingPrice || 0;
    const availableOnPOS = (stock as any).availableOnPOS !== undefined ? (stock as any).availableOnPOS : true;
    const minStockNotification = (stock as any).minStockNotification || 10;
    
    return {
      id: stock.id,
      productName,
      productType,
      sku: stock.sku,
      category: stock.category,
      basePackage,
      unitsPerPackage,
      sellingPrice,
      availableOnPOS,
      minStockNotification,
      quantity: stock.quantity,
      availableUnits: stock.quantity || 0,
      status: (stock.quantity || 0) <= 0 ? "out-of-stock" : 
              (stock.quantity || 0) <= minStockNotification ? "low-stock" : "available",
      expiryDate: formatDateForDisplay((stock as any).expiryDate),
      batchNo: (stock as any).batchNo,
      createdAt: (stock as any).createdAt || new Date().toISOString(),
      updatedAt: (stock as any).updatedAt || new Date().toISOString(),
      packages: (stock as any).packages || [],
      availableqty: (stock as any).availableqty || stock.quantity || 0,
      buyingprice: (stock as any).buyingprice || 0,
    };
  }) || [];

  const tabs = [
    { key: "available", label: "Available Stock", count: enhancedStocks.filter(s => s.status === "available").length },
    { key: "movement", label: "Stock Movement" },
    { key: "batches", label: "Batches" },
    { key: "archive", label: "Archive" },
  ];

  const filteredStocks = enhancedStocks.filter(stock =>
    stock.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleRowExpansion = (stockId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(stockId)) {
      newExpanded.delete(stockId);
    } else {
      newExpanded.add(stockId);
    }
    setExpandedRows(newExpanded);
  };

  const handleRestock = (stock: EnhancedStock) => {
    setSelectedStock(stock);
    setShowRestockModal(true);
    setUnitsCollected(1);
    setSelectedPackage(stock.packages?.[0]?.name || stock.basePackage || "unit");
  };

  const handleEditProduct = (stock: EnhancedStock) => {
    setSelectedStock(stock);
    setEditFormData(stock);
    setShowEditModal(true);
  };

  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleSaveNewProduct = async (productData: any) => {
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    try {
      console.log("📦 Received product data:", productData);

      // Validate required fields
      if (!productData.name || !productData.category) {
        throw new Error("Product name and category are required");
      }

      // Calculate total quantity based on unitsCollected and unitsPerPack
      const unitsPerPack = productData.packages?.[0]?.unitsPerPack || productData.unitsPerPackage || 1;
      const unitsCollected = productData.unitsCollected || 0;
      const totalQuantity = unitsCollected * unitsPerPack;

      // Determine the status based on quantity and min stock notification
      const minStockNotification = productData.lowStockNotification || productData.minStockNotification || 10;
      let status: "available" | "out-of-stock" | "low-stock";
      
      if (totalQuantity <= 0) {
        status = "out-of-stock";
      } else if (totalQuantity <= minStockNotification) {
        status = "low-stock";
      } else {
        status = "available";
      }

      // Prepare the new product data - use only the fields that exist in the Stock interface
      const newProductData: any = {
        id: uuidv4(), // Generate a unique ID for the new product
        name: productData.name,
        category: productData.category,
        quantity: totalQuantity,
        sellingPrice: productData.packages?.[0]?.sellingPrice || productData.sellingPrice || 0,
        sku: productData.sku || `SKU-${Date.now()}`, // Generate SKU if not provided
        status: status,
        productName: productData.name,
        productType: productData.type || productData.productType || "Medicine",
        basePackage: productData.packages?.[0]?.name || productData.basePackage || "unit",
        unitsPerPackage: unitsPerPack,
        availableOnPOS: productData.packages?.[0]?.availableOnPOS !== undefined ? 
                       productData.packages[0].availableOnPOS : 
                       (productData.availableOnPOS !== undefined ? productData.availableOnPOS : true),
        minStockNotification: minStockNotification,
        expiryDate: productData.expiryDate || null,
        batchNo: productData.batchNo || null,
        buyingprice: productData.buyingprice || productData.packages?.[0]?.buyingPrice || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        availableUnits: totalQuantity,
        availableqty: totalQuantity,
      };

      console.log("📦 Prepared data for API:", newProductData);

      // Save to database
      const result = await addStock(newProductData);
      console.log("📦 API Response:", result);

      // Close modal and refresh data
      setShowAddModal(false);
      setAddFormData({
        productName: "",
        productType: "Medicine",
        sku: "",
        category: "",
        basePackage: "Tablet",
        unitsPerPackage: 1,
        sellingPrice: 0,
        buyingprice: 0,
        minStockNotification: 10,
        expiryDate: "",
        batchNo: "",
        availableOnPOS: true,
        unitsCollected: 1
      });
      await mutate(); // Wait for the mutation to complete
      
      console.log("✅ Product successfully added to database");
      
    } catch (error) {
      console.error("❌ Error adding new product:", error);
      
      // More detailed error handling
      let errorMessage = "Failed to add product. Please try again.";
      if (error instanceof Error) {
        errorMessage = `Failed to add product: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = `Failed to add product: ${JSON.stringify(error)}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEditedProduct = async () => {
    if (!selectedStock || !editFormData || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Prepare update data with proper validation
      const updatedData: any = {
        name: editFormData.productName || selectedStock.productName,
        category: editFormData.category || selectedStock.category,
        quantity: editFormData.availableqty || editFormData.quantity || selectedStock.availableqty,
        sellingPrice: editFormData.sellingPrice || selectedStock.sellingPrice,
        ...(editFormData.sku !== undefined && { sku: editFormData.sku }),
        ...(editFormData.productType !== undefined && { productType: editFormData.productType }),
        ...(editFormData.basePackage !== undefined && { basePackage: editFormData.basePackage }),
        ...(editFormData.unitsPerPackage !== undefined && { unitsPerPackage: editFormData.unitsPerPackage }),
        ...(editFormData.availableOnPOS !== undefined && { availableOnPOS: editFormData.availableOnPOS }),
        ...(editFormData.minStockNotification !== undefined && { minStockNotification: editFormData.minStockNotification }),
        ...(editFormData.expiryDate !== undefined && { expiryDate: editFormData.expiryDate }),
        ...(editFormData.batchNo !== undefined && { batchNo: editFormData.batchNo }),
        ...(editFormData.buyingprice !== undefined && { buyingprice: editFormData.buyingprice }),
        productName: editFormData.productName || selectedStock.productName,
        availableqty: editFormData.availableqty || editFormData.quantity || selectedStock.availableqty,
        updatedAt: new Date().toISOString(),
      };

      console.log("📝 Updating product with data:", updatedData);
      
      await updateStock(selectedStock.id, updatedData);
      
      setShowEditModal(false);
      setSelectedStock(null);
      setEditFormData({});
      await mutate();
      
      console.log("✅ Product successfully updated");
    } catch (error) {
      console.error("❌ Error updating product:", error);
      alert("Failed to update product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (stockId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteStock(stockId);
        await mutate();
        console.log("✅ Product successfully deleted");
      } catch (error) {
        console.error("❌ Error deleting product:", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const handleArchiveProduct = async (stockId: string) => {
    if (window.confirm("Are you sure you want to archive this product?")) {
      try {
        const updateData: any = { 
          archived: true,
          updatedAt: new Date().toISOString(),
        };
        
        await updateStock(stockId, updateData);
        await mutate();
        console.log("✅ Product successfully archived");
      } catch (error) {
        console.error("❌ Error archiving product:", error);
        alert("Failed to archive product. Please try again.");
      }
    }
  };

  const handleEditFormChange = (field: keyof EnhancedStock, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddFormChange = (field: string, value: any) => {
    setAddFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddSave = () => {
    handleSaveNewProduct({
      ...addFormData,
      name: addFormData.productName,
      lowStockNotification: addFormData.minStockNotification,
    });
  };

  const handleAddItems = async () => {
    if (!selectedStock || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const selectedPkg = selectedStock.packages?.find(pkg => pkg.name === selectedPackage) || {
        name: selectedStock.basePackage,
        unitsPerPack: selectedStock.unitsPerPackage || 1,
        sellingPrice: selectedStock.sellingPrice || 0,
        id: "",
        availableForPurchase: true,
      };
      
      const unitsToAdd = unitsCollected || 0;
      const newAvailableQty = (selectedStock.availableqty || 0) + (selectedPkg.unitsPerPack * unitsToAdd);
      const buyingPrice = selectedStock.buyingprice || 0;

      console.log("🔄 Restock Debug:", {
        selectedStockId: selectedStock.id,
        selectedPackage,
        selectedPkg,
        unitsToAdd,
        unitsPerPack: selectedPkg.unitsPerPack,
        currentAvailableQty: selectedStock.availableqty,
        newAvailableQty,
        buyingPrice,
      });

      const updatedData: any = {
        quantity: newAvailableQty,
        availableqty: newAvailableQty,
        buyingprice: buyingPrice,
        expiryDate: selectedStock.expiryDate,
        batchNo: selectedStock.batchNo,
        updatedAt: new Date().toISOString(),
      };

      console.log("🔄 Updating stock with restock data:", updatedData);

      await updateStock(selectedStock.id, updatedData);
      setShowRestockModal(false);
      setSelectedStock(null);
      await mutate();
      
      console.log("✅ Stock successfully restocked");
    } catch (error) {
      console.error("❌ Error restocking items:", error);
      alert("Failed to restock items. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setDropdownVisible(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg text-gray-600">Loading stocks...</div>
    </div>
  );

  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h2 className="text-red-800 font-semibold mb-2">Failed to load stocks</h2>
          <p className="text-red-600 mb-2">Please check:</p>
          <ul className="text-red-600 text-sm list-disc list-inside space-y-1">
            <li>Is your backend server running?</li>
            <li>Is the API URL correct? (Check browser console for details)</li>
            <li>Are there any CORS issues?</li>
          </ul>
          {errorDetails && (
            <div className="mt-3 p-3 bg-red-100 rounded text-sm">
              <strong>Error details:</strong> {JSON.stringify(errorDetails)}
            </div>
          )}
          <button 
            onClick={() => mutate()} 
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
        <button
          onClick={handleAddProduct}
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          {isSubmitting ? "Adding..." : "Add product"}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-1 bg-gray-100 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "available" && (
            <>
              {/* Search and Filters */}
              <div className="flex items-center justify-between mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <Filter size={16} />
                    Filter
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <Settings size={16} />
                    Configure columns
                  </button>
                </div>
              </div>

              {/* Stock Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden text-xs">
                {filteredStocks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {searchQuery ? "No products found matching your search." : "No products available. Click 'Add product' to get started."}
                  </div>
                ) : (
                  <>
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="w-8 px-4 py-3"></th>
                          <th className="text-left px-4 py-3 font-medium text-gray-900">Product Name</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-900">Category</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-900">Base Package</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-900">Available Qty</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-900">Selling Price</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-900">Buying Price</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-900">Expiry Date</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-900">Batch No</th>
                          <th className="w-8 px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStocks.map((stock) => (
                          <React.Fragment key={stock.id}>
                            <tr className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <input type="checkbox" className="rounded" />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {stock.packages && stock.packages.length > 0 && (
                                    <button
                                      onClick={() => toggleRowExpansion(stock.id)}
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      {expandedRows.has(stock.id) ? "▼" : "▶"}
                                    </button>
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900">{stock.productName}</div>
                                    <div className="text-gray-500">{stock.sku}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{stock.category}</td>
                              <td className="px-4 py-3 text-gray-600">{stock.basePackage}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    stock.status === "available" ? "bg-green-100 text-green-800" :
                                    stock.status === "low-stock" ? "bg-yellow-100 text-yellow-800" :
                                    "bg-red-100 text-red-800"
                                  }`}>
                                    {stock.availableqty || 0}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">KES {(stock.sellingPrice || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 text-gray-600">KES {(stock.buyingprice || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 text-gray-600">{formatDateForDisplay(stock.expiryDate)}</td>
                              <td className="px-4 py-3 text-gray-600">{stock.batchNo || "N/A"}</td>
                              <td className="px-4 py-3">
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDropdownVisible(dropdownVisible === stock.id ? null : stock.id);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                  >
                                    ⋮
                                  </button>
                                  {dropdownVisible === stock.id && (
                                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRestock(stock);
                                          setDropdownVisible(null);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                                      >
                                        <Package size={14} />
                                        Restock
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditProduct(stock);
                                          setDropdownVisible(null);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                                      >
                                        <Edit size={14} />
                                        Edit
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleArchiveProduct(stock.id);
                                          setDropdownVisible(null);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                                      >
                                        <Archive size={14} />
                                        Archive
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteProduct(stock.id);
                                          setDropdownVisible(null);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-red-600"
                                      >
                                        <Trash2 size={14} />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {expandedRows.has(stock.id) && stock.packages && stock.packages.length > 0 && (
                              <tr>
                                <td colSpan={10} className="px-4 py-4 bg-blue-50">
                                  <div className="ml-6">
                                    <h4 className="font-medium text-sm mb-2">Package Details</h4>
                                    <table className="w-full">
                                      <thead>
                                        <tr className="text-xs text-gray-600">
                                          <th className="text-left py-2">Package name</th>
                                          <th className="text-left py-2">Package selling price</th>
                                          <th className="text-left py-2">Units per pack</th>
                                          <th className="text-left py-2">Available for purchase</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {stock.packages.map((pkg: Package) => (
                                          <tr key={pkg.id} className="text-xs">
                                            <td className="py-2">{pkg.name}</td>
                                            <td className="py-2">KES {(pkg.sellingPrice || 0).toFixed(2)}</td>
                                            <td className="py-2">{pkg.unitsPerPack}</td>
                                            <td className="py-2">
                                              <div className={`w-12 h-6 rounded-full ${pkg.availableForPurchase ? "bg-green-500" : "bg-gray-300"} relative cursor-pointer`}>
                                                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${pkg.availableForPurchase ? "translate-x-6" : "translate-x-0.5"}`}></div>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600">
                        Showing {filteredStocks.length} of {enhancedStocks.length} entries
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Rows per page</span>
                          <select className="border border-gray-300 rounded px-2 py-1 text-xs">
                            <option>10</option>
                            <option>25</option>
                            <option>50</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Page 1 of 1</span>
                          <div className="flex gap-1">
                            <button className="p-1 hover:bg-gray-100 rounded">◀</button>
                            <button className="p-1 hover:bg-gray-100 rounded">▶</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {activeTab !== "available" && (
            <div className="text-center py-12 text-gray-500">
              {activeTab === "movement" && "Stock movement tracking coming soon..."}
              {activeTab === "batches" && "Batch management coming soon..."}
              {activeTab === "archive" && "Archived items coming soon..."}
            </div>
          )}
        </div>
      </div>

      {/* Add New Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-800">Add New Product</h2>
                  <p className="text-sm text-slate-600">Complete the form below to add a new product</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Details */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-base font-semibold text-slate-800">Product Details</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Product Name *</label>
                      <input 
                        type="text"
                        value={addFormData.productName || ""}
                        onChange={(e) => handleAddFormChange("productName", e.target.value)}
                        required 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Product Type *</label>
                      <select 
                        value={addFormData.productType || ""}
                        onChange={(e) => handleAddFormChange("productType", e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      >
                        <option value="Medicine">Medicine</option>
                        <option value="Supplement">Supplement</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">SKU</label>
                      <input 
                        type="text"
                        value={addFormData.sku || ""}
                        onChange={(e) => handleAddFormChange("sku", e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Category *</label>
                      <input 
                        type="text"
                        value={addFormData.category || ""}
                        onChange={(e) => handleAddFormChange("category", e.target.value)}
                        required 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Base Package *</label>
                      <select
                        value={addFormData.basePackage || ""}
                        onChange={(e) => handleAddFormChange("basePackage", e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      >
                        <option value="Tablet">Tablet</option>
                        <option value="14">14</option>
                        <option value="s pack">s pack</option>
                        <option value="Pack">Pack</option>
                        <option value="Box">Box</option>
                        <option value="Tablets">Tablets</option>
                        <option value="Tabs">Tabs</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Units per Package *</label>
                      <input 
                        type="number" 
                        value={addFormData.unitsPerPackage || ""}
                        onChange={(e) => handleAddFormChange("unitsPerPackage", parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing and Stock */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <h2 className="text-base font-semibold text-slate-800">Pricing and Stock</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Selling Price (KES) *</label>
                      <input 
                        type="number" 
                        value={addFormData.sellingPrice || ""}
                        onChange={(e) => handleAddFormChange("sellingPrice", parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Buying Price (KES) *</label>
                      <input 
                        type="number" 
                        value={addFormData.buyingprice || ""}
                        onChange={(e) => handleAddFormChange("buyingprice", parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Units Collected *</label>
                      <input 
                        type="number" 
                        value={addFormData.unitsCollected || ""}
                        onChange={(e) => handleAddFormChange("unitsCollected", parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Min Stock Notification *</label>
                      <input 
                        type="number" 
                        value={addFormData.minStockNotification || ""}
                        onChange={(e) => handleAddFormChange("minStockNotification", parseInt(e.target.value) || 10)}
                        min="0"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Expiry Date</label>
                      <input 
                        type="date" 
                        value={addFormData.expiryDate || ""}
                        onChange={(e) => handleAddFormChange("expiryDate", e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Batch No</label>
                      <input 
                        type="text" 
                        value={addFormData.batchNo || ""}
                        onChange={(e) => handleAddFormChange("batchNo", e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={addFormData.availableOnPOS || false}
                        onChange={(e) => handleAddFormChange("availableOnPOS", e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Available on POS</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 p-6 border-t">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddSave}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isSubmitting ? "Adding..." : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Edit Product</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Product Name*</label>
                  <input 
                    type="text" 
                    value={editFormData.productName || ""}
                    onChange={(e) => handleEditFormChange("productName", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Product Type*</label>
                  <select 
                    value={editFormData.productType || ""}
                    onChange={(e) => handleEditFormChange("productType", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select Type</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Supplement">Supplement</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">SKU</label>
                  <input 
                    type="text" 
                    value={editFormData.sku || ""}
                    onChange={(e) => handleEditFormChange("sku", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category*</label>
                  <input 
                    type="text" 
                    value={editFormData.category || ""}
                    onChange={(e) => handleEditFormChange("category", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Base Package*</label>
                  <select
                    value={editFormData.basePackage || ""}
                    onChange={(e) => handleEditFormChange("basePackage", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select Package</option>
                    <option value="Tablet">Tablet</option>
                    <option value="14">14</option>
                    <option value="s pack">s pack</option>
                    <option value="Pack">Pack</option>
                    <option value="Box">Box</option>
                    <option value="Tablets">Tablets</option>
                    <option value="Tabs">Tabs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Units per Package*</label>
                  <input 
                    type="number" 
                    value={editFormData.unitsPerPackage || ""}
                    onChange={(e) => handleEditFormChange("unitsPerPackage", parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Available Qty*</label>
                  <input 
                    type="number" 
                    value={editFormData.availableqty || ""}
                    onChange={(e) => handleEditFormChange("availableqty", parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Selling Price (KES)*</label>
                  <input 
                    type="number" 
                    value={editFormData.sellingPrice || ""}
                    onChange={(e) => handleEditFormChange("sellingPrice", parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Buying Price (KES)*</label>
                  <input 
                    type="number" 
                    value={editFormData.buyingprice || ""}
                    onChange={(e) => handleEditFormChange("buyingprice", parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Min Stock Notification*</label>
                  <input 
                    type="number" 
                    value={editFormData.minStockNotification || ""}
                    onChange={(e) => handleEditFormChange("minStockNotification", parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Expiry Date</label>
                  <input 
                    type="date" 
                    value={editFormData.expiryDate || ""}
                    onChange={(e) => handleEditFormChange("expiryDate", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Batch No</label>
                  <input 
                    type="text" 
                    value={editFormData.batchNo || ""}
                    onChange={(e) => handleEditFormChange("batchNo", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={editFormData.availableOnPOS || false}
                    onChange={(e) => handleEditFormChange("availableOnPOS", e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Available on POS</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button 
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEditedProduct}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-sm mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Restock items</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedStock.productName}</p>
                <p className="text-sm text-gray-500">{selectedStock.availableqty || 0} units in stock</p>
              </div>
              <button 
                onClick={() => setShowRestockModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Select package*</label>
                <select
                  value={selectedPackage}
                  onChange={(e) => setSelectedPackage(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                >
                  <option value={selectedStock.basePackage}>
                    {selectedStock.basePackage} ({selectedStock.unitsPerPackage || 1} units)
                  </option>
                  {selectedStock.packages && selectedStock.packages.map((pkg: Package) => (
                    <option key={pkg.id} value={pkg.name}>
                      {pkg.name} ({pkg.unitsPerPack} units)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry date*</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    value={selectedStock.expiryDate || ""}
                    onChange={(e) => {
                      if (selectedStock) {
                        setSelectedStock({ ...selectedStock, expiryDate: e.target.value });
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Buying price per package (KES)*</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    step="0.01"
                    min="0"
                    value={selectedStock.buyingprice || 0}
                    onChange={(e) => {
                      if (selectedStock) {
                        setSelectedStock({ ...selectedStock, buyingprice: parseFloat(e.target.value) || 0 });
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Units collected*</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  min="1"
                  value={unitsCollected}
                  onChange={(e) => setUnitsCollected(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Batch no</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
                  value={selectedStock.batchNo || ""}
                  onChange={(e) => {
                    if (selectedStock) {
                      setSelectedStock({ ...selectedStock, batchNo: e.target.value });
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button 
                onClick={() => setShowRestockModal(false)}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddItems}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Add items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}