import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast'; // Changed from react-toastify to match your app

const AdminFeedback = () => {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [filter, setFilter] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        reviewed: 0,
        resolved: 0
    });

    // Fetch feedback when filter changes
    useEffect(() => {
        fetchFeedback();
    }, [filter]);

    // Fetch stats when component mounts
    useEffect(() => {
        fetchStats();
    }, []);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await api.get('/feedback/all', { params });
            setFeedback(response.data.feedback || []);
            
            // Update stats based on fetched feedback
            const feedbackData = response.data.feedback || [];
            setStats({
                total: feedbackData.length,
                pending: feedbackData.filter(f => f.status === 'pending').length,
                reviewed: feedbackData.filter(f => f.status === 'reviewed').length,
                resolved: feedbackData.filter(f => f.status === 'resolved').length
            });
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load feedback');
            setFeedback([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/feedback/stats');
            if (response.data && response.data.stats) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            // Don't show toast error here as it's not critical
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) {
            toast.error('Please enter a reply message');
            return;
        }

        try {
            await api.put(`/feedback/${selected.id}/reply`, { admin_reply: replyText });
            toast.success('Reply sent successfully!');
            setShowReplyModal(false);
            setReplyText('');
            fetchFeedback(); // Refresh the list
            fetchStats(); // Refresh stats
        } catch (error) {
            console.error('Reply error:', error);
            toast.error('Failed to send reply');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/feedback/${id}/status`, { status });
            toast.success(`Status updated to ${status}`);
            fetchFeedback(); // Refresh the list
            fetchStats(); // Refresh stats
        } catch (error) {
            console.error('Status update error:', error);
            toast.error('Failed to update status');
        }
    };

    const deleteFeedback = async (id) => {
        if (window.confirm('Are you sure you want to delete this feedback?')) {
            try {
                await api.delete(`/feedback/${id}`);
                toast.success('Feedback deleted successfully');
                fetchFeedback(); // Refresh the list
                fetchStats(); // Refresh stats
            } catch (error) {
                console.error('Delete error:', error);
                toast.error('Failed to delete feedback');
            }
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            reviewed: 'bg-blue-100 text-blue-800',
            resolved: 'bg-green-100 text-green-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getCategoryIcon = (category) => {
        const icons = {
            feedback: '💡',
            bug: '🐛',
            feature: '✨',
            complaint: '😞',
            question: '❓'
        };
        return icons[category] || '📝';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-2">📋 Customer Feedback</h1>
            <p className="text-gray-600 mb-6">Manage and respond to customer feedback</p>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow border-l-4 border-blue-500">
                    <p className="text-2xl font-bold">{stats.total || 0}</p>
                    <p className="text-sm text-gray-500">Total</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow border-l-4 border-yellow-500">
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
                    <p className="text-sm text-gray-500">Pending</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow border-l-4 border-blue-500">
                    <p className="text-2xl font-bold text-blue-600">{stats.reviewed || 0}</p>
                    <p className="text-sm text-gray-500">Reviewed</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow border-l-4 border-green-500">
                    <p className="text-2xl font-bold text-green-600">{stats.resolved || 0}</p>
                    <p className="text-sm text-gray-500">Resolved</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {['all', 'pending', 'reviewed', 'resolved'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                            filter === status 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status !== 'all' && ` (${stats[status] || 0})`}
                    </button>
                ))}
            </div>

            {/* Feedback List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading feedback...</p>
                </div>
            ) : feedback.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <div className="text-5xl mb-2">📭</div>
                    <p className="text-gray-500">No feedback found</p>
                    <p className="text-sm text-gray-400 mt-1">Try changing the filter</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {feedback.map(item => (
                        <div key={item.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-800">
                                            {item.user_name || 'Anonymous User'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {item.user_email || 'No email'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                                            {getCategoryIcon(item.category)} {item.category}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            
                            <h3 className="font-semibold text-gray-800 mb-2">{item.subject}</h3>
                            <p className="text-gray-600 mb-4">{item.message}</p>
                            
                            {item.admin_reply && (
                                <div className="bg-green-50 rounded-lg p-3 mb-4 border-l-4 border-green-500">
                                    <p className="text-xs text-green-700 font-medium mb-1">📨 Admin Response:</p>
                                    <p className="text-sm text-gray-700">{item.admin_reply}</p>
                                    {item.replied_at && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Replied on: {new Date(item.replied_at).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            )}
                            
                            <div className="flex gap-2 pt-3 border-t">
                                <button
                                    onClick={() => {
                                        setSelected(item);
                                        setReplyText(item.admin_reply || '');
                                        setShowReplyModal(true);
                                    }}
                                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                                >
                                    💬 {item.admin_reply ? 'Edit Reply' : 'Reply'}
                                </button>
                                <select
                                    value={item.status}
                                    onChange={(e) => updateStatus(item.id, e.target.value)}
                                    className="px-3 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="pending">⏳ Pending</option>
                                    <option value="reviewed">👀 Reviewed</option>
                                    <option value="resolved">✅ Resolved</option>
                                </select>
                                <button
                                    onClick={() => deleteFeedback(item.id)}
                                    className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reply Modal */}
            {showReplyModal && selected && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Reply to Customer</h2>
                            <button 
                                onClick={() => setShowReplyModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-500 mb-1">From: {selected.user_name || 'Customer'}</p>
                            <p className="text-sm text-gray-500 mb-2">Subject: {selected.subject}</p>
                            <div className="border-t pt-2 mt-2">
                                <p className="text-sm text-gray-700">{selected.message}</p>
                            </div>
                        </div>
                        
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your response..."
                            rows="5"
                            className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            autoFocus
                        />
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowReplyModal(false)} 
                                className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleReply} 
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                                Send Reply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFeedback;