import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      fetch(`https://mamamboga-app.onrender.com/api/auth/verify-email?token=${token}`)
        .then(r => r.json())
        .then(data => {
          if (data.message.includes('verified')) {
            setStatus('success');
            setMessage(data.message);
          } else {
            setStatus('error');
            setMessage(data.message);
          }
        })
        .catch(() => {
          setStatus('error');
          setMessage('Verification failed. Please try again.');
        });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center"
      >
        {status === 'verifying' && (
          <>
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-2xl font-bold mb-2">Verifying Your Email...</h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mt-4"></div>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Login Now
            </Link>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              to="/register"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Register Again
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;