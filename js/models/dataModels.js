/**
 * dataModels.js - Data Models for SaleOrderForecast
 * Defines structured data models for consistent data handling throughout the application
 */

/**
 * Base model with common utility methods
 */
class BaseModel {
  /**
   * Create a new model instance
   * @param {Object} data - Initial data
   */
  constructor(data = {}) {
    this.updateFromData(data);
  }
  
  /**
   * Update model from data object
   * @param {Object} data - Data to update from
   * @returns {BaseModel} - This instance for chaining
   */
  updateFromData(data) {
    Object.assign(this, data);
    return this;
  }
  
  /**
   * Convert model to plain object
   * @returns {Object} - Plain object representation
   */
  toObject() {
    return { ...this };
  }
  
  /**
   * Convert model to JSON string
   * @returns {string} - JSON string representation
   */
  toJSON() {
    return JSON.stringify(this.toObject());
  }
  
  /**
   * Create a model instance from JSON string
   * @param {string} json - JSON string
   * @returns {BaseModel} - New model instance
   */
  static fromJSON(json) {
    try {
      const data = JSON.parse(json);
      return new this(data);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return new this();
    }
  }
}

/**
 * Deal model representing a sales deal
 */
class Deal extends BaseModel {
  /**
   * Create a new Deal instance
   * @param {Object} data - Initial deal data
   */
  constructor(data = {}) {
    super({
      id: null,
      customerName: '',
      projectName: '',
      dealStage: 'prospect',
      dealValue: 0,
      probability: 0,
      closeDate: null,
      salesRep: '',
      lossReason: '',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    });
    
    // Convert string dates to Date objects
    if (typeof this.closeDate === 'string') {
      this.closeDate = new Date(this.closeDate);
    }
    
    if (typeof this.createdAt === 'string') {
      this.createdAt = new Date(this.createdAt);
    }
    
    if (typeof this.updatedAt === 'string') {
      this.updatedAt = new Date(this.updatedAt);
    }
  }
  
  /**
   * Calculate weighted value (deal value * probability)
   * @returns {number} - Weighted deal value
   */
  get weightedValue() {
    return this.dealValue * (this.probability / 100);
  }
  
  /**
   * Check if deal is closed
   * @returns {boolean} - Whether deal is closed
   */
  get isClosed() {
    return this.dealStage === 'closed-won' || this.dealStage === 'closed-lost';
  }
  
  /**
   * Check if deal is won
   * @returns {boolean} - Whether deal is won
   */
  get isWon() {
    return this.dealStage === 'closed-won';
  }
  
  /**
   * Check if deal is lost
   * @returns {boolean} - Whether deal is lost
   */
  get isLost() {
    return this.dealStage === 'closed-lost';
  }
  
  /**
   * Get days until close date
   * @returns {number} - Days until close date
   */
  get daysUntilClose() {
    const today = new Date();
    const closeDate = new Date(this.closeDate);
    const diffTime = closeDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Update the deal
   * @param {Object} data - Data to update
   * @returns {Deal} - This instance for chaining
   */
  update(data) {
    super.updateFromData(data);
    this.updatedAt = new Date().toISOString();
    return this;
  }
  
  /**
   * Convert to object for API
   * @returns {Object} - API-ready object
   */
  toApiObject() {
    const obj = this.toObject();
    
    // Format dates for API
    if (obj.closeDate instanceof Date) {
      obj.closeDate = obj.closeDate.toISOString();
    }
    
    if (obj.createdAt instanceof Date) {
      obj.createdAt = obj.createdAt.toISOString();
    }
    
    if (obj.updatedAt instanceof Date) {
      obj.updatedAt = obj.updatedAt.toISOString();
    }
    
    // Add calculated properties
    obj.weightedValue = this.weightedValue;
    obj.daysUntilClose = this.daysUntilClose;
    
    return obj;
  }
}

/**
 * User model representing a system user
 */
class User extends BaseModel {
  /**
   * Create a new User instance
   * @param {Object} data - Initial user data
   */
  constructor(data = {}) {
    super({
      id: null,
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'viewer',
      isActive: true,
      lastLogin: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    });
    
    // Don't include password in the model
    delete this.password;
    
    // Convert string dates to Date objects
    if (typeof this.lastLogin === 'string') {
      this.lastLogin = new Date(this.lastLogin);
    }
    
    if (typeof this.createdAt === 'string') {
      this.createdAt = new Date(this.createdAt);
    }
    
    if (typeof this.updatedAt === 'string') {
      this.updatedAt = new Date(this.updatedAt);
    }
  }
  
  /**
   * Get full name
   * @returns {string} - Full name
   */
  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }
  
  /**
   * Check if user is admin
   * @returns {boolean} - Whether user is admin
   */
  get isAdmin() {
    return this.role === 'admin';
  }
  
  /**
   * Check if user can edit
   * @returns {boolean} - Whether user can edit
   */
  get canEdit() {
    return this.role === 'admin' || this.role === 'editor';
  }
  
  /**
   * Update the user
   * @param {Object} data - Data to update
   * @returns {User} - This instance for chaining
   */
  update(data) {
    super.updateFromData(data);
    this.updatedAt = new Date().toISOString();
    
    // Don't include password in the model
    delete this.password;
    
    return this;
  }
  
  /**
   * Convert to object for API (excluding sensitive data)
   * @returns {Object} - API-ready object
   */
  toApiObject() {
    const obj = this.toObject();
    
    // Format dates for API
    if (obj.lastLogin instanceof Date) {
      obj.lastLogin = obj.lastLogin.toISOString();
    }
    
    if (obj.createdAt instanceof Date) {
      obj.createdAt = obj.createdAt.toISOString();
    }
    
    if (obj.updatedAt instanceof Date) {
      obj.updatedAt = obj.updatedAt.toISOString();
    }
    
    // Add calculated properties
    obj.fullName = this.fullName;
    
    return obj;
  }
}

/**
 * ForecastData model representing forecast data
 */
class ForecastData extends BaseModel {
  /**
   * Create a new ForecastData instance
   * @param {Object} data - Initial forecast data
   */
  constructor(data = {}) {
    super({
      id: null,
      name: '',
      description: '',
      forecastPeriods: 3,
      confidenceLevel: 0.95,
      seasonalityPattern: 'auto',
      includeOutliers: false,
      forecast: [],
      trend: {},
      seasonality: {},
      dataPoints: 0,
      generatedAt: new Date().toISOString(),
      createdBy: null,
      ...data
    });
    
    // Convert string dates to Date objects
    if (typeof this.generatedAt === 'string') {
      this.generatedAt = new Date(this.generatedAt);
    }
    
    // Convert forecast dates
    if (Array.isArray(this.forecast)) {
      this.forecast = this.forecast.map(point => ({
        ...point,
        date: typeof point.date === 'string' ? new Date(point.date) : point.date
      }));
    }
  }
  
  /**
   * Get total forecast value (sum of all forecast points)
   * @returns {number} - Total forecast value
   */
  get totalForecastValue() {
    if (!Array.isArray(this.forecast)) return 0;
    return this.forecast.reduce((sum, point) => sum + point.value, 0);
  }
  
  /**
   * Get average forecast value
   * @returns {number} - Average forecast value
   */
  get averageForecastValue() {
    if (!Array.isArray(this.forecast) || this.forecast.length === 0) return 0;
    return this.totalForecastValue / this.forecast.length;
  }
  
  /**
   * Convert to object for API
   * @returns {Object} - API-ready object
   */
  toApiObject() {
    const obj = this.toObject();
    
    // Format dates for API
    if (obj.generatedAt instanceof Date) {
      obj.generatedAt = obj.generatedAt.toISOString();
    }
    
    // Format forecast dates
    if (Array.isArray(obj.forecast)) {
      obj.forecast = obj.forecast.map(point => ({
        ...point,
        date: point.date instanceof Date ? point.date.toISOString() : point.date
      }));
    }
    
    // Add calculated properties
    obj.totalForecastValue = this.totalForecastValue;
    obj.averageForecastValue = this.averageForecastValue;
    
    return obj;
  }
}

/**
 * CategoryAnalysis model representing category analysis data
 */
class CategoryAnalysis extends BaseModel {
  /**
   * Create a new CategoryAnalysis instance
   * @param {Object} data - Initial category analysis data
   */
  constructor(data = {}) {
    super({
      id: null,
      name: '',
      description: '',
      categories: [],
      totalSales: 0,
      topCategory: null,
      categoryCount: 0,
      analysisDate: new Date().toISOString(),
      createdBy: null,
      ...data
    });
    
    // Convert string dates to Date objects
    if (typeof this.analysisDate === 'string') {
      this.analysisDate = new Date(this.analysisDate);
    }
  }
  
  /**
   * Get category by name
   * @param {string} categoryName - Category name
   * @returns {Object|null} - Category object or null if not found
   */
  getCategoryByName(categoryName) {
    if (!Array.isArray(this.categories)) return null;
    return this.categories.find(category => category.category === categoryName) || null;
  }
  
  /**
   * Convert to object for API
   * @returns {Object} - API-ready object
   */
  toApiObject() {
    const obj = this.toObject();
    
    // Format dates for API
    if (obj.analysisDate instanceof Date) {
      obj.analysisDate = obj.analysisDate.toISOString();
    }
    
    return obj;
  }
}

// Export all models
export {
  BaseModel,
  Deal,
  User,
  ForecastData,
  CategoryAnalysis
};
