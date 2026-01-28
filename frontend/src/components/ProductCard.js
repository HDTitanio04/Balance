import React from 'react';
import { Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product, onClick }) => {
  const { addItem } = useCart();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addItem(product);
  };

  const categoryColors = {
    bowls: 'bg-emerald-900/30 text-emerald-400',
    ensaladas: 'bg-amber-900/30 text-amber-400',
    wraps: 'bg-purple-900/30 text-purple-400'
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-[#121212] border border-white/5 hover:border-[#C08040]/30 transition-all duration-300 cursor-pointer overflow-hidden"
      data-testid={`product-card-${product.id}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
        
        {/* Category Badge */}
        <span className={`absolute top-4 left-4 px-3 py-1 text-xs font-medium uppercase tracking-wider ${categoryColors[product.category] || 'bg-zinc-800 text-zinc-400'}`}>
          {product.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-['Playfair_Display'] text-lg font-semibold text-white mb-2 group-hover:text-[#C08040] transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-zinc-500 line-clamp-2 mb-4">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="font-['JetBrains_Mono'] text-xl font-semibold text-[#C08040]">
            {product.price.toFixed(2)}€
          </span>
          
          <button
            onClick={handleAddToCart}
            className="flex items-center space-x-2 bg-[#C08040] text-black px-4 py-2 text-sm font-medium hover:bg-[#D4A060] transition-colors"
            data-testid={`add-to-cart-${product.id}`}
          >
            <Plus className="w-4 h-4" />
            <span>Añadir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
