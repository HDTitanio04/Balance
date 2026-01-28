import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight, Clock } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const paypalMethod = searchParams.get('method');
  
  const [status, setStatus] = useState('checking');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (paypalMethod === 'paypal') {
      setStatus('success');
      return;
    }

    if (sessionId) {
      pollPaymentStatus();
    } else {
      setStatus('error');
    }
  }, [sessionId, paypalMethod]);

  const pollPaymentStatus = async () => {
    const maxAttempts = 5;
    
    if (attempts >= maxAttempts) {
      setStatus('pending');
      return;
    }

    try {
      const response = await axios.get(`${API}/checkout/status/${sessionId}`);
      
      if (response.data.payment_status === 'paid') {
        setStatus('success');
        return;
      } else if (response.data.status === 'expired') {
        setStatus('error');
        return;
      }

      // Continue polling
      setTimeout(() => {
        setAttempts(prev => prev + 1);
        pollPaymentStatus();
      }, 2000);
    } catch (error) {
      console.error('Error checking payment:', error);
      setStatus('error');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 border-4 border-[#C08040] border-t-transparent rounded-full animate-spin" />
            <h1 className="font-['Playfair_Display'] text-3xl font-bold text-white mb-4">
              Verificando pago...
            </h1>
            <p className="text-zinc-400">
              Estamos confirmando tu pago. Por favor, espera un momento.
            </p>
          </div>
        );
      
      case 'success':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-emerald-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
            <h1 className="font-['Playfair_Display'] text-3xl font-bold text-white mb-4">
              ¡Pago completado!
            </h1>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
              Tu pedido ha sido confirmado. Recibirás un email con los detalles. 
              ¡Gracias por elegir En Tu Sano Juicio!
            </p>
            <div className="space-y-4">
              <Link
                to="/menu"
                className="inline-flex items-center justify-center space-x-2 bg-[#C08040] text-black px-8 py-4 font-semibold hover:bg-[#D4A060] transition-colors"
                data-testid="back-to-menu"
              >
                <span>Hacer otro pedido</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div>
                <Link
                  to="/"
                  className="text-zinc-400 hover:text-white transition-colors text-sm"
                >
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        );

      case 'pending':
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-amber-900/30 rounded-full flex items-center justify-center">
              <Clock className="w-12 h-12 text-amber-400" />
            </div>
            <h1 className="font-['Playfair_Display'] text-3xl font-bold text-white mb-4">
              Pago en proceso
            </h1>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
              Tu pago está siendo procesado. Recibirás un email de confirmación cuando se complete.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center space-x-2 border border-white/20 text-white px-8 py-4 font-medium hover:bg-white/5 transition-colors"
            >
              <span>Volver al inicio</span>
            </Link>
          </div>
        );
      
      case 'error':
      default:
        return (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-900/30 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <h1 className="font-['Playfair_Display'] text-3xl font-bold text-white mb-4">
              Error en el pago
            </h1>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto">
              Ha ocurrido un error al procesar tu pago. Por favor, inténtalo de nuevo.
            </p>
            <Link
              to="/checkout"
              className="inline-flex items-center justify-center space-x-2 bg-[#C08040] text-black px-8 py-4 font-semibold hover:bg-[#D4A060] transition-colors"
            >
              <span>Reintentar pago</span>
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-20 flex items-center justify-center" data-testid="payment-result-page">
      <div className="max-w-xl mx-auto px-4 py-20">
        {renderContent()}
      </div>
    </div>
  );
};

export default PaymentSuccess;
