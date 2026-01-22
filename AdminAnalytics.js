"use client";
import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

const AdminAnalytics = () => {
    // Mock Data - In a real app, this would come from /api/analytics
    const appointmentData = [
        { name: 'Mon', Video: 4, InPerson: 2 },
        { name: 'Tue', Video: 3, InPerson: 5 },
        { name: 'Wed', Video: 2, InPerson: 3 },
        { name: 'Thu', Video: 6, InPerson: 4 },
        { name: 'Fri', Video: 8, InPerson: 1 },
        { name: 'Sat', Video: 5, InPerson: 0 },
        { name: 'Sun', Video: 2, InPerson: 0 },
    ];

    const revenueData = [
        { month: 'Jan', Revenue: 5000 },
        { month: 'Feb', Revenue: 7000 },
        { month: 'Mar', Revenue: 6500 },
        { month: 'Apr', Revenue: 8200 },
        { month: 'May', Revenue: 9100 },
        { month: 'Jun', Revenue: 11000 },
    ];

    const demographicsData = [
        { name: 'Male', value: 450 },
        { name: 'Female', value: 520 },
        { name: 'Other', value: 30 },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="analytics-dashboard">
            <h2 style={{ color: 'var(--color-navy)', marginBottom: '1.5rem' }}>Hospital Analytics & Insights</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                {/* Appointment Trends */}
                <div className="card">
                    <h4 style={{ textAlign: 'center', marginBottom: '1rem' }}>Weekly Appointments</h4>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={appointmentData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Video" fill="#8884d8" />
                                <Bar dataKey="InPerson" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue Growth */}
                <div className="card">
                    <h4 style={{ textAlign: 'center', marginBottom: '1rem' }}>Revenue Growth (GHS)</h4>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="Revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Patient Demographics */}
                <div className="card">
                    <h4 style={{ textAlign: 'center', marginBottom: '1rem' }}>Patient Demographics</h4>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={demographicsData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label
                                >
                                    {demographicsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
                    <h4 style={{ textAlign: 'center' }}>Key Performance Indicators</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', color: '#0369a1' }}>98%</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Patient Satisfaction</div>
                        </div>
                        <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', color: '#15803d' }}>12m</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Avg. Wait Time</div>
                        </div>
                        <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', color: '#b91c1c' }}>4.2%</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No-Show Rate</div>
                        </div>
                        <div style={{ background: '#fff7ed', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', color: '#c2410c' }}>1,240</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Patients</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminAnalytics;
