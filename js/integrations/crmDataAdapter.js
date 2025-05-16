/**
 * crmDataAdapter.js - CRM Data Adapter Module
 * Handles data transformation between CRM systems and local data model
 */

import { logDebug, logError } from '../utils/logger.js';
import { CRM_TYPES } from './crmConnector.js';

/**
 * Transform CRM data to local data format
 * @param {Array} crmData - Data from CRM system
 * @param {string} crmType - Type of CRM system
 * @param {Array} fieldMappings - Field mappings
 * @returns {Array} - Transformed data in local format
 */
function transformCrmDataToLocal(crmData, crmType, fieldMappings) {
  if (!crmData || !crmData.length) {
    return [];
  }
  
  try {
    // Get transformer for CRM type
    const transformer = getTransformer(crmType);
    if (!transformer) {
      logError(`No transformer found for CRM type: ${crmType}`);
      return [];
    }
    
    // Transform data
    const transformedData = crmData.map(item => transformer.toLocal(item, fieldMappings));
    logDebug(`Transformed ${transformedData.length} items from CRM to local format`);
    
    return transformedData;
  } catch (error) {
    logError('Error transforming CRM data to local format', error);
    return [];
  }
}

/**
 * Transform local data to CRM format
 * @param {Array} localData - Local data
 * @param {string} crmType - Type of CRM system
 * @param {Array} fieldMappings - Field mappings
 * @returns {Array} - Transformed data in CRM format
 */
function transformLocalDataToCrm(localData, crmType, fieldMappings) {
  if (!localData || !localData.length) {
    return [];
  }
  
  try {
    // Get transformer for CRM type
    const transformer = getTransformer(crmType);
    if (!transformer) {
      logError(`No transformer found for CRM type: ${crmType}`);
      return [];
    }
    
    // Transform data
    const transformedData = localData.map(item => transformer.toCrm(item, fieldMappings));
    logDebug(`Transformed ${transformedData.length} items from local to CRM format`);
    
    return transformedData;
  } catch (error) {
    logError('Error transforming local data to CRM format', error);
    return [];
  }
}

/**
 * Get transformer for CRM type
 * @param {string} crmType - Type of CRM system
 * @returns {Object|null} - Transformer object or null if not found
 */
function getTransformer(crmType) {
  switch (crmType) {
    case CRM_TYPES.SALESFORCE:
      return salesforceTransformer;
      
    case CRM_TYPES.HUBSPOT:
      return hubspotTransformer;
      
    case CRM_TYPES.ZOHO:
      return zohoTransformer;
      
    case CRM_TYPES.DYNAMICS:
      return dynamicsTransformer;
      
    case CRM_TYPES.CUSTOM:
      return customTransformer;
      
    default:
      return null;
  }
}

/**
 * Find mapping for field
 * @param {string} fieldId - Field ID
 * @param {Array} mappings - Field mappings
 * @param {string} direction - Direction of mapping ('to_crm' or 'from_crm')
 * @returns {Object|null} - Mapping object or null if not found
 */
function findMapping(fieldId, mappings, direction) {
  if (!mappings || !mappings.length) {
    return null;
  }
  
  // For to_crm direction, we're looking for localField matching fieldId
  // For from_crm direction, we're looking for crmField matching fieldId
  const sourceField = direction === 'to_crm' ? 'localField' : 'crmField';
  const targetField = direction === 'to_crm' ? 'crmField' : 'localField';
  
  const mapping = mappings.find(m => m[sourceField] === fieldId);
  if (!mapping) {
    return null;
  }
  
  // Check if mapping direction allows this transformation
  if (mapping.direction === 'both' || 
      (direction === 'to_crm' && mapping.direction === 'to_crm') ||
      (direction === 'from_crm' && mapping.direction === 'from_crm')) {
    return {
      source: fieldId,
      target: mapping[targetField]
    };
  }
  
  return null;
}

/**
 * Salesforce transformer
 */
const salesforceTransformer = {
  /**
   * Transform Salesforce data to local format
   * @param {Object} sfItem - Salesforce item
   * @param {Array} mappings - Field mappings
   * @returns {Object} - Local format item
   */
  toLocal: (sfItem, mappings) => {
    const localItem = {};
    
    // Apply mappings
    Object.keys(sfItem).forEach(sfField => {
      const mapping = findMapping(sfField, mappings, 'from_crm');
      if (mapping) {
        localItem[mapping.target] = sfItem[sfField];
      }
    });
    
    // Apply special transformations
    if (sfItem.CloseDate && !localItem.expectedCloseDate) {
      localItem.expectedCloseDate = new Date(sfItem.CloseDate).toISOString().split('T')[0];
    }
    
    if (sfItem.Amount && !localItem.forecastAmount) {
      localItem.forecastAmount = parseFloat(sfItem.Amount);
    }
    
    if (sfItem.Probability && !localItem.probability) {
      localItem.probability = parseFloat(sfItem.Probability);
    }
    
    return localItem;
  },
  
  /**
   * Transform local data to Salesforce format
   * @param {Object} localItem - Local item
   * @param {Array} mappings - Field mappings
   * @returns {Object} - Salesforce format item
   */
  toCrm: (localItem, mappings) => {
    const sfItem = {};
    
    // Apply mappings
    Object.keys(localItem).forEach(localField => {
      const mapping = findMapping(localField, mappings, 'to_crm');
      if (mapping) {
        sfItem[mapping.target] = localItem[localField];
      }
    });
    
    // Apply special transformations
    if (localItem.expectedCloseDate && !sfItem.CloseDate) {
      sfItem.CloseDate = localItem.expectedCloseDate;
    }
    
    if (localItem.forecastAmount && !sfItem.Amount) {
      sfItem.Amount = localItem.forecastAmount.toString();
    }
    
    if (localItem.probability && !sfItem.Probability) {
      sfItem.Probability = localItem.probability.toString();
    }
    
    return sfItem;
  }
};

/**
 * HubSpot transformer
 */
const hubspotTransformer = {
  /**
   * Transform HubSpot data to local format
   * @param {Object} hsItem - HubSpot item
   * @param {Array} mappings - Field mappings
   * @returns {Object} - Local format item
   */
  toLocal: (hsItem, mappings) => {
    const localItem = {};
    
    // Apply mappings
    Object.keys(hsItem).forEach(hsField => {
      const mapping = findMapping(hsField, mappings, 'from_crm');
      if (mapping) {
        localItem[mapping.target] = hsItem[hsField];
      }
    });
    
    // Apply special transformations
    if (hsItem.closedate && !localItem.expectedCloseDate) {
      // HubSpot uses Unix timestamp in milliseconds
      const date = new Date(parseInt(hsItem.closedate));
      localItem.expectedCloseDate = date.toISOString().split('T')[0];
    }
    
    if (hsItem.amount && !localItem.forecastAmount) {
      localItem.forecastAmount = parseFloat(hsItem.amount);
    }
    
    if (hsItem.hs_probability && !localItem.probability) {
      localItem.probability = parseFloat(hsItem.hs_probability) / 100; // HubSpot uses 0-100
    }
    
    return localItem;
  },
  
  /**
   * Transform local data to HubSpot format
   * @param {Object} localItem - Local item
   * @param {Array} mappings - Field mappings
   * @returns {Object} - HubSpot format item
   */
  toCrm: (localItem, mappings) => {
    const hsItem = {};
    
    // Apply mappings
    Object.keys(localItem).forEach(localField => {
      const mapping = findMapping(localField, mappings, 'to_crm');
      if (mapping) {
        hsItem[mapping.target] = localItem[localField];
      }
    });
    
    // Apply special transformations
    if (localItem.expectedCloseDate && !hsItem.closedate) {
      // HubSpot uses Unix timestamp in milliseconds
      const date = new Date(localItem.expectedCloseDate);
      hsItem.closedate = date.getTime().toString();
    }
    
    if (localItem.forecastAmount && !hsItem.amount) {
      hsItem.amount = localItem.forecastAmount.toString();
    }
    
    if (localItem.probability && !hsItem.hs_probability) {
      hsItem.hs_probability = Math.round(localItem.probability * 100).toString(); // HubSpot uses 0-100
    }
    
    return hsItem;
  }
};

/**
 * Zoho CRM transformer
 */
const zohoTransformer = {
  toLocal: (zohoItem, mappings) => {
    const localItem = {};
    
    // Apply mappings
    Object.keys(zohoItem).forEach(zohoField => {
      const mapping = findMapping(zohoField, mappings, 'from_crm');
      if (mapping) {
        localItem[mapping.target] = zohoItem[zohoField];
      }
    });
    
    // Apply special transformations for Zoho-specific fields
    if (zohoItem.Closing_Date && !localItem.expectedCloseDate) {
      localItem.expectedCloseDate = zohoItem.Closing_Date;
    }
    
    if (zohoItem.Amount && !localItem.forecastAmount) {
      localItem.forecastAmount = parseFloat(zohoItem.Amount);
    }
    
    return localItem;
  },
  
  toCrm: (localItem, mappings) => {
    const zohoItem = {};
    
    // Apply mappings
    Object.keys(localItem).forEach(localField => {
      const mapping = findMapping(localField, mappings, 'to_crm');
      if (mapping) {
        zohoItem[mapping.target] = localItem[localField];
      }
    });
    
    // Apply special transformations
    if (localItem.expectedCloseDate && !zohoItem.Closing_Date) {
      zohoItem.Closing_Date = localItem.expectedCloseDate;
    }
    
    if (localItem.forecastAmount && !zohoItem.Amount) {
      zohoItem.Amount = localItem.forecastAmount.toString();
    }
    
    return zohoItem;
  }
};

/**
 * Microsoft Dynamics transformer
 */
const dynamicsTransformer = {
  toLocal: (dynamicsItem, mappings) => {
    const localItem = {};
    
    // Apply mappings
    Object.keys(dynamicsItem).forEach(dynamicsField => {
      const mapping = findMapping(dynamicsField, mappings, 'from_crm');
      if (mapping) {
        localItem[mapping.target] = dynamicsItem[dynamicsField];
      }
    });
    
    // Apply special transformations for Dynamics-specific fields
    if (dynamicsItem.estimatedclosedate && !localItem.expectedCloseDate) {
      localItem.expectedCloseDate = new Date(dynamicsItem.estimatedclosedate).toISOString().split('T')[0];
    }
    
    if (dynamicsItem.estimatedvalue && !localItem.forecastAmount) {
      localItem.forecastAmount = parseFloat(dynamicsItem.estimatedvalue.value);
    }
    
    return localItem;
  },
  
  toCrm: (localItem, mappings) => {
    const dynamicsItem = {};
    
    // Apply mappings
    Object.keys(localItem).forEach(localField => {
      const mapping = findMapping(localField, mappings, 'to_crm');
      if (mapping) {
        dynamicsItem[mapping.target] = localItem[localField];
      }
    });
    
    // Apply special transformations
    if (localItem.expectedCloseDate && !dynamicsItem.estimatedclosedate) {
      dynamicsItem.estimatedclosedate = localItem.expectedCloseDate;
    }
    
    if (localItem.forecastAmount && !dynamicsItem.estimatedvalue) {
      dynamicsItem.estimatedvalue = {
        value: localItem.forecastAmount,
        currencyid: { id: "USD" } // Default to USD
      };
    }
    
    return dynamicsItem;
  }
};

/**
 * Custom API transformer
 */
const customTransformer = {
  toLocal: (customItem, mappings) => {
    const localItem = {};
    
    // Apply mappings
    Object.keys(customItem).forEach(customField => {
      const mapping = findMapping(customField, mappings, 'from_crm');
      if (mapping) {
        localItem[mapping.target] = customItem[customField];
      }
    });
    
    return localItem;
  },
  
  toCrm: (localItem, mappings) => {
    const customItem = {};
    
    // Apply mappings
    Object.keys(localItem).forEach(localField => {
      const mapping = findMapping(localField, mappings, 'to_crm');
      if (mapping) {
        customItem[mapping.target] = localItem[localField];
      }
    });
    
    return customItem;
  }
};

/**
 * Detect conflicts between local and CRM data
 * @param {Array} localData - Local data
 * @param {Array} crmData - CRM data
 * @param {string} idField - ID field to match items
 * @returns {Array} - Array of conflicts
 */
function detectConflicts(localData, crmData, idField) {
  const conflicts = [];
  
  // Create maps for faster lookup
  const localMap = new Map();
  localData.forEach(item => {
    if (item[idField]) {
      localMap.set(item[idField], item);
    }
  });
  
  const crmMap = new Map();
  crmData.forEach(item => {
    if (item[idField]) {
      crmMap.set(item[idField], item);
    }
  });
  
  // Check for conflicts
  localMap.forEach((localItem, id) => {
    const crmItem = crmMap.get(id);
    if (crmItem) {
      // Check for differences
      const conflictFields = findConflictFields(localItem, crmItem);
      if (conflictFields.length > 0) {
        conflicts.push({
          id,
          localItem,
          crmItem,
          fields: conflictFields
        });
      }
    }
  });
  
  return conflicts;
}

/**
 * Find conflicting fields between local and CRM items
 * @param {Object} localItem - Local item
 * @param {Object} crmItem - CRM item
 * @returns {Array} - Array of conflicting field names
 */
function findConflictFields(localItem, crmItem) {
  const conflicts = [];
  
  // Compare fields
  Object.keys(localItem).forEach(field => {
    if (crmItem.hasOwnProperty(field) && 
        localItem[field] !== crmItem[field] &&
        field !== 'id' && field !== 'lastModified') {
      conflicts.push(field);
    }
  });
  
  return conflicts;
}

/**
 * Merge local and CRM data with conflict resolution
 * @param {Array} localData - Local data
 * @param {Array} crmData - CRM data
 * @param {string} idField - ID field to match items
 * @param {string} conflictResolution - Conflict resolution strategy ('ask', 'local', 'remote')
 * @param {Function} conflictCallback - Callback for 'ask' resolution strategy
 * @returns {Object} - Merged data and conflicts
 */
async function mergeData(localData, crmData, idField, conflictResolution, conflictCallback) {
  // Detect conflicts
  const conflicts = detectConflicts(localData, crmData, idField);
  
  // Create maps for faster lookup
  const localMap = new Map();
  localData.forEach(item => {
    if (item[idField]) {
      localMap.set(item[idField], { ...item });
    }
  });
  
  const crmMap = new Map();
  crmData.forEach(item => {
    if (item[idField]) {
      crmMap.set(item[idField], { ...item });
    }
  });
  
  // Merge data
  const mergedData = [];
  const unresolvedConflicts = [];
  
  // Process all local items
  localMap.forEach((localItem, id) => {
    const crmItem = crmMap.get(id);
    
    if (!crmItem) {
      // Item only exists locally
      mergedData.push(localItem);
    } else {
      // Item exists in both - check for conflicts
      const conflict = conflicts.find(c => c.id === id);
      
      if (!conflict) {
        // No conflict, use local item
        mergedData.push(localItem);
      } else {
        // Handle conflict based on resolution strategy
        switch (conflictResolution) {
          case 'local':
            mergedData.push(localItem);
            break;
            
          case 'remote':
            mergedData.push(crmItem);
            break;
            
          case 'ask':
          default:
            // Add to unresolved conflicts for callback handling
            unresolvedConflicts.push(conflict);
            break;
        }
      }
      
      // Remove from CRM map to track processed items
      crmMap.delete(id);
    }
  });
  
  // Add remaining CRM items (new items not in local data)
  crmMap.forEach(crmItem => {
    mergedData.push(crmItem);
  });
  
  // Handle unresolved conflicts if callback provided
  if (unresolvedConflicts.length > 0 && typeof conflictCallback === 'function') {
    const resolvedItems = await conflictCallback(unresolvedConflicts);
    
    // Add resolved items to merged data
    if (resolvedItems && resolvedItems.length) {
      resolvedItems.forEach(item => {
        // Find and replace in merged data
        const index = mergedData.findIndex(m => m[idField] === item[idField]);
        if (index >= 0) {
          mergedData[index] = item;
        } else {
          mergedData.push(item);
        }
      });
    }
  }
  
  return {
    mergedData,
    conflicts
  };
}

// Export functions
export {
  transformCrmDataToLocal,
  transformLocalDataToCrm,
  detectConflicts,
  mergeData
};
