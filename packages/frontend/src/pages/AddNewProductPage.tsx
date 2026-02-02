// src/pages/AddNewProductPage.tsx
import React, { useState } from "react";
import { X, Plus, Search } from "lucide-react";

interface Package {
  id: string;
  name: string;
  unitsPerPackage: number;
  sellingPrice: number;
  availableOnPOS: boolean;
}

interface AddNewProductPageProps {
  onClose: () => void;
  onSave: (productData: any) => void;
}

export default function AddNewProductPage({ onClose, onSave }: AddNewProductPageProps) {
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState('Product');
  const [sku, setSku] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categorySearchOpen, setCategorySearchOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [batchNo, setBatchNo] = useState('');
  const [unitsCollected, setUnitsCollected] = useState('0');
  const [expiryDate, setExpiryDate] = useState('');
  
  // Base package (always present)
  const [basePackage, setBasePackage] = useState<Package>({
    id: 'base',
    name: 'Tablet',
    unitsPerPackage: 1,
    sellingPrice: 5,
    availableOnPOS: true
  });

  // Additional packages
  const [additionalPackages, setAdditionalPackages] = useState<Package[]>([]);

  // Product categories for dropdown
  const categories = [
    'Consultation',
    'Consumables',
    'Investigations',
    'Investigations / Biochemistry',
    'Investigations / Cytology',
    'Investigations / Haematology',
    'Investigations / Imaging',
    'Investigations / Microbiology',
    'Pharmacy',
    'Pharmacy / Antimicrobials',
    'Pharmacy / Antimicrobials / Antibiotic',
    'Pharmacy / NSAIDS'
  ];

  const filteredCategories = categories.filter(category =>
    category.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const addPackage = () => {
    const newPackage: Package = {
      id: `pkg_${Date.now()}`,
      name: '10s',
      unitsPerPackage: 10,
      sellingPrice: 0,
      availableOnPOS: false
    };
    setAdditionalPackages([...additionalPackages, newPackage]);
  };

  const removePackage = (id: string) => {
    setAdditionalPackages(additionalPackages.filter(pkg => pkg.id !== id));
  };

  const updatePackage = (id: string, field: keyof Package, value: any) => {
    if (id === 'base') {
      setBasePackage({ ...basePackage, [field]: value });
    } else {
      setAdditionalPackages(additionalPackages.map(pkg =>
        pkg.id === id ? { ...pkg, [field]: value } : pkg
      ));
    }
  };

  const handleSave = () => {
    const productData = {
      name: productName,
      type: productType,
      sku,
      category: selectedCategory,
      lowStockThreshold: parseInt(lowStockThreshold),
      batchNo,
      unitsCollected: parseInt(unitsCollected),
      expiryDate,
      packages: [basePackage, ...additionalPackages]
    };
    onSave(productData);
  };

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setCategorySearchOpen(false);
    setCategorySearch('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Add New Product</h2>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Dismiss
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save changes
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Product Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Product information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product name*
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="AMOXICLAV (AUGMENTIN) 625MG"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product type*
                </label>
                <div className="relative">
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="Product">Product</option>
                    <option value="Service">Service</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20">
                      <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Product Sorting */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Product sorting</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search product category*
              </label>
              <div className="relative">
                <button
                  onClick={() => setCategorySearchOpen(!categorySearchOpen)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Search size={16} className="text-gray-400" />
                    <span className={selectedCategory ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedCategory || 'Search'}
                    </span>
                  </div>
                  <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20">
                    <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                  </svg>
                </button>

                {categorySearchOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder="Search categories..."
                        autoFocus
                      />
                    </div>
                    <div className="py-1">
                      {filteredCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => selectCategory(category)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedCategory && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory('')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X size={14} />
                    </button>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Selling Price */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-medium text-gray-900">Selling price</h3>
              <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center">
                <span className="text-white text-xs">?</span>
              </div>
            </div>

            {/* Base Package */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base sellable package*
                  </label>
                  <input
                    type="text"
                    value={basePackage.name}
                    onChange={(e) => updatePackage('base', 'name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Units per package
                  </label>
                  <input
                    type="number"
                    value={basePackage.unitsPerPackage}
                    onChange={(e) => updatePackage('base', 'unitsPerPackage', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selling price (KES)*
                  </label>
                  <input
                    type="number"
                    value={basePackage.sellingPrice}
                    onChange={(e) => updatePackage('base', 'sellingPrice', parseFloat(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available on POS
                  </label>
                  <div 
                    onClick={() => updatePackage('base', 'availableOnPOS', !basePackage.availableOnPOS)}
                    className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${
                      basePackage.availableOnPOS ? 'bg-green-500' : 'bg-gray-300'
                    } relative`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      basePackage.availableOnPOS ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Packages */}
            {additionalPackages.map((pkg, index) => (
              <div key={pkg.id} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Other sellable package
                    </label>
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(e) => updatePackage(pkg.id, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Units per package
                    </label>
                    <input
                      type="number"
                      value={pkg.unitsPerPackage}
                      onChange={(e) => updatePackage(pkg.id, 'unitsPerPackage', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling price (KES)*
                    </label>
                    <input
                      type="number"
                      value={pkg.sellingPrice}
                      onChange={(e) => updatePackage(pkg.id, 'sellingPrice', parseFloat(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      step="0.01"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available on POS
                      </label>
                      <div 
                        onClick={() => updatePackage(pkg.id, 'availableOnPOS', !pkg.availableOnPOS)}
                        className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${
                          pkg.availableOnPOS ? 'bg-green-500' : 'bg-gray-300'
                        } relative`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                          pkg.availableOnPOS ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </div>
                    <button
                      onClick={() => removePackage(pkg.id)}
                      className="text-gray-400 hover:text-red-600 p-1 mt-6"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Package Button */}
            <button
              onClick={addPackage}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Plus size={16} />
              Add package(s)
            </button>
          </div>

          {/* Low Stock Notifications */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Low Stock Notifications</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum units before sending notification
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Stock Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-medium text-gray-900">Stock information</h3>
              <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center">
                <span className="text-white text-xs">?</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch no.
                </label>
                <div className="text-gray-600">No units recorded</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Units collected
                </label>
                <div className="text-gray-600">0</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry date
                </label>
                <div className="text-gray-600">N/A</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}