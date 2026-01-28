import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, LogOut, Plus, Edit2, Trash2, 
  DollarSign, TrendingUp, Clock, CheckCircle, ChevronDown, ChevronUp,
  Save, X, Eye, EyeOff
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Product form state
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [isAdmin, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/products?available_only=false`),
        axios.get(`${API}/orders`)
      ]);
      setStats(statsRes.data);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    
    try {
      await axios.delete(`${API}/products/${productId}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      await axios.put(`${API}/products/${product.id}`, {
        is_available: !product.is_available
      });
      fetchData();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`);
      fetchData();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'escandallos', label: 'Escandallos', icon: DollarSign }
  ];

  const statusColors = {
    pending: 'bg-amber-900/30 text-amber-400',
    paid: 'bg-emerald-900/30 text-emerald-400',
    preparing: 'bg-blue-900/30 text-blue-400',
    ready: 'bg-purple-900/30 text-purple-400',
    completed: 'bg-zinc-700 text-zinc-300',
    cancelled: 'bg-red-900/30 text-red-400'
  };

  const statusLabels = {
    pending: 'Pendiente',
    paid: 'Pagado',
    preparing: 'Preparando',
    ready: 'Listo',
    completed: 'Completado',
    cancelled: 'Cancelado'
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-['Playfair_Display'] text-3xl font-bold text-white">
              Panel de Administración
            </h1>
            <p className="text-zinc-500 mt-1">Gestiona tu tienda En Tu Sano Juicio</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors"
            data-testid="logout-button"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#C08040] text-black'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#C08040] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#121212] border border-white/5 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-zinc-500 text-sm">Productos</span>
                      <Package className="w-5 h-5 text-[#C08040]" />
                    </div>
                    <p className="font-['JetBrains_Mono'] text-3xl font-bold text-white">
                      {stats.total_products}
                    </p>
                  </div>
                  
                  <div className="bg-[#121212] border border-white/5 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-zinc-500 text-sm">Pedidos Totales</span>
                      <ShoppingCart className="w-5 h-5 text-[#C08040]" />
                    </div>
                    <p className="font-['JetBrains_Mono'] text-3xl font-bold text-white">
                      {stats.total_orders}
                    </p>
                  </div>
                  
                  <div className="bg-[#121212] border border-white/5 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-zinc-500 text-sm">Pedidos Pendientes</span>
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="font-['JetBrains_Mono'] text-3xl font-bold text-amber-400">
                      {stats.pending_orders}
                    </p>
                  </div>
                  
                  <div className="bg-[#121212] border border-white/5 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-zinc-500 text-sm">Ingresos Totales</span>
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="font-['JetBrains_Mono'] text-3xl font-bold text-emerald-400">
                      {stats.total_revenue.toFixed(2)}€
                    </p>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-[#121212] border border-white/5 p-6">
                  <h3 className="font-['Playfair_Display'] text-xl font-semibold text-white mb-4">
                    Pedidos Recientes
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider">
                          <th className="pb-3">Cliente</th>
                          <th className="pb-3">Total</th>
                          <th className="pb-3">Recogida</th>
                          <th className="pb-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {orders.slice(0, 5).map(order => (
                          <tr key={order.id}>
                            <td className="py-3 text-white">{order.customer_name}</td>
                            <td className="py-3 font-['JetBrains_Mono'] text-[#C08040]">
                              {order.total.toFixed(2)}€
                            </td>
                            <td className="py-3 text-zinc-400">{order.pickup_time}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 text-xs font-medium ${statusColors[order.status]}`}>
                                {statusLabels[order.status]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Gestión de Productos</h3>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setShowProductForm(true);
                    }}
                    className="flex items-center space-x-2 bg-[#C08040] text-black px-4 py-2 font-medium hover:bg-[#D4A060] transition-colors"
                    data-testid="add-product-button"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir Producto</span>
                  </button>
                </div>

                <div className="grid gap-4">
                  {products.map(product => (
                    <div
                      key={product.id}
                      className="bg-[#121212] border border-white/5 p-4"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-20 h-20 object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-white truncate">{product.name}</h4>
                            {!product.is_available && (
                              <span className="px-2 py-0.5 text-xs bg-red-900/30 text-red-400">
                                No disponible
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-500 truncate">{product.description}</p>
                          <p className="font-['JetBrains_Mono'] text-[#C08040] mt-1">
                            {product.price.toFixed(2)}€
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleAvailability(product)}
                            className={`p-2 transition-colors ${
                              product.is_available 
                                ? 'text-emerald-400 hover:text-emerald-300' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                            title={product.is_available ? 'Desactivar' : 'Activar'}
                          >
                            {product.is_available ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setShowProductForm(true);
                            }}
                            className="p-2 text-zinc-400 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-zinc-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Product Form Modal */}
                {showProductForm && (
                  <ProductForm
                    product={editingProduct}
                    onClose={() => setShowProductForm(false)}
                    onSave={() => {
                      setShowProductForm(false);
                      fetchData();
                    }}
                  />
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Gestión de Pedidos</h3>
                
                {orders.length === 0 ? (
                  <div className="text-center py-12 bg-[#121212] border border-white/5">
                    <ShoppingCart className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500">No hay pedidos todavía</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div
                        key={order.id}
                        className="bg-[#121212] border border-white/5 p-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-white">{order.customer_name}</h4>
                              <span className={`px-2 py-0.5 text-xs font-medium ${statusColors[order.status]}`}>
                                {statusLabels[order.status]}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-500">{order.customer_email} · {order.customer_phone}</p>
                            <p className="text-sm text-zinc-400 mt-1">
                              Recogida: <span className="text-white">{order.pickup_time}</span>
                            </p>
                            <p className="font-['JetBrains_Mono'] text-[#C08040] mt-2">
                              Total: {order.total.toFixed(2)}€
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {['pending', 'paid', 'preparing', 'ready', 'completed'].map(status => (
                              <button
                                key={status}
                                onClick={() => handleUpdateOrderStatus(order.id, status)}
                                disabled={order.status === status}
                                className={`px-3 py-1 text-xs font-medium transition-colors ${
                                  order.status === status
                                    ? 'bg-[#C08040] text-black'
                                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                {statusLabels[status]}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Order Items */}
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Productos:</p>
                          <div className="flex flex-wrap gap-2">
                            {order.items.map((item, idx) => (
                              <span key={idx} className="text-sm text-zinc-300">
                                {item.product_name} x{item.quantity}
                                {idx < order.items.length - 1 && ','}
                              </span>
                            ))}
                          </div>
                          {order.notes && (
                            <p className="text-sm text-zinc-500 mt-2">
                              Notas: <span className="text-zinc-400">{order.notes}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Escandallos Tab */}
            {activeTab === 'escandallos' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Escandallos de Productos</h3>
                <p className="text-zinc-500 text-sm">
                  Detalle de costes e ingredientes de cada producto. Haz clic para expandir.
                </p>
                
                <div className="space-y-4">
                  {products.map(product => (
                    <div
                      key={product.id}
                      className="bg-[#121212] border border-white/5"
                    >
                      <button
                        onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                        className="w-full p-4 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-white">{product.name}</h4>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-zinc-500">
                                PVP: <span className="font-['JetBrains_Mono'] text-[#C08040]">{product.price.toFixed(2)}€</span>
                              </span>
                              <span className="text-sm text-zinc-500">
                                Food Cost: <span className="font-['JetBrains_Mono'] text-emerald-400">{product.food_cost.toFixed(2)}€</span>
                              </span>
                              <span className="text-sm text-zinc-500">
                                Margen: <span className="font-['JetBrains_Mono'] text-white">
                                  {((1 - product.food_cost / product.price) * 100).toFixed(1)}%
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                        {expandedProduct === product.id ? (
                          <ChevronUp className="w-5 h-5 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-zinc-400" />
                        )}
                      </button>
                      
                      {expandedProduct === product.id && (
                        <div className="px-4 pb-4 border-t border-white/5">
                          <table className="w-full mt-4">
                            <thead>
                              <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider">
                                <th className="pb-2">Ingrediente</th>
                                <th className="pb-2 text-right">Cantidad</th>
                                <th className="pb-2 text-right">Coste Unit.</th>
                                <th className="pb-2 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {product.ingredients.map((ing, idx) => (
                                <tr key={idx}>
                                  <td className="py-2 text-white">{ing.name}</td>
                                  <td className="py-2 text-right text-zinc-400 font-['JetBrains_Mono']">
                                    {ing.quantity} {ing.unit}
                                  </td>
                                  <td className="py-2 text-right text-zinc-400 font-['JetBrains_Mono']">
                                    {ing.unit_cost.toFixed(4)}€
                                  </td>
                                  <td className="py-2 text-right text-white font-['JetBrains_Mono']">
                                    {ing.total_cost.toFixed(4)}€
                                  </td>
                                </tr>
                              ))}
                              <tr className="font-semibold">
                                <td colSpan="3" className="pt-3 text-zinc-400">TOTAL FOOD COST</td>
                                <td className="pt-3 text-right text-emerald-400 font-['JetBrains_Mono']">
                                  {product.food_cost.toFixed(2)}€
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Product Form Component
const ProductForm = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || 'bowls',
    price: product?.price || '',
    image_url: product?.image_url || '',
    food_cost: product?.food_cost || 0,
    is_available: product?.is_available ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        food_cost: parseFloat(formData.food_cost) || 0
      };

      if (product) {
        await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/products/${product.id}`, data);
      } else {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/products`, data);
      }
      onSave();
    } catch (err) {
      setError('Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-white/5 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="font-['Playfair_Display'] text-xl font-semibold text-white">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h3>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-[#171717] border border-white/10 focus:border-[#C08040] text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Descripción *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-[#171717] border border-white/10 focus:border-[#C08040] text-white resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Categoría *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-[#171717] border border-white/10 focus:border-[#C08040] text-white"
              >
                <option value="bowls">Bowls</option>
                <option value="ensaladas">Ensaladas</option>
                <option value="wraps">Wraps</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Precio (€) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 bg-[#171717] border border-white/10 focus:border-[#C08040] text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">URL de Imagen *</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-4 py-3 bg-[#171717] border border-white/10 focus:border-[#C08040] text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Food Cost (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.food_cost}
              onChange={(e) => setFormData({ ...formData, food_cost: e.target.value })}
              className="w-full px-4 py-3 bg-[#171717] border border-white/10 focus:border-[#C08040] text-white"
            />
          </div>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="w-5 h-5 rounded border-white/10 bg-[#171717] text-[#C08040]"
            />
            <span className="text-sm text-zinc-400">Disponible en el menú</span>
          </label>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 bg-[#C08040] text-black py-3 font-semibold hover:bg-[#D4A060] transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
