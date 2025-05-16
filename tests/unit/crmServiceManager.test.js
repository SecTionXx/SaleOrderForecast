/**
 * Unit tests for CRM Service Manager
 */

import crmServiceManager from '../../js/services/crm/crmServiceManager.js';
import salesforceCrmService from '../../js/services/crm/salesforceCrmService.js';
import hubspotCrmService from '../../js/services/crm/hubspotCrmService.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock CRM services
jest.mock('../../js/services/crm/salesforceCrmService.js', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(true),
    authenticate: jest.fn().mockResolvedValue({ success: true }),
    testConnection: jest.fn().mockResolvedValue({ success: true }),
    getObjectTypes: jest.fn().mockResolvedValue([
      { name: 'Account', label: 'Account' },
      { name: 'Contact', label: 'Contact' }
    ]),
    getObjectFields: jest.fn().mockResolvedValue([
      { name: 'Id', label: 'ID', type: 'id' },
      { name: 'Name', label: 'Name', type: 'string' }
    ]),
    fetchRecords: jest.fn().mockResolvedValue({
      records: [{ Id: '1', Name: 'Test' }],
      totalSize: 1,
      done: true
    }),
    fetchRecordById: jest.fn().mockResolvedValue({ Id: '1', Name: 'Test' }),
    createRecord: jest.fn().mockResolvedValue({ Id: '2', Name: 'New Record' }),
    updateRecord: jest.fn().mockResolvedValue({ Id: '1', Name: 'Updated Record' }),
    deleteRecord: jest.fn().mockResolvedValue(true),
    searchRecords: jest.fn().mockResolvedValue([{ Id: '1', Name: 'Test' }]),
    syncData: jest.fn().mockResolvedValue({
      created: 1,
      updated: 1,
      errors: []
    }),
    getFieldMapping: jest.fn().mockResolvedValue({}),
    setFieldMapping: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('../../js/services/crm/hubspotCrmService.js', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(true),
    authenticate: jest.fn().mockResolvedValue({ success: true }),
    testConnection: jest.fn().mockResolvedValue({ success: true }),
    getObjectTypes: jest.fn().mockResolvedValue([
      { name: 'contacts', label: 'Contacts' },
      { name: 'companies', label: 'Companies' }
    ]),
    getObjectFields: jest.fn().mockResolvedValue([
      { name: 'id', label: 'ID', type: 'string' },
      { name: 'name', label: 'Name', type: 'string' }
    ]),
    fetchRecords: jest.fn().mockResolvedValue({
      records: [{ id: '1', name: 'Test' }],
      total: 1
    }),
    fetchRecordById: jest.fn().mockResolvedValue({ id: '1', name: 'Test' }),
    createRecord: jest.fn().mockResolvedValue({ id: '2', name: 'New Record' }),
    updateRecord: jest.fn().mockResolvedValue({ id: '1', name: 'Updated Record' }),
    deleteRecord: jest.fn().mockResolvedValue(true),
    searchRecords: jest.fn().mockResolvedValue({
      records: [{ id: '1', name: 'Test' }],
      total: 1
    }),
    syncData: jest.fn().mockResolvedValue({
      created: 1,
      updated: 1,
      errors: []
    }),
    getFieldMapping: jest.fn().mockResolvedValue({}),
    setFieldMapping: jest.fn().mockResolvedValue(true)
  }
}));

describe('CRM Service Manager', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorage.clear();
    
    // Reset CRM service manager state
    crmServiceManager.activeService = null;
    crmServiceManager.activeCrmType = null;
    crmServiceManager.isInitialized = false;
    crmServiceManager.config = {};
  });

  describe('initialization', () => {
    test('should initialize with no active CRM', async () => {
      const result = await crmServiceManager.initialize();
      
      expect(result).toBe(false);
      expect(crmServiceManager.isInitialized).toBe(false);
      expect(crmServiceManager.activeService).toBeNull();
      expect(crmServiceManager.activeCrmType).toBeNull();
    });

    test('should initialize with saved configuration', async () => {
      // Set up localStorage with saved config
      localStorage.setItem('crm_service_config', JSON.stringify({
        config: {
          salesforce: {
            clientId: 'test-client-id'
          }
        },
        activeCrmType: 'salesforce'
      }));
      
      const result = await crmServiceManager.initialize();
      
      expect(result).toBe(true);
      expect(crmServiceManager.isInitialized).toBe(true);
      expect(crmServiceManager.activeService).toBe(salesforceCrmService);
      expect(crmServiceManager.activeCrmType).toBe('salesforce');
      expect(salesforceCrmService.initialize).toHaveBeenCalledWith({
        clientId: 'test-client-id'
      });
    });
  });

  describe('CRM type management', () => {
    test('should get available CRM types', () => {
      const types = crmServiceManager.getAvailableCrmTypes();
      
      expect(types).toHaveLength(2);
      expect(types).toContainEqual({ id: 'salesforce', name: 'Salesforce' });
      expect(types).toContainEqual({ id: 'hubspot', name: 'HubSpot' });
    });

    test('should set active CRM type', async () => {
      const config = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret'
      };
      
      const result = await crmServiceManager.setActiveCrmType('salesforce', config);
      
      expect(result).toBe(true);
      expect(crmServiceManager.activeCrmType).toBe('salesforce');
      expect(crmServiceManager.activeService).toBe(salesforceCrmService);
      expect(salesforceCrmService.initialize).toHaveBeenCalledWith(config);
      
      // Check that config was saved to localStorage
      expect(localStorage.setItem).toHaveBeenCalled();
      const savedConfig = JSON.parse(localStorage.getItem.mock.results[0].value);
      expect(savedConfig.activeCrmType).toBe('salesforce');
      expect(savedConfig.config.salesforce.clientId).toBe('test-client-id');
      expect(savedConfig.config.salesforce.clientSecret).toBeUndefined(); // Sensitive data should be removed
    });

    test('should handle unsupported CRM type', async () => {
      const result = await crmServiceManager.setActiveCrmType('unsupported');
      
      expect(result).toBe(false);
      expect(crmServiceManager.activeCrmType).toBeNull();
      expect(crmServiceManager.activeService).toBeNull();
    });
  });

  describe('configuration management', () => {
    test('should get CRM configuration', async () => {
      // Set up config
      crmServiceManager.config = {
        salesforce: {
          clientId: 'test-client-id'
        }
      };
      
      const config = crmServiceManager.getCrmConfig('salesforce');
      
      expect(config).toEqual({ clientId: 'test-client-id' });
    });

    test('should update CRM configuration', async () => {
      const result = crmServiceManager.updateCrmConfig('salesforce', {
        clientId: 'new-client-id'
      });
      
      expect(result).toBe(true);
      expect(crmServiceManager.config.salesforce.clientId).toBe('new-client-id');
      
      // Check that config was saved to localStorage
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    test('should handle unsupported CRM type in config update', async () => {
      const result = crmServiceManager.updateCrmConfig('unsupported', {});
      
      expect(result).toBe(false);
    });
  });

  describe('service operations', () => {
    beforeEach(async () => {
      // Set up active service
      await crmServiceManager.setActiveCrmType('salesforce', {});
    });

    test('should authenticate with active service', async () => {
      const credentials = { grantType: 'password', username: 'test', password: 'test' };
      const result = await crmServiceManager.authenticate(credentials);
      
      expect(result.success).toBe(true);
      expect(salesforceCrmService.authenticate).toHaveBeenCalledWith(credentials);
    });

    test('should test connection with active service', async () => {
      const result = await crmServiceManager.testConnection();
      
      expect(result.success).toBe(true);
      expect(salesforceCrmService.testConnection).toHaveBeenCalled();
    });

    test('should get object types from active service', async () => {
      const result = await crmServiceManager.getObjectTypes();
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Account');
      expect(salesforceCrmService.getObjectTypes).toHaveBeenCalled();
    });

    test('should get object fields from active service', async () => {
      const result = await crmServiceManager.getObjectFields('Account');
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Id');
      expect(salesforceCrmService.getObjectFields).toHaveBeenCalledWith('Account');
    });

    test('should fetch records from active service', async () => {
      const options = { fields: ['Id', 'Name'], limit: 10 };
      const result = await crmServiceManager.fetchRecords('Account', options);
      
      expect(result.records).toHaveLength(1);
      expect(result.records[0].Id).toBe('1');
      expect(salesforceCrmService.fetchRecords).toHaveBeenCalledWith('Account', options);
    });

    test('should fetch record by ID from active service', async () => {
      const result = await crmServiceManager.fetchRecordById('Account', '1');
      
      expect(result.Id).toBe('1');
      expect(salesforceCrmService.fetchRecordById).toHaveBeenCalledWith('Account', '1');
    });

    test('should create record with active service', async () => {
      const data = { Name: 'New Record' };
      const result = await crmServiceManager.createRecord('Account', data);
      
      expect(result.Id).toBe('2');
      expect(salesforceCrmService.createRecord).toHaveBeenCalledWith('Account', data);
    });

    test('should update record with active service', async () => {
      const data = { Name: 'Updated Record' };
      const result = await crmServiceManager.updateRecord('Account', '1', data);
      
      expect(result.Name).toBe('Updated Record');
      expect(salesforceCrmService.updateRecord).toHaveBeenCalledWith('Account', '1', data);
    });

    test('should delete record with active service', async () => {
      const result = await crmServiceManager.deleteRecord('Account', '1');
      
      expect(result).toBe(true);
      expect(salesforceCrmService.deleteRecord).toHaveBeenCalledWith('Account', '1');
    });

    test('should search records with active service', async () => {
      const query = 'Test';
      const options = { fields: ['Id', 'Name'] };
      const result = await crmServiceManager.searchRecords('Account', query, options);
      
      expect(Array.isArray(result)).toBe(true);
      expect(salesforceCrmService.searchRecords).toHaveBeenCalledWith('Account', query, options);
    });

    test('should sync data with active service', async () => {
      const options = { direction: 'both', localData: [] };
      const result = await crmServiceManager.syncData('Account', options);
      
      expect(result.created).toBe(1);
      expect(result.updated).toBe(1);
      expect(salesforceCrmService.syncData).toHaveBeenCalledWith('Account', options);
    });

    test('should get field mapping from active service', async () => {
      const result = await crmServiceManager.getFieldMapping('Account');
      
      expect(result).toEqual({});
      expect(salesforceCrmService.getFieldMapping).toHaveBeenCalledWith('Account');
    });

    test('should set field mapping with active service', async () => {
      const mapping = { Id: 'id', Name: 'name' };
      const result = await crmServiceManager.setFieldMapping('Account', mapping);
      
      expect(result).toBe(true);
      expect(salesforceCrmService.setFieldMapping).toHaveBeenCalledWith('Account', mapping);
    });

    test('should handle errors when no active service', async () => {
      // Reset active service
      crmServiceManager.activeService = null;
      
      await expect(crmServiceManager.getObjectTypes()).rejects.toThrow('No active CRM service');
      await expect(crmServiceManager.fetchRecords('Account')).rejects.toThrow('No active CRM service');
    });
  });

  describe('switching CRM services', () => {
    test('should switch between CRM services', async () => {
      // Set Salesforce as active
      await crmServiceManager.setActiveCrmType('salesforce', {});
      
      expect(crmServiceManager.activeCrmType).toBe('salesforce');
      expect(crmServiceManager.activeService).toBe(salesforceCrmService);
      
      // Switch to HubSpot
      await crmServiceManager.setActiveCrmType('hubspot', {});
      
      expect(crmServiceManager.activeCrmType).toBe('hubspot');
      expect(crmServiceManager.activeService).toBe(hubspotCrmService);
      
      // Verify that HubSpot service is used for operations
      await crmServiceManager.getObjectTypes();
      expect(hubspotCrmService.getObjectTypes).toHaveBeenCalled();
      expect(salesforceCrmService.getObjectTypes).not.toHaveBeenCalled();
    });
  });
});
