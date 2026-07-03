import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Mail, MessageSquare, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import Footer from '@/components/layout/Footer';

const contactInfo = [
    { icon: Mail, label: 'Email', value: 'support@careerbridge.com', href: 'mailto:support@careerbridge.com' },
    { icon: MapPin, label: 'Address', value: 'SVVV, Indore, MP, India', href: null },
    { icon: Clock, label: 'Response Time', value: 'Within 24-48 hours', href: null },
    { icon: MessageSquare, label: 'Community Forum', value: 'Post in the forum', href: '/forum' },
];

export default function Contact() {
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In production, this would send to an API
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="flex-1">
                <div className="max-w-5xl mx-auto px-4 py-12 space-y-8 animate-fade-in">
                    <div>
                        <Link to="/">
                            <Button variant="ghost" size="sm" className="mb-4">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-heading font-bold">Contact Us</h1>
                        <p className="text-muted-foreground mt-2">
                            Have a question, suggestion, or need help? We'd love to hear from you.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Send a Message</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {submitted ? (
                                        <div className="text-center py-12 space-y-4 animate-scale-in">
                                            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
                                            <h3 className="text-xl font-heading font-bold">Message Sent!</h3>
                                            <p className="text-muted-foreground">Thanks for reaching out. We'll get back to you within 24-48 hours.</p>
                                            <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                                                Send Another Message
                                            </Button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Your Name *</Label>
                                                    <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                                                </div>
                                                <div>
                                                    <Label>Email Address *</Label>
                                                    <Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Subject *</Label>
                                                <Input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="What's this about?" />
                                            </div>
                                            <div>
                                                <Label>Message *</Label>
                                                <Textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us more..." />
                                            </div>
                                            <Button type="submit" className="w-full">
                                                <Send className="w-4 h-4 mr-2" /> Send Message
                                            </Button>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-4">
                            {contactInfo.map((info, i) => (
                                <Card key={i} className="transition-all hover:shadow-md">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <info.icon className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">{info.label}</p>
                                                {info.href ? (
                                                    info.href.startsWith('/') ? (
                                                        <Link to={info.href} className="text-sm font-medium text-primary hover:underline">{info.value}</Link>
                                                    ) : (
                                                        <a href={info.href} className="text-sm font-medium text-primary hover:underline">{info.value}</a>
                                                    )
                                                ) : (
                                                    <p className="text-sm font-medium">{info.value}</p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
