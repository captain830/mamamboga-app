import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { toast } from 'react-toastify';

const Feedback = () => {
    const { user } = useSelector((state) => state.auth);
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        category: 'feedback'
    });

    const categories = [
        { value: 'feedback', label: '💡 Feedback / Suggestion' },
        { value: 'bug', label: '🐛 Bug Report' },
        { value: 'feature', label: '✨ Feature Request' },
        { value: 'complaint', label: '😞 Complaint' },
        { value: 'question', label: '❓ Question' }
    ];

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const response = await api.get('/feedback/my');
            setFeedbackList(response.data.feedback);
        } catch (error) {
            console.error('Error fetching feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.subject || !formData.message) {
            toast.error('Please fill in all fields');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/feedback', formData);
            toast.success('Thank you for your feedback!');
            setFormData({ subject: '', message: '', category: 'feedback' });
            fetchFeedback();
        } catch (error) {
            toast.error('Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            reviewed: 'bg-blue-100 text-blue-800',
            resolved: 'bg-green-100 text-green-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">💬 Feedback & Support</h1>
                <p className="text-gray-600">We value your opinion! Share your thoughts or report issues.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Submit Form */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">📝 Send Feedback</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 mb-1">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1">Subject</label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                placeholder="Brief summary"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1">Message</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Tell us more..."
                                rows="4"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                        >
                            {submitting ? 'Sending...' : 'Send Feedback'}
                        </button>
                    </form>
                </div>

                {/* My Feedback History */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">📋 My Feedback</h2>
                    
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : feedbackList.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-2">📭</div>
                            <p>No feedback submitted yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {feedbackList.map((item) => (
                                <div key={item.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-semibold">{item.subject}</span>
                                            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${getStatusBadge(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm">{item.message}</p>
                                    
                                    {item.admin_reply && (
                                        <div className="mt-3 bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                                            <p className="text-xs text-green-700 font-medium">Admin Response:</p>
                                            <p className="text-sm text-gray-700">{item.admin_reply}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Feedback;