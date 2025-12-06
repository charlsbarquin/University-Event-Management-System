const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const debugAdminAuthFlow = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = require('./models/User');
    const { auth, adminAuth } = require('./middleware/auth');
    
    // Test the middleware chain directly
    console.log('🧪 Testing middleware chain...');
    
    const testToken = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with your actual token
    
    // Mock request
    const mockReq = {
      header: (field) => {
        if (field === 'Authorization') return `Bearer ${testToken}`;
        return null;
      }
    };
    
    const mockRes = {
      status: function(code) {
        console.log(`   Response status: ${code}`);
        return this;
      },
      json: function(data) {
        console.log(`   Response data:`, data);
        return this;
      }
    };
    
    let mockNextCalled = false;
    const mockNext = () => {
      mockNextCalled = true;
      console.log('   ✅ Next() called - auth passed');
    };
    
    console.log('1. Testing auth middleware...');
    await auth(mockReq, mockRes, mockNext);
    
    if (mockNextCalled && mockReq.user) {
      console.log('2. Testing adminAuth middleware...');
      console.log('   req.user:', mockReq.user.studentId, '- Role:', mockReq.user.role);
      
      mockNextCalled = false;
      await adminAuth(mockReq, mockRes, () => {
        mockNextCalled = true;
        console.log('   ✅ adminAuth passed - user has admin privileges');
      });
      
      if (!mockNextCalled) {
        console.log('   ❌ adminAuth blocked the request');
      }
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

debugAdminAuthFlow();