import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, total, clearCart } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={() => setIsOpen(false)}
        data-testid="cart-overlay"
      />

      {/* Cart Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0A0A0A] border-l border-white/5 z-50 flex flex-col animate-slide-in"
        data-testid="cart-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <ShoppingBag className="w-6 h-6 text-[#C08040]" />
            <h2 className="font-['Playfair_Display'] text-xl font-semibold">Tu Pedido</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            data-testid="close-cart"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-zinc-700 mb-4" />
              <p className="text-zinc-500 text-lg">Tu carrito está vacío</p>
              <p className="text-zinc-600 text-sm mt-2">Añade productos para empezar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div
                  key={item.product_id}
                  className="flex items-center space-x-4 p-4 bg-[#121212] border border-white/5"
                  data-testid={`cart-item-${item.product_id}`}
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{item.product_name}</h4>
                    <p className="text-sm text-[#C08040] font-['JetBrains_Mono']">
                      {item.price.toFixed(2)}€
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="p-1 text-zinc-400 hover:text-white transition-colors"
                      data-testid={`decrease-${item.product_id}`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="p-1 text-zinc-400 hover:text-white transition-colors"
                      data-testid={`increase-${item.product_id}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                    data-testid={`remove-${item.product_id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Subtotal</span>
              <span className="font-['JetBrains_Mono'] text-xl font-semibold text-white">
                {total.toFixed(2)}€
              </span>
            </div>
            
            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center space-x-2 bg-[#C08040] text-black py-4 font-semibold hover:bg-[#D4A060] transition-colors"
              data-testid="checkout-button"
            >
              <span>Continuar al pago</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={clearCart}
              className="w-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              data-testid="clear-cart-button"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease forwards;
        }
      `}</style>
    </>
  );
};

export default Cart;
