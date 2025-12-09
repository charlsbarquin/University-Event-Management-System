// uems-frontend/src/pages/auth/Register.jsx
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { UserPlus, User, Mail, Lock, Hash, Sparkles, Eye, EyeOff, Users, Calendar, Shield, ArrowRight, CheckCircle, Zap } from 'lucide-react';

// Email validation helper function
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Bicol University email
  const buEmailRegex = /^[a-zA-Z0-9._%+-]+@bicol-u\.edu\.ph$/;
  // Standard email providers
  const standardEmailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud|protonmail)\.(com|net|org|edu)$/i;
  // Educational emails
  const eduEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|ac)\.[a-zA-Z]{2,}$/i;
  
  return buEmailRegex.test(email) || 
         standardEmailRegex.test(email) || 
         eduEmailRegex.test(email) ||
         /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu\.[a-zA-Z]{2,}$/i.test(email);
};

const Register = () => {
  const [formData, setFormData] = useState({
    studentId: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    gender: 'prefer-not-to-say'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [emailError, setEmailError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const password = formData.password;
    if (!password) return { score: 0, label: '', color: 'bg-gray-300' };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];
    
    return {
      score: Math.min(score, 4),
      label: labels[Math.min(score, 4)],
      color: colors[Math.min(score, 4)]
    };
  }, [formData.password]);

  // Validate email on change
  const handleEmailChange = (e) => {
    const email = e.target.value;
    setFormData({
      ...formData,
      email: email
    });
    
    // Only show error if user has typed something
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email (e.g., name@gmail.com or name@bicol-u.edu.ph)');
    } else {
      setEmailError('');
    }
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    
    if (name === 'email') {
      handleEmailChange(e);
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email before submitting
    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address (e.g., name@gmail.com or name@bicol-u.edu.ph)');
      setEmailError('Invalid email format');
      return;
    }
    
    // Basic validation
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);

    try {
      // Convert studentId to uppercase
      const registerData = {
        ...formData,
        studentId: formData.studentId.toUpperCase()
      };
      
      const result = await register(registerData);
      
      if (result.success) {
        navigate('/');
      } else {
        toast.error(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      toast.error('Registration failed. Please try again.');
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
              <h2 className="text-xl font-bold text-white mb-1">Start Your Journey</h2>
              <p className="text-blue-100 text-sm">Join thousands of students already on UEMS</p>
            </div>

            {/* Features Grid */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3 group">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/20">
                  <Calendar className="w-5 h-5 text-blue-100" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-tight">Discover Events</h3>
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

      {/* Right Side - Registration Form */}
      <div className="lg:w-1/2 bg-gradient-to-br from-white via-blue-50 to-blue-100 p-6 lg:p-8 flex items-start lg:items-start justify-center relative z-10 pt-8 lg:pt-20">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-5">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1 tracking-tight">Join UEMS Today</h2>
            <p className="text-gray-600 text-xs">Create your account to get started</p>
          </div>

          {/* Registration Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 lg:p-6 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    First Name
                  </label>
                  <div className="relative group">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                      className={`block w-full px-3 py-2 border-2 rounded-md focus:outline-none transition-all duration-300 text-xs font-medium placeholder-gray-400 ${
                        focusedField === 'firstName'
                          ? 'border-[#0A2FF1] bg-blue-50/50 shadow-lg shadow-blue-200/50'
                          : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                      }`}
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Last Name
                  </label>
                  <div className="relative group">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => setFocusedField(null)}
                      className={`block w-full px-3 py-2 border-2 rounded-md focus:outline-none transition-all duration-300 text-xs font-medium placeholder-gray-400 ${
                        focusedField === 'lastName'
                          ? 'border-[#0A2FF1] bg-blue-50/50 shadow-lg shadow-blue-200/50'
                          : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                      }`}
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Student ID */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Student ID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Hash className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-[#0A2FF1] transition-colors" />
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
                    placeholder="e.g., 2023-00123"
                    value={formData.studentId}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Mail className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-[#0A2FF1] transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={`block w-full pl-9 pr-2.5 py-2 border-2 rounded-md focus:outline-none transition-all duration-300 text-xs font-medium placeholder-gray-400 ${
                      focusedField === 'email' && !emailError
                        ? 'border-[#0A2FF1] bg-blue-50/50 shadow-lg shadow-blue-200/50'
                        : emailError
                        ? 'border-red-300 bg-red-50/50 shadow-lg shadow-red-200/50'
                        : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                    }`}
                    placeholder="student@bicol-u.edu.ph or name@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-red-600 font-medium flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {emailError}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Accepted formats: name@gmail.com, name@bicol-u.edu.ph, or other educational emails
                </p>
              </div>

              {/* Gender Dropdown */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Gender <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Users className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-[#0A2FF1] transition-colors" />
                  </div>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('gender')}
                    onBlur={() => setFocusedField(null)}
                    className={`block w-full pl-9 pr-2.5 py-2 border-2 rounded-md focus:outline-none transition-all duration-300 text-xs font-medium appearance-none bg-white ${
                      focusedField === 'gender'
                        ? 'border-[#0A2FF1] shadow-lg shadow-blue-200/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <option value="prefer-not-to-say">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password */}
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
                    minLength="6"
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`block w-full pl-9 pr-9 py-2 border-2 rounded-md focus:outline-none transition-all duration-300 text-xs font-medium placeholder-gray-400 ${
                      focusedField === 'password'
                        ? 'border-[#0A2FF1] bg-blue-50/50 shadow-lg shadow-blue-200/50'
                        : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                    }`}
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={handleChange}
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

                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="pt-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${(passwordStrength.score + 1) * 25}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-semibold ${
                        passwordStrength.score === 0 ? 'text-red-600' :
                        passwordStrength.score === 1 ? 'text-orange-600' :
                        passwordStrength.score === 2 ? 'text-yellow-600' :
                        passwordStrength.score === 3 ? 'text-green-600' :
                        'text-emerald-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Use uppercase, numbers, and special characters for stronger security
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || emailError}
                className="w-full py-2 px-3 bg-gradient-to-r from-[#0A2FF1] via-[#0818A8] to-[#0a23d8] text-white font-semibold text-xs rounded-md hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-3 focus:ring-blue-300/50"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <UserPlus className="w-5 h-5" />
                    <span>Create Account</span>
                  </div>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-3 pt-3 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-[#0A2FF1] hover:text-[#0818A8] transition-colors"
                >
                  Sign in
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

export default Register;