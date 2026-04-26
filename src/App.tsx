import { useState, useMemo, useEffect, ReactNode } from 'react';
import { 
  BarChart3, 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown,
  LayoutDashboard,
  Box,
  Settings,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { Product, ProductStatus, InventoryStats } from './types';
import { MOCK_PRODUCTS, CATEGORIES } from './constants';
import { cn } from './lib/utils';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('inventory_products');
    return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('inventory_products', JSON.stringify(products));
  }, [products]);

  // Derived stats
  const stats = useMemo<InventoryStats>(() => {
    return {
      totalProducts: products.length,
      totalValue: products.reduce((acc, p) => acc + p.price * p.quantity, 0),
      lowStockItems: products.filter(p => p.quantity > 0 && p.quantity <= p.minQuantity).length,
      outOfStockItems: products.filter(p => p.quantity === 0).length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  const handleAddProduct = (product: Product) => {
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? product : p));
    } else {
      setProducts(prev => [...prev, { ...product, id: Math.random().toString(36).substr(2, 9), lastUpdated: new Date().toISOString() }]);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="bg-[#F3F4F6] text-slate-900 w-full min-h-screen flex flex-col font-sans overflow-hidden">
      {/* Header Navigation */}
      <nav className="h-16 px-8 flex items-center justify-between bg-white border-b border-slate-200 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">StockStream</span>
        </div>
        <div className="flex-1 max-w-md mx-12">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search inventory, SKU, or supplier..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-full py-2 px-10 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
            <div className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              <Search className="w-4 h-4" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                activeTab === 'dashboard' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              DASHBOARD
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                activeTab === 'inventory' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              STOCK
            </button>
          </nav>
          <div className="flex items-center gap-4 border-l border-slate-200 pl-6 text-right">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-800">Warehouse Alpha</span>
              <span className="text-[10px] text-green-600 font-black uppercase tracking-tighter flex items-center gap-1">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                Live Sync
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-600 shadow-inner">
              SJ
            </div>
          </div>
        </div>
      </nav>

      {/* Main Bento Grid */}
      <main className="flex-1 p-6 grid grid-cols-12 auto-rows-min gap-4 overflow-y-auto overflow-x-hidden content-start">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div 
              key="dash"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="col-span-12 grid grid-cols-12 auto-rows-min gap-4"
            >
              {/* Main Summary Panel */}
              <div className="col-span-8 row-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <Box className="w-4 h-4 text-indigo-600" />
                    High-Value Stock Distribution
                  </h2>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 mr-4 text-[10px] font-bold text-slate-400 uppercase">
                      <ArrowUpDown className="w-3 h-3" />
                      Sorted by valuation
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                   <div className="p-4 space-y-3">
                     {products
                        .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
                        .slice(0, 6)
                        .map((p, i) => (
                          <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl group hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                             <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                                   0{i+1}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-800">{p.name}</span>
                                  <span className="text-[10px] font-mono text-slate-400 uppercase">{p.sku}</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-12">
                                <div className="text-right">
                                   <div className="text-sm font-black text-slate-800">${(p.price * p.quantity).toLocaleString()}</div>
                                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Inventory Valuation</div>
                                </div>
                                <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                   <div 
                                     className="h-full bg-indigo-600 transition-all" 
                                     style={{ width: `${Math.min(100, (p.quantity / (p.minQuantity * 5)) * 100)}%` }} 
                                   />
                                </div>
                             </div>
                          </div>
                      ))}
                   </div>
                </div>
              </div>

              {/* Critical Alerts Card */}
              <div className="col-span-4 row-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Critical Alerts
                  </h2>
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase">
                    {stats.lowStockItems + stats.outOfStockItems} Action Items
                  </span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {products.filter(p => p.quantity <= p.minQuantity).length > 0 ? (
                    products.filter(p => p.quantity <= p.minQuantity).slice(0, 4).map(p => (
                      <div key={p.id} className={cn(
                        "p-3 border-l-4 rounded-r-lg transition-all",
                        p.quantity === 0 ? "bg-red-50 border-red-500" : "bg-amber-50 border-amber-500"
                      )}>
                        <p className={cn("text-xs font-bold", p.quantity === 0 ? "text-red-800" : "text-amber-800")}>
                          {p.quantity === 0 ? 'Out of Stock' : 'Low Stock'}: {p.name}
                        </p>
                        <p className={cn("text-[10px] mt-0.5", p.quantity === 0 ? "text-red-600" : "text-amber-600")}>
                          {p.quantity} units remaining. Threshold is {p.minQuantity}. Reorder from {p.supplier}.
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-8">
                       <Sparkles className="w-8 h-8 mb-2" />
                       <p className="text-xs font-bold uppercase tracking-widest">No alerts</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="col-span-2 row-span-1 bg-indigo-600 rounded-2xl p-5 text-white flex flex-col justify-center shadow-lg shadow-indigo-200">
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1">Portfolio Value</p>
                <p className="text-2xl font-black">${(stats.totalValue / 1000).toFixed(1)}k</p>
              </div>

              <div className="col-span-2 row-span-1 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-center shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Active SKUs</p>
                <p className="text-2xl font-black text-slate-800">{stats.totalProducts}</p>
              </div>

              {/* Space Visualization */}
              <div className="col-span-4 row-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
                <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                  Warehouse Load
                </h2>
                <div className="space-y-4">
                  <LoadBar label="ZONE A (ELECTRONICS)" progress={78} color="bg-indigo-500" />
                  <LoadBar label="ZONE B (HARDWARE)" progress={42} color="bg-indigo-300" />
                  <LoadBar label="OVERFLOW STORAGE" progress={15} color="bg-blue-400" />
                </div>
              </div>

              {/* Activity Log */}
              <div className="col-span-8 row-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-800">Movement Log</h2>
                  <a href="#" className="text-xs text-indigo-600 font-bold hover:underline">View full history &rarr;</a>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ActivityItem type="receive" label="Batch Received" meta="Hardware components • 2h ago" />
                  <ActivityItem type="dispatch" label="Internal Dispatch" meta="Case G9 (x2) • 4h ago" />
                  <ActivityItem type="adjust" label="Cycle Count Adj." meta="SSD 1TB (+5) • 8h ago" />
                  <ActivityItem type="receive" label="Smart Reorder" meta="Thermal Paste • Yesterday" />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="inv"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="col-span-12 flex flex-col gap-4"
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[70vh]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <h2 className="font-bold text-slate-800">Inventory Catalog</h2>
                    <select 
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-white border border-slate-200 py-1.5 px-3 rounded-lg text-xs font-bold outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <option value="All">All Categories</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
                      <ArrowUpDown className="w-3 h-3" /> Export
                    </button>
                    <button 
                      onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                      className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md shadow-indigo-100"
                    >
                      <Plus className="w-3 h-3" /> New Item
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-400 font-black border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-4">SKU / Entity</th>
                        <th className="px-8 py-4">Category</th>
                        <th className="px-8 py-4">Quantity</th>
                        <th className="px-8 py-4">Price</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredProducts.map(p => (
                        <tr key={p.id} className="group hover:bg-slate-50/80 transition-colors">
                          <td className="px-8 py-5">
                            <div className="font-black text-slate-800">{p.name}</div>
                            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{p.sku}</div>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-tight">{p.category}</span>
                          </td>
                          <td className="px-8 py-5 font-black text-slate-800">
                            {p.quantity.toLocaleString()}
                          </td>
                          <td className="px-8 py-5 font-mono text-xs text-slate-500">
                            ${p.price.toFixed(2)}
                          </td>
                          <td className="px-8 py-5">
                            <BentoStatusBadge quantity={p.quantity} minQuantity={p.minQuantity} />
                          </td>
                          <td className="px-8 py-5 text-right">
                             <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => { setEditingProduct(p); setIsModalOpen(true); }}
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredProducts.length === 0 && (
                     <div className="p-24 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Search className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No matching records found</p>
                     </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Utility Bar */}
      <footer className="h-10 px-8 flex items-center justify-between bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-widest shrink-0">
        <div className="flex gap-6 items-center">
          <span className="flex items-center gap-2">
             <div className="w-1 h-1 bg-green-500 rounded-full" />
             Session: Live
          </span>
          <span className="text-slate-500">Database: Optimized</span>
        </div>
        <div>
          &copy; 2026 STOCKSTREAM SOLUTIONS INC. v2.8.4
        </div>
      </footer>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
        onSubmit={handleAddProduct}
        product={editingProduct}
      />
    </div>
  );
}

function LoadBar({ label, progress, color }: { label: string, progress: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-black mb-1.5 text-slate-400">
        <span>{label}</span>
        <span className="text-slate-800">{progress}%</span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={cn("h-full rounded-full shadow-sm", color)}
        />
      </div>
    </div>
  );
}

function ActivityItem({ type, label, meta }: { type: 'receive' | 'dispatch' | 'adjust', label: string, meta: string }) {
  const icon = type === 'receive' ? '+' : type === 'dispatch' ? '−' : '≈';
  const color = type === 'receive' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500';
  
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs", color)}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-800">{label}</p>
        <p className="text-[10px] text-slate-500 font-medium">{meta}</p>
      </div>
    </div>
  );
}

function BentoStatusBadge({ quantity, minQuantity }: { quantity: number, minQuantity: number }) {
  if (quantity === 0) return (
    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-red-200">OUT OF STOCK</span>
  );
  if (quantity <= minQuantity) return (
    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-amber-200">LOW STOCK</span>
  );
  return (
    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-green-200">IN STOCK</span>
  );
}

function ProductModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  product 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSubmit: (p: Product) => void,
  product: Product | null
}) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: CATEGORIES[0],
    quantity: 0,
    minQuantity: 5,
    price: 0,
    supplier: '',
    notes: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDescription = async () => {
    if (!formData.name) return;
    setIsGenerating(true);
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a 2-sentence professional inventory description for a product named "${formData.name}" in the "${formData.category}" category.`,
      });
      setFormData(prev => ({ ...prev, notes: response.text }));
    } catch (error) {
      console.error('Failed to generate description', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        name: '',
        sku: '',
        category: CATEGORIES[0],
        quantity: 0,
        minQuantity: 5,
        price: 0,
        supplier: '',
        notes: '',
      });
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200 p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-800">{product ? 'Modify Record' : 'Registry Entry'}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Central Warehouse Management</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form className="space-y-6" onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            ...formData,
            id: product?.id || Math.random().toString(),
            lastUpdated: new Date().toISOString(),
          } as Product);
        }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Product Name</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">SKU</label>
              <input 
                required
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Category</label>
              <select 
                required
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-all"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Stock Qty</label>
              <input 
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Min Level</label>
              <input 
                type="number"
                required
                min="1"
                value={formData.minQuantity}
                onChange={e => setFormData({...formData, minQuantity: parseInt(e.target.value) || 1})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Unit Price ($)</label>
              <input 
                type="number"
                step="0.01"
                required
                min="0"
                value={formData.price}
                onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Supplier</label>
              <input 
                required
                value={formData.supplier}
                onChange={e => setFormData({...formData, supplier: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Description</label>
                <button 
                  type="button"
                  onClick={generateDescription}
                  disabled={!formData.name || isGenerating}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 disabled:opacity-30 transition-all"
                >
                  {isGenerating ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                  AI Generate
                </button>
              </div>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs focus:ring-2 focus:ring-indigo-500 outline-none min-h-[60px] resize-none font-medium leading-relaxed italic text-slate-600"
                placeholder="Product attributes or SKU notes..."
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-8 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              {product ? 'Commit Changes' : 'Register Item'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
