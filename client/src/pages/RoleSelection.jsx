// src/pages/RoleSelection.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, GraduationCap, Users, ArrowRight, Bot } from 'lucide-react';

const RoleSelection = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'student',
      title: 'Student',
      description: 'Access your academic information, chat with AI assistant, and get instant answers to your queries.',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      hoverColor: 'hover:from-blue-100 hover:to-cyan-100',
      features: ['Chat with AI Assistant', 'View Notices & Updates', 'Access Academic Resources', 'Check Schedules']
    },
    {
      id: 'faculty',
      title: 'Faculty / Teacher',
      description: 'Manage student queries, update course content, and monitor chatbot interactions.',
      icon: GraduationCap,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      hoverColor: 'hover:from-purple-100 hover:to-pink-100',
      features: ['Manage FAQs', 'Monitor Chat Logs', 'Update Course Content', 'Student Analytics']
    },
    {
      id: 'admin',
      title: 'Administrator',
      description: 'Full system control, user management, and comprehensive analytics dashboard.',
      icon: Shield,
      color: 'from-green-500 to-teal-500',
      bgColor: 'from-green-50 to-teal-50',
      hoverColor: 'hover:from-green-100 hover:to-teal-100',
      features: ['Complete System Control', 'User Management', 'Analytics Dashboard', 'System Configuration']
    }
  ];

  const handleRoleSelect = (roleId) => {
    navigate(`/login/${roleId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-2xl">
              <Bot className="w-9 h-9 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-white">BMS Assistant</h1>
              <p className="text-blue-200 text-sm">College of Engineering</p>
            </div>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Choose Your Role
          </h2>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            Select your role to access the appropriate features and dashboard tailored for your needs.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <div
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className={`group relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:bg-white/15 border border-white/20 shadow-2xl`}
              >
                {/* Role Icon */}
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${role.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl`}>
                  <IconComponent className="w-10 h-10 text-white" />
                </div>

                {/* Role Info */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {role.title}
                  </h3>
                  <p className="text-blue-100 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-2 mb-8">
                  {role.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-blue-200 text-sm">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Login Button */}
                <button className="w-full bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm text-white py-4 rounded-xl font-semibold hover:from-white/30 hover:to-white/20 transition-all duration-200 flex items-center justify-center group-hover:shadow-lg border border-white/20">
                  Login as {role.title}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-blue-300 text-sm">
            Need help? Contact support at{' '}
            <a href="mailto:support@bmsce.ac.in" className="text-blue-200 hover:text-white underline">
              support@bmsce.ac.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
