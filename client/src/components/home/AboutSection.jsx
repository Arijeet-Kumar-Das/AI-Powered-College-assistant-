// src/components/home/AboutSection.js
import React from 'react';
import { GraduationCap, Target, Award, Users, BookOpen, Lightbulb } from 'lucide-react';

const AboutSection = () => {
  const stats = [
    { number: "75+", label: "Years of Excellence", icon: Award },
    { number: "15000+", label: "Alumni Network", icon: Users },
    { number: "50+", label: "Departments", icon: BookOpen },
    { number: "200+", label: "Faculty Members", icon: GraduationCap }
  ];

  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To provide world-class engineering education and foster innovation, research, and holistic development of students."
    },
    {
      icon: Lightbulb,
      title: "Innovation First",
      description: "Embracing cutting-edge technology like AI chatbots to enhance the learning experience and student support."
    },
    {
      icon: Users,
      title: "Student-Centric",
      description: "Every initiative is designed with our students' success, convenience, and growth at the center of our focus."
    }
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> B.M.S. College</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A legacy of excellence in engineering education, now enhanced with modern AI technology to serve our students better.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 group-hover:from-blue-100 group-hover:to-purple-100 transition-all duration-300">
                  <IconComponent className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Left Content */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Engineering Excellence Since 1946
            </h3>
            <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
              <p>
                B.M.S. College of Engineering stands as one of India's premier engineering institutions, 
                with a rich heritage of academic excellence and innovation spanning over seven decades.
              </p>
              <p>
                Located in the heart of Bangalore, we have consistently evolved with changing times, 
                embracing new technologies and methodologies to provide our students with the best 
                possible learning experience.
              </p>
              <p>
                Our latest initiative brings artificial intelligence to student support through this 
                intelligent chatbot system, making information access seamless and support available 24/7.
              </p>
            </div>
          </div>

          {/* Right Content - Image Placeholder */}
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 h-96 flex items-center justify-center">
              <div className="text-center">
                <GraduationCap className="w-24 h-24 text-blue-600 mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-gray-800 mb-2">Campus Image</h4>
                <p className="text-gray-600">Beautiful B.M.S. College Campus</p>
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-xl opacity-20"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-xl opacity-20"></div>
          </div>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => {
            const IconComponent = value.icon;
            return (
              <div key={index} className="text-center p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors duration-300">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  {value.title}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
