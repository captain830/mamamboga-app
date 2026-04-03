import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Star, AlertCircle, Lightbulb, Bug, Heart, ChevronRight } from 'lucide-react';

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
        { value: 'feedback', label: 'Feedback / Suggestion', icon: Lightbulb, color: 'bg-purple-100 text-purple-700', borderColor: 'border-purple-300' },
        { value: 'bug', label: 'Bug Report', icon: Bug, color: 'bg-red-100 text-red-700', borderColor: 'border-red-300' },
        { value: 'feature', label: 'Feature Request', icon: Star, color: 'bg-yellow-100 text-yellow-700', borderColor: 'border-yellow-300' },
        { value: 'complaint', label: 'Complaint', icon: AlertCircle, color: 'bg-orange-100 text-orange-700', borderColor: 'border-orange-300' },
        { value: 'question', label: 'Question', icon: MessageSquare, color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-300' }
    ];

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const response = await api.get('/feedback/my');
            setFeedbackList(response.data.feedback || []);
        } catch (error) {
            console.error('Error fetching feedback:', error);
            toast.error('Failed to load feedback');
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

    const getStatusConfig = (status) => {
        const config = {
            pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Pending', icon: '⏳' },
            reviewed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Reviewed', icon: '👀' },
            resolved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Resolved', icon: '✅' }
        };
        return config[status] || config.pending;
    };

    const getCategoryIcon = (categoryValue) => {
        const cat = categories.find(c => c.value === categoryValue);
        if (cat && cat.icon) {
            const IconComponent = cat.icon;
            return <IconComponent className="w-4 h-4" />;
        }
        return <MessageSquare className="w-4 h-4" />;
    };

    const selectedCategory = categories.find(c => c.value === formData.category);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 sm:mb-12"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
                        <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Feedback & Support</h1>
                    <p className="text-gray-600 max-w-md mx-auto">We value your opinion! Share your thoughts or report issues.</p>
                </motion.div>

                {/* Two Column Layout */}
                <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* Submit Form - Left Column */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl shadow-xl overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Send className="w-5 h-5" />
                                Send Feedback
                            </h2>
                            <p className="text-green-100 text-sm mt-1">Help us improve your experience</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                                    {categories.map((cat) => {
                                        const IconComponent = cat.icon;
                                        const isSelected = formData.category === cat.value;
                                        return (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, category: cat.value })}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                                    isSelected
                                                        ? `${cat.color} ring-2 ring-offset-2 ring-green-500`
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                <IconComponent className="w-4 h-4" />
                                                <span className="truncate">{cat.label.split(' ')[0]}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Subject Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder="Brief summary of your feedback..."
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                                    required
                                />
                            </div>

                            {/* Message Textarea */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                                    <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Please provide detailed information..."
                                    rows="5"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none resize-none"
                                    required
                                />
                            </div>

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                disabled={submitting}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                                    submitting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg'
                                }`}
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Feedback
                                    </>
                                )}
                            </motion.button>
                        </form>
                    </motion.div>

                    {/* My Feedback History - Right Column */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-full"
                    >
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Heart className="w-5 h-5" />
                                My Feedback
                            </h2>
                            <p className="text-purple-100 text-sm mt-1">Track your submitted feedback</p>
                        </div>

                        <div className="flex-1 p-6">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
                                    <p className="text-gray-500 mt-4">Loading your feedback...</p>
                                </div>
                            ) : feedbackList.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📭</div>
                                    <p className="text-gray-500 font-medium">No feedback submitted yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Use the form to share your thoughts!</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {feedbackList.map((item, index) => {
                                        const statusConfig = getStatusConfig(item.status);
                                        const categoryIcon = getCategoryIcon(item.category);
                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="border rounded-xl p-4 hover:shadow-md transition-all duration-300 bg-white"
                                            >
                                                {/* Header */}
                                                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                                            {categoryIcon}
                                                        </div>
                                                        <span className="font-semibold text-gray-800">{item.subject}</span>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                                                            {statusConfig.icon} {statusConfig.label}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                
                                                {/* Message */}
                                                <p className="text-gray-600 text-sm mb-3 leading-relaxed">{item.message}</p>
                                                
                                                {/* Admin Reply */}
                                                {item.admin_reply && (
                                                    <div className="mt-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-l-4 border-green-500">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                                                </svg>
                                                            </div>
                                                            <p className="text-xs font-semibold text-green-700">Admin Response</p>
                                                        </div>
                                                        <p className="text-sm text-gray-700 leading-relaxed">{item.admin_reply}</p>
                                                        {item.replied_at && (
                                                            <p className="text-xs text-gray-400 mt-2">
                                                                Replied on {new Date(item.replied_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8;
                }
            `}</style>
        </div>
    );
};

export default Feedback;