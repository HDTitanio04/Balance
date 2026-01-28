import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, ShoppingBag, ArrowLeft, Clock, User, Mail, Phone, FileText } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    pickup_time: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(searchParams.get('order_id') || '');
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  // Generate pickup time options (next 2 hours in 15-min intervals)
  const generateTimeOptions = () => {
    const options = [];
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15 + 30);
    
    for (let i = 0; i < 8; i++) {
      const time = new Date(now.getTime() + i * 15 * 60000);
      const hours = time.getHours().toString().padStart(2, '0');
      const mins = time.getMinutes().toString().padStart(2, '0');
      options.push(`${hours}:${mins}`);
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    if (items.length === 0 && !orderId) {
      navigate('/menu');
    }
  }, [items, orderId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.customer_name.trim()) return 'Por favor, introduce tu nombre';
    if (!formData.customer_email.trim()) return 'Por favor, introduce tu email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) return 'Email inválido';
    if (!formData.customer_phone.trim()) return 'Por favor, introduce tu teléfono';
    if (!formData.pickup_time) return 'Por favor, selecciona la hora de recogida';
    return '';
  };

  const createOrder = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return null;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          quantity: item.quantity
        })),
        ...formData
      };

      const response = await axios.post(`${API}/orders`, orderData);
      setOrderId(response.data.id);
      return response.data.id;
    } catch (err) {
      setError('Error al crear el pedido. Por favor, inténtalo de nuevo.');
      console.error('Order error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleStripePayment = async () => {
    let currentOrderId = orderId;
    
    if (!currentOrderId) {
      currentOrderId = await createOrder();
      if (!currentOrderId) return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/checkout/stripe`, {
        order_id: currentOrderId,
        origin_url: window.location.origin,
        payment_method: 'stripe'
      });

      if (response.data.url) {
        clearCart();
        window.location.href = response.data.url;
      }
    } catch (err) {
      setError('Error al procesar el pago. Por favor, inténtalo de nuevo.');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalApprove = async (data, actions) => {
    // For demo purposes, we'll simulate PayPal success
    clearCart();
    navigate('/payment-success?method=paypal');
  };

  if (items.length === 0 && !orderId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20" data-testid="checkout-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <button
          onClick={() => navigate('/menu')}
          className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al menú</span>
        </button>

        <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold text-white mb-8">
          Finalizar Pedido
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <div className="bg-[#121212] border border-white/5 p-6">
              <h2 className="font-['Playfair_Display'] text-xl font-semibold text-white mb-6 flex items-center">
                <User className="w-5 h-5 mr-3 text-[#C08040]" />
                Datos de contacto
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Nombre completo *</label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    placeholder="Tu nombre"
                    className="w-full px-4 py-3 bg-[#171717] border border-white/10 focus:border-[#C08040] text-white"
                    data-testid="input-name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="customer_email"
                    value={formData.customer_email}
                    onChange={handleInputChange}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 bg-[#171717] border border-white/10 focus:border-[#C08040] text-white"
                    data-testid="input-email"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    placeholder="+34 XXX XXX XXX"
                    className="w-full px-4 py-3 bg-[#171717] border border-white/10 focus:border-[#C08040] text-white"
                    data-testid="input-phone"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Hora de recogida *
                  </label>
                  <select
                    name="pickup_time"
                    value={formData.pickup_time}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#171717] border border-white/10 focus:border-[#C08040] text-white"
                    data-testid="input-time"
                  >
                    <option value="">Selecciona una hora</option>
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Notas adicionales
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Alergias, preferencias..."
                    rows={3}
                    className="w-full px-4 py-3 bg-[#171717] border border-white/10 focus:border-[#C08040] text-white resize-none"
                    data-testid="input-notes"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-[#121212] border border-white/5 p-6">
              <h2 className="font-['Playfair_Display'] text-xl font-semibold text-white mb-6 flex items-center">
                <CreditCard className="w-5 h-5 mr-3 text-[#C08040]" />
                Método de pago
              </h2>

              <div className="space-y-3">
                <label className={`flex items-center p-4 border cursor-pointer transition-colors ${
                  paymentMethod === 'stripe' 
                    ? 'border-[#C08040] bg-[#C08040]/5' 
                    : 'border-white/10 hover:border-white/20'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={() => setPaymentMethod('stripe')}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <span className="text-white font-medium">Tarjeta de crédito/débito</span>
                    <p className="text-sm text-zinc-500">Visa, Mastercard, American Express</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'stripe' ? 'border-[#C08040]' : 'border-zinc-600'
                  }">
                    {paymentMethod === 'stripe' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#C08040]" />
                    )}
                  </div>
                </label>

                <label className={`flex items-center p-4 border cursor-pointer transition-colors ${
                  paymentMethod === 'paypal' 
                    ? 'border-[#C08040] bg-[#C08040]/5' 
                    : 'border-white/10 hover:border-white/20'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={() => setPaymentMethod('paypal')}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <span className="text-white font-medium">PayPal</span>
                    <p className="text-sm text-zinc-500">Pago seguro con tu cuenta PayPal</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'paypal' ? 'border-[#C08040]' : 'border-zinc-600'
                  }">
                    {paymentMethod === 'paypal' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#C08040]" />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {paymentMethod === 'stripe' ? (
              <button
                onClick={handleStripePayment}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 bg-[#C08040] text-black py-4 font-semibold hover:bg-[#D4A060] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="pay-button"
              >
                {loading ? (
                  <span>Procesando...</span>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pagar {total.toFixed(2)}€ con tarjeta</span>
                  </>
                )}
              </button>
            ) : (
              <div className="bg-[#121212] border border-white/5 p-4">
                <PayPalScriptProvider options={{ 
                  clientId: "test",
                  currency: "EUR"
                }}>
                  <PayPalButtons
                    style={{ layout: "horizontal", color: "gold" }}
                    createOrder={async (data, actions) => {
                      const currentOrderId = await createOrder();
                      if (currentOrderId) {
                        return actions.order.create({
                          purchase_units: [{
                            amount: { value: total.toFixed(2) }
                          }]
                        });
                      }
                    }}
                    onApprove={handlePayPalApprove}
                  />
                </PayPalScriptProvider>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-28 h-fit">
            <div className="bg-[#121212] border border-white/5 p-6">
              <h2 className="font-['Playfair_Display'] text-xl font-semibold text-white mb-6 flex items-center">
                <ShoppingBag className="w-5 h-5 mr-3 text-[#C08040]" />
                Resumen del pedido
              </h2>

              <div className="space-y-4 mb-6">
                {items.map(item => (
                  <div key={item.product_id} className="flex items-center space-x-4">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">{item.product_name}</h4>
                      <p className="text-sm text-zinc-500">x{item.quantity}</p>
                    </div>
                    <span className="font-['JetBrains_Mono'] text-sm text-white">
                      {(item.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/5 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Subtotal</span>
                  <span className="text-white">{total.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">IVA incluido</span>
                  <span className="text-zinc-500">10%</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-white/5">
                  <span className="text-white">Total</span>
                  <span className="font-['JetBrains_Mono'] text-[#C08040]">{total.toFixed(2)}€</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
