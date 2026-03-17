// src/pages/FacultyLogin.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  GraduationCap,
  Eye,
  EyeOff,
  User,
  Lock,
  ArrowLeft,
  Bot,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const FacultyLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employeeId: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user types
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/teacher/login",
        {
          employeeId: formData.employeeId,
          password: formData.password,
        }
      );

      if (response.data.success) {
        // Store teacher token and data
        localStorage.setItem("teacherToken", response.data.token);
        localStorage.setItem(
          "teacherData",
          JSON.stringify(response.data.teacher)
        );

        setSuccess("Login successful! Redirecting to dashboard...");

        // Redirect after short delay
        setTimeout(() => {
          navigate("/faculty/dashboard");
        }, 1500);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <Link
          to="/role-selection"
          className="inline-flex items-center text-purple-200 hover:text-white mb-8 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Role Selection
        </Link>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Faculty Login
            </h2>
            <p className="text-purple-200">Access your teaching dashboard</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee ID Field - CHANGED FROM EMAIL */}
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Employee ID *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                  placeholder="e.g., EMP001"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-2 flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* REMOVED: Department dropdown - not needed for login */}

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-3 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
                <span className="text-red-200 text-sm">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center space-x-3 p-4 bg-green-500/20 border border-green-500/30 rounded-2xl backdrop-blur-sm">
                <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                <span className="text-green-200 text-sm">{success}</span>
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-purple-400 bg-white/20 border-white/30 rounded focus:ring-purple-500 focus:ring-2 disabled:opacity-50"
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-purple-200">
                  Remember me
                </span>
              </label>
              <a
                href="#"
                className="text-sm text-purple-300 hover:text-white transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Support Link */}
          <div className="text-center mt-6">
            <p className="text-purple-200">
              Need access?{" "}
              <a
                href="#"
                className="text-purple-300 hover:text-white font-medium transition-colors"
              >
                Contact IT Support
              </a>
            </p>
            <p className="text-xs text-purple-400 mt-2">
              Default password: teacher123
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-2 text-purple-300">
            <Bot className="w-5 h-5" />
            <span className="text-sm">Powered by BMS Assistant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyLogin;
