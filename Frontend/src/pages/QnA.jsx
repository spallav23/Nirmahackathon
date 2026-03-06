import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sendChatMessage } from '../services/api';

const QnA = () => {
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Welcome! How can I assist you with the solar inverter predictive maintenance platform today?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async (e) => {
        e.preventDefault();

        const messageText = inputValue.trim();
        if (!messageText) return;

        // Optimistically add user message
        const newHistory = [...messages, { role: 'user', text: messageText }];
        setMessages(newHistory);
        setInputValue('');
        setLoading(true);

        try {
            // Call our new generative API
            const response = await sendChatMessage({
                message: messageText,
                history: messages // Send previous context
            });

            if (response.data.success) {
                setMessages(prev => [...prev, { role: 'ai', text: response.data.data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I received an invalid response from the server." }]);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'ai', text: "Error: Could not connect to the AI service. Please check your API keys or network connection." }]);
        }

        setLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}
        >
            <header style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem' }}>Operator Query Interface (AI)</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Ask questions about inverter risks, maintenance docs, and historical failures.</p>
            </header>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

                {/* Chat History View */}
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', backgroundColor: 'var(--bg-main)' }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            marginBottom: '1.5rem',
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                        }}>
                            <div style={{
                                background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-sub-surface)',
                                color: msg.role === 'user' ? '#000' : 'var(--text-primary)',
                                padding: '1rem',
                                borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                maxWidth: '80%',
                                lineHeight: '1.5'
                            }}>
                                {msg.text.split('\n').map((line, i) => <p key={i} style={{ margin: '0 0 0.5rem 0' }}>{line}</p>)}
                            </div>
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {loading && (
                        <div style={{ display: 'flex', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'var(--bg-sub-surface)', padding: '1rem', borderRadius: '12px 12px 12px 0', maxWidth: '80%' }}>
                                <div className="skeleton" style={{ width: '200px', height: '15px', marginBottom: '0.5rem' }}></div>
                                <div className="skeleton" style={{ width: '150px', height: '15px' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <form
                    onSubmit={handleSend}
                    style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-surface)' }}
                >
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type your question..."
                        disabled={loading}
                        style={{
                            flex: 1, padding: '0.8rem 1rem', borderRadius: '8px',
                            border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-sub-surface)',
                            color: 'var(--text-primary)', outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading || !inputValue.trim()}
                        style={{
                            padding: '0 1.5rem', background: 'var(--accent-primary)',
                            color: '#000', borderRadius: '8px', fontWeight: 'bold', border: 'none',
                            cursor: loading ? 'wait' : 'pointer', opacity: loading || !inputValue.trim() ? 0.6 : 1
                        }}
                    >
                        Send
                    </button>
                </form>
            </div>
        </motion.div>
    );
};

export default QnA;
