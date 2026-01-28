import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Clock, CreditCard } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data.slice(0, 6)); // Show only 6 products
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Leaf,
      title: 'Ingredientes Frescos',
      description: 'Productos de temporada y proveedores locales de confianza.'
    },
    {
      icon: Clock,
      title: 'Recogida Rápida',
      description: 'Haz tu pedido online y recógelo en el horario que elijas.'
    },
    {
      icon: CreditCard,
      title: 'Pago Seguro',
      description: 'Paga con tarjeta o PayPal de forma segura y sin complicaciones.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1600"
            alt="Healthy food"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/50 via-[#0A0A0A]/70 to-[#0A0A0A]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-2 text-xs font-medium uppercase tracking-widest text-[#C08040] border border-[#C08040]/30 mb-6">
              Take Away Saludable
            </span>
            
            <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-fade-in">
              En Tu Sano
              <br />
              <span className="text-[#C08040]">Juicio</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-zinc-400 max-w-xl mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Comida saludable, deliciosa y nutritiva. Bowls, ensaladas y wraps preparados 
              con ingredientes frescos para que comer bien sea un placer.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Link
                to="/menu"
                className="inline-flex items-center justify-center space-x-2 bg-[#C08040] text-black px-8 py-4 font-semibold hover:bg-[#D4A060] transition-all duration-300"
                data-testid="view-menu-button"
              >
                <span>Ver Menú</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <Link
                to="/menu"
                className="inline-flex items-center justify-center space-x-2 border border-white/20 text-white px-8 py-4 font-medium hover:bg-white/5 transition-all duration-300"
              >
                <span>Hacer Pedido</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="border-l border-white/10 pl-6 hover:border-[#C08040] transition-colors duration-300"
              >
                <feature.icon className="w-10 h-10 text-[#C08040] mb-4" />
                <h3 className="font-['Playfair_Display'] text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-zinc-500 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs font-medium uppercase tracking-widest text-[#C08040] mb-2 block">
                Nuestro Menú
              </span>
              <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold text-white">
                Platos Destacados
              </h2>
            </div>
            <Link
              to="/menu"
              className="hidden sm:flex items-center space-x-2 text-[#C08040] hover:text-[#D4A060] transition-colors"
            >
              <span className="text-sm font-medium">Ver todo el menú</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[#121212] aspect-[4/5] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-10 text-center sm:hidden">
            <Link
              to="/menu"
              className="inline-flex items-center space-x-2 text-[#C08040] hover:text-[#D4A060] transition-colors"
            >
              <span className="text-sm font-medium">Ver todo el menú</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold text-white mb-6">
            ¿Listo para comer sano?
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto mb-10">
            Haz tu pedido ahora y disfruta de comida saludable y deliciosa. 
            Recoge cuando quieras, paga como prefieras.
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center justify-center space-x-2 bg-[#C08040] text-black px-10 py-4 font-semibold hover:bg-[#D4A060] transition-all duration-300"
            data-testid="cta-order-button"
          >
            <span>Hacer Pedido</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
