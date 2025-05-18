/**
 * progressiveLoader.js - Progressive Loading Utilities
 * Provides utilities for progressively loading and rendering large datasets
 * to improve perceived performance and user experience
 */

/**
 * Progressively load and render data in chunks
 * @param {Array} data - The complete dataset to load
 * @param {Function} renderFn - Function to render each chunk of data
 * @param {Object} options - Configuration options
 * @returns {Promise} - Resolves when all data is loaded and rendered
 */
export function progressiveLoad(data, renderFn, options = {}) {
  return new Promise((resolve) => {
    const {
      chunkSize = 50,            // Number of items to process in each chunk
      delayBetweenChunks = 10,   // Milliseconds to wait between chunks
      onProgress = null,         // Callback for progress updates
      onComplete = null          // Callback when loading completes
    } = options;
    
    if (!Array.isArray(data) || data.length === 0) {
      if (onComplete) onComplete([]);
      resolve([]);
      return;
    }
    
    const chunks = [];
    const totalItems = data.length;
    let processedItems = 0;
    
    // Split data into chunks
    for (let i = 0; i < totalItems; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    
    const totalChunks = chunks.length;
    let processedChunks = 0;
    const results = [];
    
    // Process chunks with delay between each to allow UI updates
    function processNextChunk() {
      if (processedChunks >= totalChunks) {
        // All chunks processed
        if (onComplete) onComplete(results);
        resolve(results);
        return;
      }
      
      const chunk = chunks[processedChunks];
      const chunkResult = renderFn(chunk, processedChunks);
      
      if (chunkResult !== undefined) {
        if (Array.isArray(chunkResult)) {
          results.push(...chunkResult);
        } else {
          results.push(chunkResult);
        }
      }
      
      processedItems += chunk.length;
      processedChunks++;
      
      // Report progress
      if (onProgress) {
        onProgress({
          processedItems,
          totalItems,
          processedChunks,
          totalChunks,
          progress: Math.round((processedItems / totalItems) * 100)
        });
      }
      
      // Schedule next chunk with delay
      setTimeout(processNextChunk, delayBetweenChunks);
    }
    
    // Start processing
    processNextChunk();
  });
}

/**
 * Progressively render a large table with virtualization
 * Only renders rows that are visible in the viewport
 * @param {HTMLElement} tableContainer - Container element for the table
 * @param {Array} data - The complete dataset for the table
 * @param {Function} rowRenderer - Function to render a single row
 * @param {Object} options - Configuration options
 */
export function virtualizedTable(tableContainer, data, rowRenderer, options = {}) {
  const {
    rowHeight = 40,              // Height of each row in pixels
    overscan = 5,                // Number of extra rows to render above/below viewport
    headerHeight = 40,           // Height of the table header
    onScroll = null,             // Callback for scroll events
    getRowKey = (row, index) => index  // Function to get a unique key for each row
  } = options;
  
  if (!tableContainer || !Array.isArray(data)) {
    return;
  }
  
  // Create table elements if they don't exist
  let tableHeader = tableContainer.querySelector('.table-header');
  let tableBody = tableContainer.querySelector('.table-body');
  let tableFooter = tableContainer.querySelector('.table-footer');
  
  if (!tableHeader) {
    tableHeader = document.createElement('div');
    tableHeader.className = 'table-header';
    tableContainer.appendChild(tableHeader);
  }
  
  if (!tableBody) {
    tableBody = document.createElement('div');
    tableBody.className = 'table-body';
    tableContainer.appendChild(tableBody);
  }
  
  if (!tableFooter) {
    tableFooter = document.createElement('div');
    tableFooter.className = 'table-footer';
    tableContainer.appendChild(tableFooter);
  }
  
  // Set styles for virtualization
  tableContainer.style.position = 'relative';
  tableContainer.style.overflow = 'auto';
  tableHeader.style.position = 'sticky';
  tableHeader.style.top = '0';
  tableHeader.style.zIndex = '1';
  tableHeader.style.height = `${headerHeight}px`;
  tableBody.style.position = 'relative';
  
  // Create a spacer to maintain scroll height
  const totalHeight = data.length * rowHeight;
  tableBody.style.height = `${totalHeight}px`;
  
  // Keep track of rendered rows
  const renderedRows = new Map();
  
  // Render visible rows
  function renderVisibleRows() {
    const scrollTop = tableContainer.scrollTop;
    const viewportHeight = tableContainer.clientHeight;
    
    // Calculate visible range
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(
      data.length - 1,
      Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan
    );
    
    // Track which rows should remain
    const newRows = new Set();
    
    // Render or update visible rows
    for (let i = startIndex; i <= endIndex; i++) {
      const rowKey = getRowKey(data[i], i);
      newRows.add(rowKey);
      
      if (!renderedRows.has(rowKey)) {
        // Create new row
        const rowElement = document.createElement('div');
        rowElement.className = 'table-row';
        rowElement.style.position = 'absolute';
        rowElement.style.top = `${i * rowHeight}px`;
        rowElement.style.height = `${rowHeight}px`;
        rowElement.style.width = '100%';
        
        // Render row content
        rowRenderer(rowElement, data[i], i);
        
        tableBody.appendChild(rowElement);
        renderedRows.set(rowKey, rowElement);
      } else {
        // Update existing row position
        const rowElement = renderedRows.get(rowKey);
        rowElement.style.top = `${i * rowHeight}px`;
      }
    }
    
    // Remove rows that are no longer visible
    for (const [rowKey, rowElement] of renderedRows.entries()) {
      if (!newRows.has(rowKey)) {
        tableBody.removeChild(rowElement);
        renderedRows.delete(rowKey);
      }
    }
    
    // Call onScroll callback if provided
    if (onScroll) {
      onScroll({
        scrollTop,
        viewportHeight,
        startIndex,
        endIndex,
        visibleCount: endIndex - startIndex + 1
      });
    }
  }
  
  // Attach scroll event listener
  tableContainer.addEventListener('scroll', renderVisibleRows);
  
  // Initial render
  renderVisibleRows();
  
  // Return control functions
  return {
    refresh: renderVisibleRows,
    
    updateData: (newData) => {
      data = newData;
      const totalHeight = data.length * rowHeight;
      tableBody.style.height = `${totalHeight}px`;
      
      // Clear all rendered rows
      for (const [_, rowElement] of renderedRows.entries()) {
        tableBody.removeChild(rowElement);
      }
      renderedRows.clear();
      
      renderVisibleRows();
    },
    
    scrollToIndex: (index) => {
      const scrollTop = index * rowHeight;
      tableContainer.scrollTop = scrollTop;
    },
    
    destroy: () => {
      tableContainer.removeEventListener('scroll', renderVisibleRows);
    }
  };
}

/**
 * Progressively render a large chart by aggregating data
 * @param {HTMLElement} chartContainer - Container element for the chart
 * @param {Array} data - The complete dataset for the chart
 * @param {Function} chartRenderer - Function to render the chart
 * @param {Object} options - Configuration options
 */
export function progressiveChart(chartContainer, data, chartRenderer, options = {}) {
  const {
    initialPoints = 100,         // Number of points to show initially
    maxPoints = 1000,            // Maximum number of points to display
    aggregationFn = null,        // Function to aggregate data points
    xKey = 'date',               // Key for x-axis values
    yKey = 'value',              // Key for y-axis values
    onProgress = null,           // Callback for progress updates
    onComplete = null            // Callback when loading completes
  } = options;
  
  if (!chartContainer || !Array.isArray(data)) {
    return;
  }
  
  // Create loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'chart-loading-indicator';
  loadingIndicator.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">Loading chart data...</div>
    <div class="loading-progress">0%</div>
  `;
  chartContainer.appendChild(loadingIndicator);
  
  // Function to aggregate data if needed
  function aggregateData(data, maxPoints) {
    if (data.length <= maxPoints) {
      return data;
    }
    
    if (aggregationFn) {
      // Use custom aggregation function
      return aggregationFn(data, maxPoints);
    }
    
    // Default aggregation: reduce resolution by averaging points
    const factor = Math.ceil(data.length / maxPoints);
    const aggregated = [];
    
    for (let i = 0; i < data.length; i += factor) {
      const chunk = data.slice(i, i + factor);
      
      if (chunk.length === 0) continue;
      
      // Get x value (usually date) from first point in chunk
      const xValue = chunk[0][xKey];
      
      // Average y values
      const ySum = chunk.reduce((sum, point) => sum + Number(point[yKey] || 0), 0);
      const yAvg = ySum / chunk.length;
      
      aggregated.push({
        ...chunk[0],
        [yKey]: yAvg,
        aggregated: true,
        pointCount: chunk.length
      });
    }
    
    return aggregated;
  }
  
  // Progressively render the chart
  let chart = null;
  let currentDataset = [];
  
  // Initial render with subset of data
  const initialData = aggregateData(data.slice(0, initialPoints), initialPoints);
  chart = chartRenderer(chartContainer, initialData);
  currentDataset = initialData;
  
  // Update loading indicator
  function updateProgress(progress) {
    const progressElement = loadingIndicator.querySelector('.loading-progress');
    if (progressElement) {
      progressElement.textContent = `${progress}%`;
    }
    
    if (onProgress) {
      onProgress(progress);
    }
    
    if (progress >= 100) {
      // Remove loading indicator when complete
      chartContainer.removeChild(loadingIndicator);
      
      if (onComplete) {
        onComplete(chart);
      }
    }
  }
  
  // Progressively load and render the rest of the data
  const remainingData = data.slice(initialPoints);
  const totalData = data.length;
  const processedInitially = initialPoints;
  
  progressiveLoad(remainingData, (chunk, chunkIndex) => {
    // Add new data to current dataset
    currentDataset = currentDataset.concat(chunk);
    
    // Aggregate if needed
    const aggregated = aggregateData(currentDataset, maxPoints);
    
    // Update chart with new data
    chart.update(aggregated);
    
    // Calculate progress
    const processedItems = processedInitially + (chunkIndex + 1) * chunk.length;
    const progress = Math.round((processedItems / totalData) * 100);
    
    updateProgress(progress);
  }, options);
  
  // Return control functions
  return {
    getChart: () => chart,
    
    updateData: (newData) => {
      const aggregated = aggregateData(newData, maxPoints);
      chart.update(aggregated);
    },
    
    destroy: () => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    }
  };
}

/**
 * Create an infinite scroll container that loads more data as the user scrolls
 * @param {HTMLElement} container - Container element for the infinite scroll
 * @param {Function} loadMoreFn - Function to load more data (should return Promise)
 * @param {Function} renderFn - Function to render loaded items
 * @param {Object} options - Configuration options
 */
export function infiniteScroll(container, loadMoreFn, renderFn, options = {}) {
  const {
    threshold = 200,             // Distance from bottom to trigger loading
    loadingIndicator = true,     // Whether to show loading indicator
    initialLoad = true,          // Whether to load initial data
    batchSize = 20,              // Number of items to load in each batch
    maxItems = null,             // Maximum number of items to load (null for unlimited)
    onScroll = null              // Callback for scroll events
  } = options;
  
  if (!container) {
    return;
  }
  
  // Create content and loading elements
  const contentEl = document.createElement('div');
  contentEl.className = 'infinite-scroll-content';
  container.appendChild(contentEl);
  
  let loadingEl = null;
  if (loadingIndicator) {
    loadingEl = document.createElement('div');
    loadingEl.className = 'infinite-scroll-loading';
    loadingEl.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading more items...</div>
    `;
    loadingEl.style.display = 'none';
    container.appendChild(loadingEl);
  }
  
  // State variables
  let isLoading = false;
  let hasMore = true;
  let items = [];
  let page = 0;
  
  // Load more data
  async function loadMore() {
    if (isLoading || !hasMore) {
      return;
    }
    
    // Check if we've reached the maximum number of items
    if (maxItems !== null && items.length >= maxItems) {
      hasMore = false;
      return;
    }
    
    isLoading = true;
    
    if (loadingEl) {
      loadingEl.style.display = 'block';
    }
    
    try {
      // Call load function with current page and batch size
      const newItems = await loadMoreFn(page, batchSize);
      
      // Check if we have more items to load
      if (!newItems || newItems.length === 0 || (maxItems !== null && items.length + newItems.length >= maxItems)) {
        hasMore = false;
      }
      
      // Add new items to the list
      if (newItems && newItems.length > 0) {
        items = items.concat(newItems);
        
        // Limit to maxItems if specified
        if (maxItems !== null && items.length > maxItems) {
          items = items.slice(0, maxItems);
        }
        
        // Render new items
        renderFn(contentEl, newItems, items);
        
        // Increment page counter
        page++;
      }
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      isLoading = false;
      
      if (loadingEl) {
        loadingEl.style.display = hasMore ? 'none' : 'none';
      }
      
      // If no more items, add a "no more items" indicator
      if (!hasMore && loadingEl) {
        loadingEl.innerHTML = '<div class="no-more-items">No more items to load</div>';
        loadingEl.style.display = 'block';
      }
    }
  }
  
  // Check if we need to load more
  function checkScroll() {
    if (!hasMore || isLoading) {
      return;
    }
    
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const scrollRemaining = scrollHeight - scrollTop - clientHeight;
    
    // Call onScroll callback if provided
    if (onScroll) {
      onScroll({
        scrollTop,
        scrollHeight,
        clientHeight,
        scrollRemaining,
        progress: Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
      });
    }
    
    // Load more if we're close to the bottom
    if (scrollRemaining < threshold) {
      loadMore();
    }
  }
  
  // Attach scroll event listener
  container.addEventListener('scroll', checkScroll);
  
  // Initial load
  if (initialLoad) {
    loadMore();
  }
  
  // Return control functions
  return {
    loadMore,
    
    reset: () => {
      items = [];
      page = 0;
      hasMore = true;
      contentEl.innerHTML = '';
      
      if (loadingEl) {
        loadingEl.style.display = 'none';
        loadingEl.innerHTML = `
          <div class="loading-spinner"></div>
          <div class="loading-text">Loading more items...</div>
        `;
      }
      
      if (initialLoad) {
        loadMore();
      }
    },
    
    getItems: () => items,
    
    hasMore: () => hasMore,
    
    destroy: () => {
      container.removeEventListener('scroll', checkScroll);
    }
  };
}
