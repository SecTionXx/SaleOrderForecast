/**
 * dataProcessingOptimizer.js - Optimized Data Processing Utilities
 * Provides optimized methods for handling large datasets efficiently
 */

/**
 * Chunk processor for handling large datasets in smaller batches
 * @param {Array} data - The large dataset to process
 * @param {Function} processFn - Processing function to apply to each chunk
 * @param {number} chunkSize - Size of each chunk (default: 1000)
 * @param {boolean} parallel - Whether to process chunks in parallel (default: false)
 * @returns {Promise<Array>} - Combined results from all chunks
 */
export async function processInChunks(data, processFn, chunkSize = 1000, parallel = false) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  // Create chunks of the data
  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }

  // Process chunks
  let results = [];
  
  if (parallel) {
    // Process chunks in parallel
    const promises = chunks.map(chunk => Promise.resolve(processFn(chunk)));
    const chunkResults = await Promise.all(promises);
    results = chunkResults.flat();
  } else {
    // Process chunks sequentially
    for (const chunk of chunks) {
      const chunkResult = await Promise.resolve(processFn(chunk));
      results = results.concat(chunkResult);
    }
  }

  return results;
}

/**
 * Worker-based processor for CPU-intensive operations
 * Uses Web Workers for multi-threading when available
 * @param {Array} data - The dataset to process
 * @param {Function} processFn - Processing function as string to execute in worker
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} - Results from worker processing
 */
export function processWithWorker(data, processFn, options = {}) {
  return new Promise((resolve, reject) => {
    // Check if Web Workers are supported
    if (typeof Worker === 'undefined') {
      // Fall back to main thread processing
      try {
        const result = processFn(data, options);
        resolve(result);
      } catch (error) {
        reject(error);
      }
      return;
    }

    // Create a blob URL for the worker script
    const workerScript = `
      self.onmessage = function(e) {
        const { data, options } = e.data;
        
        // Define the processing function
        const processFn = ${processFn.toString()};
        
        try {
          // Execute the processing function
          const result = processFn(data, options);
          self.postMessage({ result });
        } catch (error) {
          self.postMessage({ error: error.message });
        }
      };
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    
    // Create and start the worker
    const worker = new Worker(workerUrl);
    
    worker.onmessage = function(e) {
      // Clean up
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      
      if (e.data.error) {
        reject(new Error(e.data.error));
      } else {
        resolve(e.data.result);
      }
    };
    
    worker.onerror = function(error) {
      // Clean up
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      
      reject(error);
    };
    
    // Send data to the worker
    worker.postMessage({ data, options });
  });
}

/**
 * Optimized data aggregation for large datasets
 * @param {Array} data - Dataset to aggregate
 * @param {string} groupByKey - Key to group by
 * @param {string} valueKey - Key to aggregate
 * @param {string} aggregationType - Type of aggregation ('sum', 'avg', 'min', 'max', 'count')
 * @returns {Object} - Aggregated results
 */
export function optimizedAggregation(data, groupByKey, valueKey, aggregationType = 'sum') {
  if (!Array.isArray(data) || data.length === 0) {
    return {};
  }

  // Use a Map for better performance with large datasets
  const aggregationMap = new Map();
  
  // First pass: group and aggregate data
  for (const item of data) {
    const groupKey = item[groupByKey];
    const value = Number(item[valueKey]) || 0;
    
    if (!aggregationMap.has(groupKey)) {
      aggregationMap.set(groupKey, {
        sum: 0,
        count: 0,
        min: Infinity,
        max: -Infinity
      });
    }
    
    const group = aggregationMap.get(groupKey);
    group.sum += value;
    group.count += 1;
    group.min = Math.min(group.min, value);
    group.max = Math.max(group.max, value);
  }
  
  // Second pass: calculate final aggregation values
  const result = {};
  
  aggregationMap.forEach((group, key) => {
    let aggregatedValue;
    
    switch (aggregationType.toLowerCase()) {
      case 'sum':
        aggregatedValue = group.sum;
        break;
      case 'avg':
        aggregatedValue = group.sum / group.count;
        break;
      case 'min':
        aggregatedValue = group.min;
        break;
      case 'max':
        aggregatedValue = group.max;
        break;
      case 'count':
        aggregatedValue = group.count;
        break;
      default:
        aggregatedValue = group.sum;
    }
    
    result[key] = aggregatedValue;
  });
  
  return result;
}

/**
 * Optimized data filtering for large datasets
 * @param {Array} data - Dataset to filter
 * @param {Function} filterFn - Filter function
 * @param {number} chunkSize - Size of chunks to process (default: 5000)
 * @returns {Array} - Filtered results
 */
export function optimizedFilter(data, filterFn, chunkSize = 5000) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  // For small datasets, use standard filter
  if (data.length <= chunkSize) {
    return data.filter(filterFn);
  }
  
  // For large datasets, process in chunks
  const result = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const filteredChunk = chunk.filter(filterFn);
    result.push(...filteredChunk);
    
    // Allow UI thread to breathe between chunks
    if (i + chunkSize < data.length && typeof window !== 'undefined') {
      setTimeout(() => {}, 0);
    }
  }
  
  return result;
}

/**
 * Optimized data sorting for large datasets
 * @param {Array} data - Dataset to sort
 * @param {Function} compareFn - Compare function
 * @param {number} threshold - Threshold for using QuickSort vs MergeSort
 * @returns {Array} - Sorted results
 */
export function optimizedSort(data, compareFn, threshold = 10000) {
  if (!Array.isArray(data) || data.length <= 1) {
    return [...data];
  }
  
  // Clone the array to avoid modifying the original
  const result = [...data];
  
  // For small to medium datasets, use built-in sort
  if (data.length < threshold) {
    return result.sort(compareFn);
  }
  
  // For large datasets, use merge sort (more stable for large datasets)
  return mergeSort(result, compareFn);
}

/**
 * Merge sort implementation for large datasets
 * @private
 * @param {Array} arr - Array to sort
 * @param {Function} compareFn - Compare function
 * @returns {Array} - Sorted array
 */
function mergeSort(arr, compareFn) {
  if (arr.length <= 1) {
    return arr;
  }
  
  const middle = Math.floor(arr.length / 2);
  const left = arr.slice(0, middle);
  const right = arr.slice(middle);
  
  return merge(
    mergeSort(left, compareFn),
    mergeSort(right, compareFn),
    compareFn
  );
}

/**
 * Merge two sorted arrays
 * @private
 * @param {Array} left - Left array
 * @param {Array} right - Right array
 * @param {Function} compareFn - Compare function
 * @returns {Array} - Merged sorted array
 */
function merge(left, right, compareFn) {
  const result = [];
  let leftIndex = 0;
  let rightIndex = 0;
  
  while (leftIndex < left.length && rightIndex < right.length) {
    if (compareFn(left[leftIndex], right[rightIndex]) <= 0) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }
  
  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

/**
 * Memory-efficient data transformation
 * Processes data without creating multiple intermediate arrays
 * @param {Array} data - Dataset to transform
 * @param {Function} mapFn - Map function
 * @param {Function} filterFn - Optional filter function
 * @returns {Array} - Transformed results
 */
export function streamingTransform(data, mapFn, filterFn = null) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  const result = [];
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    
    // Apply filter if provided
    if (filterFn && !filterFn(item)) {
      continue;
    }
    
    // Apply transformation
    const transformed = mapFn(item);
    result.push(transformed);
  }
  
  return result;
}

/**
 * Memoization utility for expensive calculations
 * @param {Function} fn - Function to memoize
 * @param {Function} keyFn - Function to generate cache key (default: JSON.stringify)
 * @returns {Function} - Memoized function
 */
export function memoize(fn, keyFn = JSON.stringify) {
  const cache = new Map();
  
  return function(...args) {
    const key = keyFn(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    
    return result;
  };
}

/**
 * Lazy evaluation for data processing pipelines
 * Only processes data when needed
 * @param {Array} data - Initial dataset
 * @returns {Object} - Lazy evaluation chain
 */
export function lazyChain(data) {
  let operations = [];
  let cachedResult = null;
  
  const chain = {
    map(fn) {
      operations.push({
        type: 'map',
        fn
      });
      cachedResult = null;
      return chain;
    },
    
    filter(fn) {
      operations.push({
        type: 'filter',
        fn
      });
      cachedResult = null;
      return chain;
    },
    
    reduce(fn, initialValue) {
      operations.push({
        type: 'reduce',
        fn,
        initialValue
      });
      cachedResult = null;
      return chain;
    },
    
    sort(fn) {
      operations.push({
        type: 'sort',
        fn
      });
      cachedResult = null;
      return chain;
    },
    
    value() {
      if (cachedResult !== null) {
        return cachedResult;
      }
      
      let result = [...data]; // Clone to avoid modifying original
      
      for (const op of operations) {
        switch (op.type) {
          case 'map':
            result = result.map(op.fn);
            break;
          case 'filter':
            result = result.filter(op.fn);
            break;
          case 'reduce':
            result = result.reduce(op.fn, op.initialValue);
            break;
          case 'sort':
            result = result.sort(op.fn);
            break;
        }
      }
      
      cachedResult = result;
      return result;
    }
  };
  
  return chain;
}
