import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Clock, User, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AdminApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
    
    // Listen for new registrations via WebSocket
    const socket = window.socket;
    if (socket) {
      socket.on('new-registration', () => {
        fetchPendingUsers();
        toast.info('New registration awaiting approval!', {
          icon: '🆕',
          duration: 5000
        });
      });
    }
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/admin/pending-approvals');
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await api.put(`/admin/approve-user/${userId}`);
      toast.success('User approved successfully!');
      fetchPendingUsers();
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    if (!rejectReason) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      await api.put(`/admin/reject-user/${userId}`, { reason: rejectReason });
      toast.success('User rejected');
      setRejectReason('');
      setSelectedUser(null);
      fetchPendingUsers();
    } catch (error) {
      toast.error('Failed to reject user');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pending Approvals</h2>
          <p className="text-gray-500 mt-1">Review and approve new user registrations</p>
        </div>
        <div className="bg-yellow-100 px-4 py-2 rounded-lg">
          <span className="font-semibold text-yellow-800">{pendingUsers.length} Pending</span>
        </div>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">All caught up!</h3>
          <p className="text-gray-500">No pending user approvals at this time.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold text-gray-800">{user.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{user.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Registered: {new Date(user.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(user.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <Check size={18} />
                      Approve
                    </button>
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <X size={18} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold mb-4">Reject User</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject <strong>{selectedUser.name}</strong>?
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-red-500"
              rows="3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedUser.id)}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirm Reject
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;