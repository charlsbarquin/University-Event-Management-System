// uems-frontend/src/pages/auth/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { LogIn, Lock, User, Sparkles, Eye, EyeOff, Shield, Calendar, Zap, CheckCircle } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    studentId: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert studentId to uppercase before sending
    const loginData = {
      studentId: formData.studentId.toUpperCase(),
      password: formData.password
    };
    
    setLoading(true);

    try {
      const result = await login(loginData);
      
      if (result.success) {
        navigate('/');
      } else {
        toast.error(result.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex flex-col lg:flex-row overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Left Side - Brand/Info Section */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#0A2FF1] via-[#0818A8] to-[#0a23d8] text-white p-6 lg:p-8 flex flex-col justify-start lg:justify-start relative overflow-hidden pt-8 lg:pt-20">
        {/* Abstract shapes for premium look */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full filter blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400/5 rounded-full filter blur-3xl -ml-36 -mb-36"></div>

        <div className="max-w-lg mx-auto relative z-10">
          {/* Logo Section */}
          <div className="mb-6">
            {/* Features Header */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white mb-1">Why Choose UEMS?</h2>
              <p className="text-blue-100 text-sm">Discover the benefits of joining our platform</p>
            </div>

            {/* Features Grid */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3 group">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/20">
                  <Calendar className="w-5 h-5 text-blue-100" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">Manage University Events</h3>
                  <p className="text-blue-100 text-sm mt-1">Organize, browse, and participate in campus events</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/20 group-hover:bg-white/15 group-hover:border-white/40 transition-all duration-300 transform group-hover:scale-110">
                  <Sparkles className="w-6 h-6 text-blue-100" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">Easy Registration</h3>
                  <p className="text-blue-100 text-sm mt-1">Streamlined sign-up for students and organizers</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/20 group-hover:bg-white/15 group-hover:border-white/40 transition-all duration-300 transform group-hover:scale-110">
                  <Shield className="w-6 h-6 text-blue-100" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">Secure Platform</h3>
                  <p className="text-blue-100 text-sm mt-1">Enterprise-grade security for your data</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Demo Credentials Card */}
          <div className="mt-8 p-4 bg-gradient-to-br from-white/10 to-white/5 rounded-lg backdrop-blur-xl border border-white/20">
            <div className="mb-3">
              <h3 className="font-bold text-sm text-white mb-1">Test the Platform</h3>
              <p className="text-blue-100 text-xs">Try these demo accounts to explore UEMS</p>
            </div>
            <div className="space-y-2 text-xs">
              <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 hover:border-white/30 transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Admin:</span>
                  <code className="font-mono font-semibold text-white tracking-wider">ADMIN001 / admin123</code>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 hover:border-white/30 transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Organizer:</span>
                  <code className="font-mono font-semibold text-white tracking-wider">ORG001 / password123</code>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-2.5 border border-white/10 hover:border-white/30 transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Student:</span>
                  <code className="font-mono font-semibold text-white tracking-wider">STU001 / password123</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="lg:w-1/2 bg-gradient-to-br from-white via-blue-50 to-blue-100 p-6 lg:p-8 flex items-start lg:items-start justify-center relative z-10 pt-8 lg:pt-20">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-5">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1 tracking-tight">Welcome Back</h2>
            <p className="text-gray-600 text-xs">Access your dashboard</p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 lg:p-6 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Student ID Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  ID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <User className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-[#0A2FF1] transition-colors" />
                  </div>
                  <input
                    id="studentId"
                    name="studentId"
                    type="text"
                    required
                    onFocus={() => setFocusedField('studentId')}
                    onBlur={() => setFocusedField(null)}
                    className={`block w-full pl-9 pr-2.5 py-2 border-2 rounded-md focus:outline-none transition-all duration-300 text-xs font-medium uppercase placeholder-gray-400 ${
                      focusedField === 'studentId'
                        ? 'border-[#0A2FF1] bg-blue-50/50 shadow-lg shadow-blue-200/50'
                        : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                    }`}
                    placeholder="Enter your student ID"
                    value={formData.studentId}
                    onChange={handleChange}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-semibold text-[#0A2FF1] hover:text-[#0818A8] transition-colors"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Lock className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-[#0A2FF1] transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`block w-full pl-9 pr-9 py-2 border-2 rounded-md focus:outline-none transition-all duration-300 text-xs font-medium placeholder-gray-400 ${
                      focusedField === 'password'
                        ? 'border-[#0A2FF1] bg-blue-50/50 shadow-lg shadow-blue-200/50'
                        : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                    }`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-3 bg-gradient-to-r from-[#0A2FF1] via-[#0818A8] to-[#0a23d8] text-white font-semibold text-xs rounded-md hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-3 focus:ring-blue-300/50"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <LogIn className="w-5 h-5" />
                    <span>Sign in to UEMS</span>
                  </div>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-3 pt-3 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-[#0A2FF1] hover:text-[#0818A8] transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default Login;