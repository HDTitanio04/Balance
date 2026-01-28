import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0A0A0A] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-['Playfair_Display'] text-2xl font-semibold text-white mb-4">
              En Tu <span className="text-[#C08040]">Sano Juicio</span>
            </h3>
            <p className="text-zinc-500 text-sm max-w-md mb-6">
              Comida saludable y deliciosa para llevar. Ingredientes frescos, recetas cuidadas 
              y el sabor que te mereces sin comprometer tu bienestar.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-white/5 hover:bg-white/10 transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5 text-zinc-400" />
              </a>
              <a href="#" className="p-2 bg-white/5 hover:bg-white/10 transition-colors" aria-label="Facebook">
                <Facebook className="w-5 h-5 text-zinc-400" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Enlaces
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/menu" className="text-sm text-zinc-500 hover:text-[#C08040] transition-colors">
                  Nuestro Menú
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="text-sm text-zinc-500 hover:text-[#C08040] transition-colors">
                  Hacer Pedido
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-sm text-zinc-500 hover:text-[#C08040] transition-colors">
                  Acceso Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contacto
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 text-sm text-zinc-500">
                <Phone className="w-4 h-4" />
                <span>+34 XXX XXX XXX</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-zinc-500">
                <Mail className="w-4 h-4" />
                <span>info@entusanojuicio.com</span>
              </li>
              <li className="flex items-start space-x-3 text-sm text-zinc-500">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>Tu dirección aquí</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} En Tu Sano Juicio. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-xs text-zinc-600 hover:text-zinc-400">Política de privacidad</a>
            <a href="#" className="text-xs text-zinc-600 hover:text-zinc-400">Términos de uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
