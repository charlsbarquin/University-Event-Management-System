// uems-frontend/src/components/layout/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Menu, 
  X, 
  Calendar, 
  PlusCircle, 
  Shield, 
  LogOut,
  LayoutDashboard,
  ChevronDown,
  User,
  Mail,
  Badge,
  Sparkles
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeUnderline, setActiveUnderline] = useState({ width: 0, left: 0 });

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update active underline position
  useEffect(() => {
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) {
      const { offsetWidth, offsetLeft } = activeLink;
      setActiveUnderline({ width: offsetWidth, left: offsetLeft });
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  // Navigation links
  const navLinks = [
    { 
      name: 'Browse Events', 
      path: '/events', 
      icon: Calendar, 
      show: isAuthenticated,
    },
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      show: isAuthenticated,
    },
    { 
      name: 'Create Event', 
      path: '/events/create', 
      icon: PlusCircle, 
      show: isAuthenticated && (user?.role === 'student' || user?.role === 'organizer' || user?.role === 'admin'),
    },
    { 
      name: 'Admin Panel', 
      path: '/admin', 
      icon: Shield, 
      show: user?.role === 'admin',
    },
  ];

  const roleColors = {
    admin: { 
      bg: 'bg-red-500',
      text: 'text-red-600',
      light: 'bg-red-50',
      border: 'border-red-100',
      gradient: 'from-red-500 to-red-600'
    },
    organizer: { 
      bg: 'bg-[#FF5F1F]',
      text: 'text-[#FF5F1F]',
      light: 'bg-orange-50',
      border: 'border-orange-100',
      gradient: 'from-[#FF5F1F] to-orange-500'
    },
    student: { 
      bg: 'bg-[#0818A8]',
      text: 'text-[#0818A8]',
      light: 'bg-blue-50',
      border: 'border-blue-100',
      gradient: 'from-[#0818A8] to-blue-600'
    }
  };

  const currentRole = user?.role || 'student';
  const colors = roleColors[currentRole];
  const userInitials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'U';

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 font-sans ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-100' : 'bg-white border-b border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo Section */}
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center space-x-3 group"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-[#0818A8]/10 to-[#FF5F1F]/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img 
                    src="/uems_logo.png" 
                    alt="UEMS Logo" 
                    className="w-14 h-15 object-contain relative z-10 transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230818A8'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-2xl bg-gradient-to-r from-[#0818A8] to-[#0a23d8] bg-clip-text text-transparent">
                    UEMS
                  </span>
                  <span className="text-xs text-gray-500 font-medium tracking-wide">
                    University Event Management
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation with sliding underline */}
              <div className="hidden lg:flex items-center ml-12 relative">
                <div className="flex space-x-3">
                  {navLinks.map((link) => 
                    link.show && (
                      <Link
                        key={link.name}
                        to={link.path}
                        className={`nav-link group relative px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap ${
                          location.pathname === link.path 
                            ? 'active text-[#0818A8]' 
                            : 'text-gray-600 hover:text-[#0818A8]'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <link.icon size={16} className={`transition-transform duration-200 ${location.pathname === link.path ? 'scale-110' : 'group-hover:scale-110'}`} />
                          <span>{link.name}</span>
                        </div>
                      </Link>
                    )
                  )}
                </div>
                {/* Sliding underline */}
                <div 
                  className="absolute bottom-0 h-0.5 bg-[#0818A8] rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${activeUnderline.width}px`,
                    left: `${activeUnderline.left}px`,
                  }}
                />
              </div>
            </div>

            {/* Right Section - Consolidated user dropdown */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* Desktop User Dropdown */}
                  <div className="hidden lg:block relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-[#0818A8]/20"
                    >
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 leading-tight">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                      </div>
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center text-white font-semibold shadow-sm transition-transform duration-300 group-hover:scale-105`}>
                          {userInitials}
                        </div>
                        {user?.role !== 'student' && (
                          <ChevronDown 
                            size={14} 
                            className={`absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} 
                          />
                        )}
                      </div>
                    </button>

                    {/* User Dropdown Menu - Structured and organized */}
                    {userMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-14 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-4 z-50 animate-fadeIn">
                          {/* User Info Section */}
                          <div className="px-5 pb-4 border-b border-gray-100">
                            <div className="flex items-start space-x-4">
                              <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                                {userInitials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-base">{user.firstName} {user.lastName}</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${colors.text} ${colors.light} ${colors.border}`}>
                                    {currentRole.toUpperCase()}
                                  </div>
                                  <Sparkles className="text-[#FF5F1F] w-3 h-3" />
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Mail size={14} className="text-gray-400" />
                                <span className="truncate">{user.email}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <User size={14} className="text-gray-400" />
                                <span>Student ID: {user.studentId || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Navigation Quick Links */}
                          <div className="px-5 py-3">
                            <h4 className="text-xs uppercase text-gray-400 font-semibold tracking-wider mb-2">Quick Access</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {navLinks.map((link) => 
                                link.show && (
                                  <Link
                                    key={link.name}
                                    to={link.path}
                                    onClick={() => setUserMenuOpen(false)}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-150 text-sm ${
                                      location.pathname === link.path 
                                        ? `${colors.light} ${colors.text} font-medium` 
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <link.icon size={14} />
                                    <span className="truncate">{link.name}</span>
                                  </Link>
                                )
                              )}
                            </div>
                          </div>

                          {/* Sign Out Button */}
                          <div className="px-5 pt-3 border-t border-gray-100">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150 font-medium group/logout"
                            >
                              <LogOut size={16} className="group-hover/logout:rotate-12 transition-transform duration-200" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden p-2.5 rounded-lg hover:bg-gray-100 transition-all duration-200 focus:outline-none"
                    aria-label="Toggle menu"
                  >
                    <div className="relative w-6 h-6">
                      <Menu 
                        size={24} 
                        className={`absolute inset-0 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`} 
                      />
                      <X 
                        size={24} 
                        className={`absolute inset-0 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} 
                      />
                    </div>
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="px-4 py-2.5 text-[#0818A8] hover:text-[#0a23d8] font-medium rounded-lg hover:bg-[#0818A8]/5 transition-all duration-200 text-sm"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 bg-gradient-to-r from-[#0818A8] to-[#0818A8]/90 text-white rounded-lg font-semibold hover:shadow-md hover:shadow-[#0818A8]/20 transition-all duration-200 text-sm shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu - Enhanced with structured layout */}
        {mobileMenuOpen && isAuthenticated && (
          <>
            <div 
              className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed top-0 left-0 right-0 bottom-0 bg-white z-50 lg:hidden flex flex-col animate-slideIn">
              {/* Mobile Header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img 
                      src="/uems_logo.png" 
                      alt="UEMS Logo" 
                      className="w-12 h-12 object-contain"
                    />
                    <div>
                      <span className="font-bold text-lg bg-gradient-to-r from-[#0818A8] to-[#0a23d8] bg-clip-text text-transparent">
                        UEMS
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>

              {/* User Profile Section */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-full ${colors.bg} flex items-center justify-center text-white font-bold text-xl shadow-sm`}>
                    {userInitials}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{user.firstName} {user.lastName}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${colors.text} ${colors.light} ${colors.border}`}>
                        {currentRole.toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-500 truncate">{user.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto py-4">
                <div className="px-5 space-y-1">
                  {navLinks.map((link) => 
                    link.show && (
                      <Link
                        key={link.name}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-150 ${
                          location.pathname === link.path 
                            ? `${colors.light} ${colors.text} font-semibold` 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${location.pathname === link.path ? colors.light : 'bg-gray-100'}`}>
                          <link.icon size={18} className={location.pathname === link.path ? colors.text : 'text-gray-600'} />
                        </div>
                        <span className="font-medium text-sm flex-1">{link.name}</span>
                        {location.pathname === link.path && (
                          <div className={`w-2 h-2 rounded-full ${colors.bg}`}></div>
                        )}
                      </Link>
                    )
                  )}
                </div>
              </div>

              {/* Sign Out Button */}
              <div className="p-5 border-t border-gray-100 bg-white">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2.5 px-4 py-3.5 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-150 font-medium"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default Navbar;