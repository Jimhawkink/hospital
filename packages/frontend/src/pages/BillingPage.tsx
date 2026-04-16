import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, Trash2, CreditCard, User, Calendar, X, Printer,
  CheckCircle, Smartphone, Banknote, ShoppingCart, Clock, Calculator,
  Briefcase, Filter, ChevronDown, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

// API Configuration
const api = axios.create({ baseURL: '/api' });

// --- Types ---

interface Product {
  id: string;
  name: string;
  sku?: string;
  sellingPrice: number;
  availableUnits: number;
  category: string;
  expiryDate?: string;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  gender?: string;
  dob?: string;
}

interface Encounter {
  id: number;
  encounter_number: string;
  encounter_type: string;
  createdAt: string;
  patient?: Patient;
}

interface CartItem {
  cartId: string; // unique ID for cart item
  product: Product;
  quantity: number;
  taxRate: number; // percentage
  discountAmount: number; // fixed amount
}

interface SaleItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_amount: number;
  subtotal: number;
}

interface Sale {
  id: number;
  receipt_no: string;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total_amount: number;
  amount_tendered?: number;
  change_due?: number;
  payment_method: string;
  status: string;
  created_at: string;
  items: SaleItem[];
  patient?: {
    id: number;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

interface OrgSettings {
  organisation_name: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// --- Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {title}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- Main Page ---

export default function BillingPage() {
  const queryClient = useQueryClient();

  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchPatientQuery, setSearchPatientQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [amountTendered, setAmountTendered] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Paybill'>('Cash');

  // Modals
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  // Queries
  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>(['products'], () =>
    api.get('/stock').then(res => res.data)
  );

  const { data: orgSettings } = useQuery<OrgSettings>(['orgSettings'], () =>
    api.get('/organization/settings').then(res => res.data)
  );

  const { data: patients = [] } = useQuery<Patient[]>(['patients', searchPatientQuery], () =>
    api.get(`/patients/search?q=${searchPatientQuery}`).then(res => res.data)
  );

  const { data: encounters = [] } = useQuery<Encounter[]>(['encounters', selectedPatient?.id], () =>
    api.get(`/encounters/patient/${selectedPatient?.id}`).then(res => res.data),
    { enabled: !!selectedPatient }
  );

  // Mutations
  const createSaleMutation = useMutation(
    (newSale: any) => api.post('/pos/sales', newSale).then(res => res.data),
    {
      onSuccess: (data) => {
        setLastSale(data);
        setCart([]);
        setSelectedPatient(null);
        setSelectedEncounter(null);
        setShowPaymentModal(false);
        setShowReceiptModal(true);
        toast.success("Payment processed successfully!");
        queryClient.invalidateQueries(['products']); // Refresh stock
      },
      onError: (err) => {
        toast.error("Failed to process payment. Please try again.");
        console.error(err);
      }
    }
  );

  // Derived State
  // Safeguard against missing or malformed products
  const safeProducts = Array.isArray(products) ? products.filter(p => p && p.name) : [];

  const filteredProducts = safeProducts.filter(p =>
    (categoryFilter === 'All' || (p.category || 'Uncategorized') === categoryFilter) &&
    (p.name || '').toLowerCase().includes(searchProduct.toLowerCase())
  );

  const categories = ['All', ...Array.from(new Set(safeProducts.map(p => p.category || 'Uncategorized')))];

  const cartTotals = cart.reduce((acc, item) => {
    const gross = item.product.sellingPrice * item.quantity;
    const taxable = Math.max(0, gross - item.discountAmount);
    const tax = taxable * (item.taxRate / 100);
    return {
      subtotal: acc.subtotal + taxable,
      tax: acc.tax + tax,
      discount: acc.discount + item.discountAmount,
      total: acc.total + taxable + tax
    };
  }, { subtotal: 0, tax: 0, discount: 0, total: 0 });

  // Handlers
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        cartId: Math.random().toString(),
        product,
        quantity: 1,
        taxRate: 0,
        discountAmount: 0
      }];
    });
    toast.info(`${product.name} added to cart`);
  };

  const updateCartItem = (cartId: string, field: 'taxRate' | 'discountAmount', value: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleProcessPayment = () => {
    if (!selectedPatient) return toast.error("Please select a patient first");
    if (cart.length === 0) return toast.error("Cart is empty");

    if (paymentMethod === 'Cash' && (Number(amountTendered) < cartTotals.total)) {
      return toast.error("Insufficient amount tendered!");
    }

    const saleData = {
      patient_id: selectedPatient.id,
      encounter_id: selectedEncounter?.id,
      payment_method: paymentMethod,
      amount_tendered: Number(amountTendered),
      change_due: paymentMethod === 'Cash' ? (Number(amountTendered) - cartTotals.total) : 0,
      items: cart.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.sellingPrice,
        tax_rate: item.taxRate,
        discount_amount: item.discountAmount
      })),
      notes: selectedEncounter ? `Linked to Encounter: ${selectedEncounter.encounter_number}` : ''
    };

    createSaleMutation.mutate(saleData);
  };

  // Print Receipt Handler - Mirrors NewEncounterModal implementation
  const handlePrintReceipt = (sale: Sale) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;

    const calculateItemTotal = (item: SaleItem) => {
      const gross = item.unit_price * item.quantity;
      const taxable = Math.max(0, gross - item.discount_amount);
      const tax = taxable * (item.tax_rate / 100);
      return taxable + tax;
    };

    const patientName = sale.patient
      ? `${sale.patient.firstName} ${sale.patient.lastName}`
      : selectedPatient
        ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
        : 'Walk-in';

    const itemsHtml = (sale.items || []).map((item) => `
      <div class="row" style="margin-bottom: 2px;">
        <span class="label" style="flex: 1;">${item.product_name}</span>
      </div>
      <div class="row" style="margin-bottom: 4px;">
        <span class="value" style="width: 30px; text-align: center;">${item.quantity}</span>
        <span class="value" style="flex: 1; text-align: right;">${Number(item.unit_price).toFixed(2)}</span>
        <span class="value" style="width: 60px; text-align: right;">${calculateItemTotal(item).toFixed(2)}</span>
      </div>
    `).join('');

    // Use a safe access for logo, assuming orgSettings might have logo_url (snake_case from DB) or logoUrl (camelCase if transformed)
    // Based on schema it is logo_url.
    const logoUrl = (orgSettings as any)?.logo_url || (orgSettings as any)?.logoUrl || '';

    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${sale.receipt_no}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 80mm; margin: 0 !important; padding: 0 !important; }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 13px;
            line-height: 1.4;
            color: #000;
          }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 2px; margin-bottom: 4px; padding-top: 0 !important; margin-top: 0 !important; }
          .logo { margin-bottom: 4px; margin-top: 0 !important; }
          .logo img { max-width: 100px; max-height: 60px; object-fit: contain; }
          .org-name { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; margin-top: 0 !important; }
          .subtitle { font-size: 11px; font-weight: normal; }
          .divider { border-top: 1px dashed #000; margin: 4px 0; }
          .row { display: flex; justify-content: space-between; }
          .label { font-size: 12px; font-weight: bold; text-align: left; }
          .value { font-size: 12px; font-weight: bold; text-align: right; }
          .center { text-align: center; }
          .enc-num { font-size: 14px; font-weight: 900; text-align: center; margin: 4px 0; }
          .footer { text-align: center; font-size: 11px; font-weight: bold; margin-top: 8px; border-top: 1px dashed #000; padding-top: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="Logo" /></div>` : ''}
          <div class="org-name">${orgSettings?.organisation_name || 'MEDICAL CENTRE'}</div>
          <div class="subtitle">${orgSettings?.address || ''}</div>
          <div class="subtitle">TEL: ${orgSettings?.phone || ''}</div>
          <div class="subtitle">${orgSettings?.email || ''}</div>
        </div>

        <div class="center" style="margin: 6px 0;">
          <div style="font-size: 15px; font-weight: 900; text-transform: uppercase; border: 1px solid #000; display: inline-block; padding: 2px 6px;">Cash Receipt</div>
        </div>

        <div class="row">
          <span class="label">Date:</span>
          <span class="value">${new Date(sale.created_at).toLocaleDateString()} ${new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="row">
          <span class="label">Receipt #:</span>
          <span class="value">${sale.receipt_no}</span>
        </div>
        <div class="row">
          <span class="label">Patient:</span>
          <span class="value" style="text-transform: uppercase;">${patientName}</span>
        </div>

        <div class="divider"></div>

        <div class="row" style="font-weight: 900; border-bottom: 1px dashed #000; padding-bottom: 2px; margin-bottom: 2px;">
          <span style="width: 30px; text-align: center;">Qty</span>
          <span style="flex: 1; text-align: left;">Item</span>
          <span style="width: 60px; text-align: right;">Total</span>
        </div>

        ${itemsHtml}

        <div class="divider"></div>

        <div class="row">
          <span class="label">Subtotal:</span>
          <span class="value">${Number(sale.subtotal).toFixed(2)}</span>
        </div>
        ${Number(sale.discount_total) > 0 ? `
        <div class="row">
          <span class="label">Discount:</span>
          <span class="value">-${Number(sale.discount_total).toFixed(2)}</span>
        </div>` : ''}
        
        <div class="row" style="margin-top: 4px; font-size: 16px;">
          <span class="label" style="font-size: 16px; font-weight: 900;">TOTAL:</span>
          <span class="value" style="font-size: 16px; font-weight: 900;">KES ${Number(sale.total_amount).toFixed(2)}</span>
        </div>

        <div class="divider"></div>

        <div class="row">
          <span class="label">Method:</span>
          <span class="value">${sale.payment_method}</span>
        </div>
        ${sale.payment_method === 'Cash' && sale.amount_tendered != null ? `
        <div class="row">
          <span class="label">Tendered:</span>
          <span class="value">${Number(sale.amount_tendered).toFixed(2)}</span>
        </div>
        <div class="row">
          <span class="label">Change:</span>
          <span class="value">${Number(sale.change_due).toFixed(2)}</span>
        </div>` : ''}

        <div class="footer">
          <p>*** THANK YOU ***</p>
          <p style="margin-top: 4px; font-size: 10px;">Served by: ${orgSettings?.email || 'System'}</p>
        </div>

        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
  };

  return (
    <div className="flex h-full bg-gray-50 font-sans text-gray-900 overflow-hidden rounded-xl border border-gray-200 shadow-sm">


      {/* LEFT PANEL: PRODUCT CATALOG */}
      <div className="flex-[3] flex flex-col border-r border-gray-200 bg-white min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-1">
            Billing & POS
          </h1>
          <p className="text-sm text-gray-400">Select items to add to the bill</p>

          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Product Table */}
        <div className="flex-1 overflow-y-auto">
          {loadingProducts ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const isExpired = product.expiryDate ? new Date(product.expiryDate) < new Date() : false;
                  const isLowStock = product.availableUnits < 10;
                  return (
                    <tr key={product.id} className={`hover:bg-blue-50/40 transition-colors ${isExpired ? 'bg-red-50/40' : ''}`}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs ${isExpired ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            <Briefcase size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]" title={product.name}>{product.name}</p>
                            {product.sku && <p className="text-[10px] text-gray-400">SKU: {product.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-700">{product.category}</span>
                      </td>
                      <td className="px-4 py-2.5 text-sm">
                        <span className={isLowStock ? 'text-orange-600 font-bold' : 'text-gray-600'}>{product.availableUnits}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs">
                        {product.expiryDate ? (
                          <span className={isExpired ? 'text-red-600 font-bold bg-red-100 px-1.5 py-0.5 rounded' : 'text-green-600'}>
                            {new Date(product.expiryDate).toLocaleDateString()} {isExpired && 'ΓÜá EXPIRED'}
                          </span>
                        ) : <span className="text-gray-400">N/A</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-bold text-gray-900">KES {product.sellingPrice.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => {
                            if (isExpired) { toast.error("Cannot add expired product!"); return; }
                            if (product.availableUnits <= 0) { toast.error("Out of stock!"); return; }
                            addToCart(product);
                          }}
                          disabled={isExpired || product.availableUnits <= 0}
                          className={`p-1.5 rounded-full transition-colors ${isExpired || product.availableUnits <= 0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                        >
                          <Plus size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: CART & CHECKOUT */}
      <div className="w-[380px] bg-white flex flex-col shadow-xl z-10 flex-none">
        {/* Patient Selection */}
        <div className="p-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
              <User size={16} className="text-blue-500" />
              Patient Details
            </h2>
            <button
              onClick={() => setShowPatientModal(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
            >
              {selectedPatient ? 'Change' : 'Select Patient'}
            </button>
          </div>

          {selectedPatient ? (
            <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 mb-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Smartphone size={10} /> {selectedPatient.phone || 'N/A'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{selectedPatient.gender} ΓÇó {selectedPatient.dob ? new Date(selectedPatient.dob).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <CheckCircle size={14} />
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setShowPatientModal(true)}
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-blue-300 hover:bg-gray-50 transition-all mb-2"
            >
              <User size={20} className="mb-1 opacity-50" />
              <p className="text-xs font-medium">No Patient Selected</p>
            </div>
          )}

          {/* Encounter Selection */}
          {selectedPatient && (
            <div className="mt-2">
              <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Link to Encounter (Optional)</label>
              <div className="relative">
                <select
                  className="w-full bg-white border border-gray-200 rounded-lg py-1.5 pl-3 pr-8 text-xs focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  onChange={(e) => {
                    const enc = encounters.find(en => en.id === Number(e.target.value));
                    setSelectedEncounter(enc || null);
                  }}
                  value={selectedEncounter?.id || ''}
                >
                  <option value="">-- No Encounter (Direct Sale) --</option>
                  {encounters.map(enc => (
                    <option key={enc.id} value={enc.id}>
                      {new Date(enc.createdAt).toLocaleDateString()} {new Date(enc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {enc.encounter_type}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2 text-gray-400 pointer-events-none" size={12} />
              </div>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-gray-50/30">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart size={48} className="opacity-20 mb-4" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <motion.div
                key={item.cartId}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                  x{item.quantity}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{item.product.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-blue-600 font-semibold">KES {item.product.sellingPrice}</p>

                    {/* Tax & Discount Inputs */}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="Tax%"
                        className="w-12 px-1 py-0.5 text-[10px] border border-gray-200 rounded bg-gray-50 focus:ring-1 focus:ring-blue-500 outline-none"
                        value={item.taxRate || ''}
                        onChange={(e) => updateCartItem(item.cartId, 'taxRate', Number(e.target.value))}
                        title="Tax Percentage"
                      />
                      <input
                        type="number"
                        placeholder="Disc"
                        className="w-14 px-1 py-0.5 text-[10px] border border-gray-200 rounded bg-gray-50 focus:ring-1 focus:ring-blue-500 outline-none"
                        value={item.discountAmount || ''}
                        onChange={(e) => updateCartItem(item.cartId, 'discountAmount', Number(e.target.value))}
                        title="Discount Amount"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.cartId, -1)} className="w-6 h-6 rounded bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600">-</button>
                  <button onClick={() => updateQuantity(item.cartId, 1)} className="w-6 h-6 rounded bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600">+</button>
                  <button onClick={() => removeFromCart(item.cartId)} className="w-6 h-6 rounded bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer Totals */}
        <div className="p-3 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] flex-none">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-gray-500 text-xs">Subtotal</span>
            <span className="font-semibold text-gray-900 text-xs">KES {cartTotals.subtotal.toFixed(2)}</span>
          </div>
          {cartTotals.discount > 0 && (
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-gray-500 text-xs">Discount</span>
              <span className="font-semibold text-green-600 text-xs">- KES {cartTotals.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-500 text-xs">Tax</span>
            <span className="font-semibold text-gray-900 text-xs">KES {cartTotals.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2 text-base">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-blue-600">KES {cartTotals.total.toFixed(2)}</span>
          </div>

          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0 || !selectedPatient}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            <CreditCard size={18} />
            Complete Payment
          </button>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Patient Search Modal */}
      <Modal isOpen={showPatientModal} onClose={() => setShowPatientModal(false)} title="Select Patient">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            autoFocus
            type="text"
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchPatientQuery}
            onChange={(e) => setSearchPatientQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          {patients.length > 0 ? (
            patients.map(patient => (
              <div
                key={patient.id}
                onClick={() => { setSelectedPatient(patient); setShowPatientModal(false); toast.success('Patient selected'); }}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-blue-200 group-hover:text-blue-700">
                    <User size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{patient.firstName} {patient.lastName}</h4>
                    <p className="text-xs text-gray-500">{patient.gender} ΓÇó {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-400 mb-1">Phone</p>
                  <p className="text-sm font-medium text-gray-700">{patient.phone || 'N/A'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400">
              {searchPatientQuery ? 'No patients found' : 'Type to search...'}
            </div>
          )}
        </div>
      </Modal>

      {/* Modern Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Complete Payment">
        <div className="flex flex-col h-full">
          {/* Amount Display */}
          <div className="bg-gray-900 text-white p-6 rounded-2xl text-center mb-6 shadow-lg">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Total Amount Due</p>
            <h2 className="text-5xl font-bold">KES {cartTotals.total.toFixed(2)}</h2>
          </div>

          {/* Payment Method Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => setPaymentMethod('Cash')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${paymentMethod === 'Cash' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Banknote size={18} /> Cash
            </button>
            <button
              onClick={() => setPaymentMethod('Paybill')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${paymentMethod === 'Paybill' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Smartphone size={18} /> M-Pesa Paybill
            </button>
          </div>

          {/* Payment Details */}
          <div className="flex-1 space-y-4">
            {paymentMethod === 'Cash' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Tendered</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400 font-bold">KES</span>
                    <input
                      type="number"
                      autoFocus
                      className="w-full pl-14 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none text-xl font-bold text-gray-900 transition-colors"
                      placeholder="0.00"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>
                </div>

                {/* Change Calculation */}
                <div className={`p-4 rounded-xl border ${amountTendered && Number(amountTendered) >= cartTotals.total
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
                  } transition-colors`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${amountTendered && Number(amountTendered) >= cartTotals.total ? 'text-green-700' : 'text-red-700'}`}>Change Due</span>
                    <span className={`text-2xl font-bold ${amountTendered && Number(amountTendered) >= cartTotals.total ? 'text-green-700' : 'text-red-700'}`}>
                      KES {Math.max(0, (amountTendered ? Number(amountTendered) - cartTotals.total : 0)).toFixed(2)}
                    </span>
                  </div>
                  {amountTendered && Number(amountTendered) < cartTotals.total && (
                    <p className="text-xs text-red-500 mt-1 font-medium">Insufficient amount!</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <Smartphone size={32} />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">M-Pesa Paybill</h4>
                <p className="text-gray-500 text-sm mb-4">Please instruct the patient to pay via M-Pesa.</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 inline-block text-left">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Paybill Number</p>
                  <p className="text-lg font-mono font-bold text-gray-900">247247</p>
                  <div className="h-px bg-gray-200 my-2"></div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Account Number</p>
                  <p className="text-lg font-mono font-bold text-gray-900">HMS-{String(cartTotals.total).replace('.', '')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessPayment}
              disabled={paymentMethod === 'Cash' && (!amountTendered || Number(amountTendered) < cartTotals.total)}
              className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              Confirm Payment
            </button>
          </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Payment Success">
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Completed!</h3>
          <p className="text-gray-500 mb-6 text-center">The transaction has been recorded successfully.</p>

          {/* Receipt Preview - Simplified Summary */}
          {lastSale && (
            <div className="bg-gray-50 p-4 rounded-xl w-full mb-6 border border-gray-200 text-center">
              <p className="font-bold text-lg mb-1">{lastSale.receipt_no}</p>
              <p className="text-gray-600 mb-4">Total: KES {Number(lastSale.total_amount).toFixed(2)}</p>

              <button
                onClick={() => handlePrintReceipt(lastSale)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={20} />
                Print Receipt
              </button>
            </div>
          )}

          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setShowReceiptModal(false);
                setLastSale(null);
                setAmountTendered('');
                setCart([]);
              }}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Close & New Sale
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
