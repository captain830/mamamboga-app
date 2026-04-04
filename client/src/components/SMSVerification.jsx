import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Check, AlertCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const SMSVerification = ({ phone, userId, onVerified, onBack }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const handleSendCode = async () => {
    setResendLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      
      const data = await response.json();
      if (response.ok) {
        toast.success('Verification code sent!');
        setTimer(60);
        const interval = setInterval(() => {
          setTimer(t => {
            if (t <= 1) clearInterval(interval);
            return t - 1;
          });
        }, 1000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to send code');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      toast.error('Please enter 6-digit code');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });
      
      const data = await response.json();
      if (response.ok) {
        toast.success('Phone verified successfully!');
        onVerified();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Verify Your Phone</h2>
          <p className="text-gray-500 mt-2">
            We'll send a verification code to<br />
            <span className="font-semibold text-green-600">{phone}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 6-digit code
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-2xl tracking-widest px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <Check size={18} />
                Verify Phone
              </>
            )}
          </button>

          <div className="text-center">
            <button
              onClick={handleSendCode}
              disabled={timer > 0 || resendLoading}
              className="text-green-600 hover:text-green-700 text-sm flex items-center justify-center gap-1 mx-auto"
            >
              <Send size={14} />
              {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
            </button>
          </div>

          <button
            onClick={onBack}
            className="w-full text-gray-500 hover:text-gray-700 text-sm py-2"
          >
            ← Back to Registration
          </button>
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 text-center">
            Standard SMS rates may apply. We'll never share your number.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SMSVerification;