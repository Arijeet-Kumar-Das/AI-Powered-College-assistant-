// src/components/common/Navbar.js - Updated with React Router integration
import React, { useState, useEffect } from 'react';
import { Link as ScrollLink } from 'react-scroll';
import { Link as RouterLink } from 'react-router-dom';
import { Menu, X, Bot, GraduationCap, Users, BookOpen, MessageSquare } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', to: 'hero', icon: GraduationCap },
    { name: 'Features', to: 'features', icon: Bot },
    { name: 'About', to: 'about', icon: Users },
    { name: 'Contact', to: 'contact', icon: BookOpen }
  ];

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo - Link to Home */}
          <RouterLink to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-xl md:text-2xl font-bold ${
                scrolled ? 'text-gray-800' : 'text-white'
              }`}>
                BMS Assistant
              </h1>
              <p className={`text-xs md:text-sm ${
                scrolled ? 'text-gray-600' : 'text-blue-100'
              }`}>
                College of Engineering
              </p>
            </div>
          </RouterLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <ScrollLink
                  key={item.name}
                  to={item.to}
                  spy={true}
                  smooth={true}
                  offset={-80}
                  duration={500}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                    scrolled 
                      ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                      : 'text-white hover:text-blue-200 hover:bg-white/10'
                  }`}
                >
                  <IconComponent size={18} />
                  <span className="font-medium">{item.name}</span>
                </ScrollLink>
              );
            })}
            
            {/* CTA Button - Updated to navigate to role selection */}
            <RouterLink
              to="/role-selection"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
            >
              <MessageSquare size={18} className="mr-2" />
              Start Chat
            </RouterLink>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-lg transition-colors ${
                scrolled 
                  ? 'text-gray-700 hover:bg-gray-100' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-100">
            <div className="px-4 py-6 space-y-3">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <ScrollLink
                    key={item.name}
                    to={item.to}
                    spy={true}
                    smooth={true}
                    offset={-80}
                    duration={500}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors"
                  >
                    <IconComponent size={20} />
                    <span className="font-medium">{item.name}</span>
                  </ScrollLink>
                );
              })}
              
              {/* Mobile CTA Button - Updated to navigate to role selection */}
              <RouterLink
                to="/role-selection"
                onClick={() => setIsOpen(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg mt-4 flex items-center justify-center"
              >
                <MessageSquare size={18} className="mr-2" />
                Start Chat
              </RouterLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
    