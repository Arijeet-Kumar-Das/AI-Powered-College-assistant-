// src/components/home/FeaturesSection.js
import React from 'react';
import { Bot, MessageSquare, Clock, Brain, Search, Bell, BookOpen, Shield, Zap, Users } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Bot,
      title: "AI-Powered Responses",
      description: "Advanced natural language processing understands your queries and provides accurate, contextual answers instantly.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: MessageSquare,
      title: "24/7 Availability",
      description: "Get help anytime, anywhere. Our chatbot is always ready to assist with your academic questions and college information.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Search,
      title: "Smart Search",
      description: "Semantic search through college databases, FAQs, and resources to find exactly what you're looking for.",
      color: "from-green-500 to-teal-500"
    },
    {
      icon: Bell,
      title: "Real-time Notices",
      description: "Stay updated with the latest college announcements, exam schedules, and important notifications.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: BookOpen,
      title: "Academic Support",
      description: "Get help with subjects, assignments, timetables, and course-related queries from our comprehensive knowledge base.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your conversations are encrypted and private. We prioritize student data security and privacy protection.",
      color: "from-gray-600 to-gray-800"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Powerful Features for
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Students</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of college assistance with our AI-powered chatbot designed specifically for B.M.S. College students and faculty.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Experience Smart Learning?
              </h3>
              <p className="text-lg text-blue-100 mb-8">
                Join thousands of B.M.S. College students who are already using our AI assistant for their academic success.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Start Your First Chat
                </button>
                <button className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-colors duration-200 border border-white/20">
                  <Users className="w-5 h-5 mr-2" />
                  Join 5000+ Students
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
