/**
 * mockServices.js - Mock implementations of service modules for testing
 * Provides mock implementations of API service modules to use in tests
 */

// Mock deal data
export const mockDeals = [
  {
    id: 1,
    name: 'Enterprise Software Solution',
    amount: 125000,
    probability: 0.8,
    stage: 'Proposal Sent',
    salesRep: 'John Smith',
    expectedCloseDate: '2025-06-15',
    lastUpdated: '2025-05-10T14:30:00Z',
    company: 'Acme Corp',
    notes: 'Client is very interested, follow up next week'
  },
  {
    id: 2,
    name: 'Cloud Migration Project',
    amount: 85000,
    probability: 0.6,
    stage: 'Negotiation',
    salesRep: 'Sarah Johnson',
    expectedCloseDate: '2025-07-01',
    lastUpdated: '2025-05-12T09:15:00Z',
    company: 'TechStart Inc',
    notes: 'Discussing final pricing details'
  },
  {
    id: 3,
    name: 'Security Audit Services',
    amount: 45000,
    probability: 0.9,
    stage: 'Verbal Agreement',
    salesRep: 'Michael Wong',
    expectedCloseDate: '2025-05-30',
    lastUpdated: '2025-05-14T16:45:00Z',
    company: 'SecureBank',
    notes: 'Verbal agreement reached, waiting for paperwork'
  },
  {
    id: 4,
    name: 'Data Analytics Platform',
    amount: 150000,
    probability: 0.4,
    stage: 'Discovery',
    salesRep: 'Emily Chen',
    expectedCloseDate: '2025-08-15',
    lastUpdated: '2025-05-08T11:20:00Z',
    company: 'DataViz Corp',
    notes: 'Initial requirements gathering in progress'
  },
  {
    id: 5,
    name: 'Mobile App Development',
    amount: 95000,
    probability: 0.7,
    stage: 'Proposal Sent',
    salesRep: 'John Smith',
    expectedCloseDate: '2025-07-10',
    lastUpdated: '2025-05-11T13:40:00Z',
    company: 'MobileFirst Ltd',
    notes: 'Proposal well received, expecting feedback soon'
  }
];

// Mock user data
export const mockUsers = [
  {
    id: 1,
    username: 'jsmith',
    name: 'John Smith',
    email: 'john.smith@example.com',
    role: 'sales_rep',
    lastLogin: '2025-05-16T08:30:00Z'
  },
  {
    id: 2,
    username: 'sjohnson',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    role: 'sales_rep',
    lastLogin: '2025-05-15T16:45:00Z'
  },
  {
    id: 3,
    username: 'mwong',
    name: 'Michael Wong',
    email: 'michael.wong@example.com',
    role: 'sales_rep',
    lastLogin: '2025-05-16T09:15:00Z'
  },
  {
    id: 4,
    username: 'echen',
    name: 'Emily Chen',
    email: 'emily.chen@example.com',
    role: 'sales_rep',
    lastLogin: '2025-05-14T14:20:00Z'
  },
  {
    id: 5,
    username: 'admin',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    lastLogin: '2025-05-16T10:00:00Z'
  }
];

// Mock deal history data
export const mockDealHistory = [
  {
    id: 1,
    dealId: 1,
    field: 'stage',
    oldValue: 'Discovery',
    newValue: 'Proposal Sent',
    changedBy: 'John Smith',
    changedAt: '2025-05-05T10:30:00Z'
  },
  {
    id: 2,
    dealId: 1,
    field: 'amount',
    oldValue: '100000',
    newValue: '125000',
    changedBy: 'John Smith',
    changedAt: '2025-05-08T14:15:00Z'
  },
  {
    id: 3,
    dealId: 1,
    field: 'probability',
    oldValue: '0.6',
    newValue: '0.8',
    changedBy: 'John Smith',
    changedAt: '2025-05-10T14:30:00Z'
  },
  {
    id: 4,
    dealId: 2,
    field: 'stage',
    oldValue: 'Proposal Sent',
    newValue: 'Negotiation',
    changedBy: 'Sarah Johnson',
    changedAt: '2025-05-12T09:15:00Z'
  },
  {
    id: 5,
    dealId: 3,
    field: 'stage',
    oldValue: 'Negotiation',
    newValue: 'Verbal Agreement',
    changedBy: 'Michael Wong',
    changedAt: '2025-05-14T16:45:00Z'
  }
];

// Mock forecasting data
export const mockForecasting = {
  predictions: [
    { month: '2025-05', amount: 145000, probability: 0.85 },
    { month: '2025-06', amount: 210000, probability: 0.75 },
    { month: '2025-07', amount: 180000, probability: 0.65 },
    { month: '2025-08', amount: 250000, probability: 0.55 },
    { month: '2025-09', amount: 300000, probability: 0.45 }
  ],
  trends: {
    monthlyGrowth: 0.12,
    quarterlyGrowth: 0.28,
    yearlyGrowth: 0.35
  },
  scenarios: {
    optimistic: {
      totalAmount: 1200000,
      probability: 0.3
    },
    realistic: {
      totalAmount: 1085000,
      probability: 0.6
    },
    pessimistic: {
      totalAmount: 950000,
      probability: 0.9
    }
  }
};

// Mock Deal Service
export const mockDealService = {
  getAllDeals: jest.fn().mockResolvedValue(mockDeals),
  getDealById: jest.fn().mockImplementation((id) => {
    const deal = mockDeals.find(d => d.id === Number(id));
    return Promise.resolve(deal || null);
  }),
  createDeal: jest.fn().mockImplementation((dealData) => {
    const newDeal = {
      id: Math.max(...mockDeals.map(d => d.id)) + 1,
      ...dealData,
      lastUpdated: new Date().toISOString()
    };
    return Promise.resolve(newDeal);
  }),
  updateDeal: jest.fn().mockImplementation((id, dealData) => {
    const index = mockDeals.findIndex(d => d.id === Number(id));
    if (index === -1) {
      return Promise.reject(new Error('Deal not found'));
    }
    const updatedDeal = {
      ...mockDeals[index],
      ...dealData,
      id: Number(id),
      lastUpdated: new Date().toISOString()
    };
    return Promise.resolve(updatedDeal);
  }),
  deleteDeal: jest.fn().mockImplementation((id) => {
    const index = mockDeals.findIndex(d => d.id === Number(id));
    if (index === -1) {
      return Promise.reject(new Error('Deal not found'));
    }
    return Promise.resolve({ success: true, message: 'Deal deleted successfully' });
  }),
  getDealHistory: jest.fn().mockImplementation((id) => {
    const history = mockDealHistory.filter(h => h.dealId === Number(id));
    return Promise.resolve(history);
  }),
  exportDeals: jest.fn().mockResolvedValue(new Blob(['mock csv data'], { type: 'text/csv' }))
};

// Mock User Service
export const mockUserService = {
  getAllUsers: jest.fn().mockResolvedValue(mockUsers),
  getCurrentUserProfile: jest.fn().mockResolvedValue(mockUsers[0]),
  updateUserProfile: jest.fn().mockImplementation((id, userData) => {
    const index = mockUsers.findIndex(u => u.id === Number(id));
    if (index === -1) {
      return Promise.reject(new Error('User not found'));
    }
    const updatedUser = {
      ...mockUsers[index],
      ...userData,
      id: Number(id)
    };
    return Promise.resolve(updatedUser);
  }),
  changePassword: jest.fn().mockResolvedValue({ success: true, message: 'Password changed successfully' }),
  getUserPreferences: jest.fn().mockResolvedValue({
    theme: 'light',
    defaultView: 'table',
    notifications: true,
    dashboardLayout: 'default'
  }),
  updateUserPreferences: jest.fn().mockResolvedValue({
    theme: 'dark',
    defaultView: 'table',
    notifications: true,
    dashboardLayout: 'custom'
  })
};

// Mock Report Service
export const mockReportService = {
  generateReport: jest.fn().mockResolvedValue(new Blob(['mock report data'], { type: 'application/pdf' })),
  generatePdfReport: jest.fn().mockResolvedValue(new Blob(['mock pdf data'], { type: 'application/pdf' })),
  generateExcelReport: jest.fn().mockResolvedValue(new Blob(['mock excel data'], { type: 'application/vnd.ms-excel' })),
  generateCsvReport: jest.fn().mockResolvedValue(new Blob(['mock csv data'], { type: 'text/csv' })),
  emailReport: jest.fn().mockResolvedValue({ success: true, message: 'Report sent successfully' }),
  getSavedReports: jest.fn().mockResolvedValue([
    { id: 1, name: 'Monthly Sales Report', format: 'pdf', createdAt: '2025-05-10T14:30:00Z' },
    { id: 2, name: 'Quarterly Forecast', format: 'excel', createdAt: '2025-05-12T09:15:00Z' }
  ])
};

// Mock Forecasting Service
export const mockForecastingService = {
  getPrediction: jest.fn().mockResolvedValue(mockForecasting.predictions),
  generateScenarios: jest.fn().mockResolvedValue(mockForecasting.scenarios),
  getTrendAnalysis: jest.fn().mockResolvedValue(mockForecasting.trends),
  getSalesVelocity: jest.fn().mockResolvedValue({
    averageDealSize: 100000,
    averageSalesCycle: 45,
    winRate: 0.65,
    numberOfDeals: 12
  }),
  getWinRateAnalysis: jest.fn().mockResolvedValue({
    overall: 0.65,
    byStage: {
      'Discovery': 0.9,
      'Proposal Sent': 0.8,
      'Negotiation': 0.7,
      'Verbal Agreement': 0.95
    },
    byRep: {
      'John Smith': 0.7,
      'Sarah Johnson': 0.65,
      'Michael Wong': 0.8,
      'Emily Chen': 0.6
    }
  })
};

// Export all mock services
export const mockServices = {
  dealService: mockDealService,
  userService: mockUserService,
  reportService: mockReportService,
  forecastingService: mockForecastingService
};
