/**
 * mockDataGenerator.js
 * Utility for generating mock data for testing and demonstration purposes
 */

/**
 * Generate mock sales data
 * @param {number} count - Number of records to generate
 * @param {Object} options - Configuration options
 * @returns {Array} - Array of mock sales data records
 */
export function generateMockSalesData(count = 50, options = {}) {
  const {
    startDate = new Date(new Date().getFullYear() - 1, 0, 1),
    endDate = new Date(),
    products = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'],
    regions = ['North', 'South', 'East', 'West', 'Central'],
    minAmount = 100,
    maxAmount = 10000,
    minQuantity = 1,
    maxQuantity = 100,
    includeId = true,
    includeTrend = false,
    includeSeasonal = false,
    includeNoise = true
  } = options;
  
  const result = [];
  const dateRange = endDate.getTime() - startDate.getTime();
  
  // Base values for trend and seasonality
  const baseValue = (maxAmount - minAmount) / 2 + minAmount;
  const trendFactor = includeTrend ? 0.2 : 0; // 20% increase over the entire period
  const seasonalFactor = includeSeasonal ? 0.3 : 0; // 30% seasonal variation
  
  for (let i = 0; i < count; i++) {
    // Generate random date within range
    const randomDate = new Date(startDate.getTime() + Math.random() * dateRange);
    
    // Generate random product and region
    const product = products[Math.floor(Math.random() * products.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    
    // Calculate amount with optional trend and seasonality
    let amount = baseValue;
    
    // Add trend component (linear increase over time)
    if (includeTrend) {
      const timeProgress = (randomDate.getTime() - startDate.getTime()) / dateRange;
      amount += baseValue * trendFactor * timeProgress;
    }
    
    // Add seasonal component (sinusoidal pattern with 1-year period)
    if (includeSeasonal) {
      const monthFactor = Math.sin(randomDate.getMonth() * Math.PI / 6); // Peak in summer, trough in winter
      amount += baseValue * seasonalFactor * monthFactor;
    }
    
    // Add random noise
    if (includeNoise) {
      const noiseFactor = 0.2; // 20% random variation
      amount += baseValue * noiseFactor * (Math.random() * 2 - 1);
    }
    
    // Ensure amount is within bounds
    amount = Math.max(minAmount, Math.min(maxAmount, amount));
    amount = Math.round(amount * 100) / 100; // Round to 2 decimal places
    
    // Generate random quantity
    const quantity = Math.floor(Math.random() * (maxQuantity - minQuantity + 1)) + minQuantity;
    
    // Create record
    const record = {
      date: randomDate,
      product,
      region,
      amount,
      quantity
    };
    
    // Add ID if requested
    if (includeId) {
      record.id = `sale-${i + 1}`;
    }
    
    result.push(record);
  }
  
  // Sort by date
  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return result;
}

/**
 * Generate mock forecast data based on historical data
 * @param {Array} historicalData - Historical data to base forecast on
 * @param {number} periods - Number of periods to forecast
 * @param {Object} options - Configuration options
 * @returns {Array} - Array of forecast data records
 */
export function generateMockForecastData(historicalData, periods = 12, options = {}) {
  if (!historicalData || historicalData.length === 0) {
    return [];
  }
  
  const {
    dateKey = 'date',
    valueKey = 'amount',
    forecastTypes = ['optimistic', 'realistic', 'pessimistic'],
    variationFactor = 0.2, // 20% variation between forecast types
    includeTrend = true,
    includeSeasonality = true,
    includeNoise = true
  } = options;
  
  // Get the last date from historical data
  const lastDate = new Date(Math.max(...historicalData.map(item => new Date(item[dateKey]).getTime())));
  
  // Calculate average value from historical data
  const sum = historicalData.reduce((acc, item) => acc + (typeof item[valueKey] === 'number' ? item[valueKey] : 0), 0);
  const avgValue = sum / historicalData.length;
  
  // Detect trend from historical data
  let trendFactor = 0;
  if (includeTrend && historicalData.length > 1) {
    const sortedData = [...historicalData].sort((a, b) => 
      new Date(a[dateKey]).getTime() - new Date(b[dateKey]).getTime()
    );
    
    const firstValue = sortedData[0][valueKey];
    const lastValue = sortedData[sortedData.length - 1][valueKey];
    const valueChange = lastValue - firstValue;
    const firstDate = new Date(sortedData[0][dateKey]).getTime();
    const lastDate = new Date(sortedData[sortedData.length - 1][dateKey]).getTime();
    const timeSpan = lastDate - firstDate;
    
    if (timeSpan > 0) {
      // Calculate monthly trend factor
      const monthsSpan = timeSpan / (30 * 24 * 60 * 60 * 1000);
      trendFactor = valueChange / (firstValue * monthsSpan);
    }
  }
  
  // Detect seasonality from historical data
  const seasonalFactors = {};
  if (includeSeasonality && historicalData.length >= 12) {
    // Group data by month
    const monthlyData = {};
    
    historicalData.forEach(item => {
      const date = new Date(item[dateKey]);
      const month = date.getMonth();
      
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      
      monthlyData[month].push(item[valueKey]);
    });
    
    // Calculate average value for each month
    for (let month = 0; month < 12; month++) {
      if (monthlyData[month] && monthlyData[month].length > 0) {
        const monthSum = monthlyData[month].reduce((acc, val) => acc + val, 0);
        const monthAvg = monthSum / monthlyData[month].length;
        seasonalFactors[month] = monthAvg / avgValue;
      } else {
        seasonalFactors[month] = 1;
      }
    }
  }
  
  // Generate forecast data
  const forecastData = [];
  
  for (let i = 0; i < periods; i++) {
    // Calculate forecast date (add months to last historical date)
    const forecastDate = new Date(lastDate);
    forecastDate.setMonth(forecastDate.getMonth() + i + 1);
    
    // Base forecast value
    let baseValue = avgValue;
    
    // Apply trend
    if (includeTrend) {
      baseValue *= (1 + trendFactor * (i + 1));
    }
    
    // Apply seasonality
    if (includeSeasonality) {
      const month = forecastDate.getMonth();
      baseValue *= seasonalFactors[month] || 1;
    }
    
    // Generate different forecast types
    forecastTypes.forEach(type => {
      let forecastValue = baseValue;
      
      // Apply variation based on forecast type
      switch (type) {
        case 'optimistic':
          forecastValue *= (1 + variationFactor);
          break;
        case 'pessimistic':
          forecastValue *= (1 - variationFactor);
          break;
        // realistic uses the base value
      }
      
      // Add noise if enabled
      if (includeNoise) {
        const noiseFactor = 0.05; // 5% random noise
        forecastValue *= (1 + noiseFactor * (Math.random() * 2 - 1));
      }
      
      // Round to 2 decimal places
      forecastValue = Math.round(forecastValue * 100) / 100;
      
      // Create forecast record
      forecastData.push({
        date: forecastDate,
        value: forecastValue,
        type: type,
        isForecast: true
      });
    });
  }
  
  return forecastData;
}

/**
 * Generate mock time series data with specified patterns
 * @param {Object} options - Configuration options
 * @returns {Array} - Array of time series data points
 */
export function generateMockTimeSeriesData(options = {}) {
  const {
    startDate = new Date(new Date().getFullYear() - 1, 0, 1),
    endDate = new Date(),
    points = 100,
    baseline = 1000,
    trend = 0.1, // 10% upward trend over the period
    seasonality = 0.2, // 20% seasonal variation
    cycles = 1, // Number of complete cycles in the period
    noise = 0.05, // 5% random noise
    outliers = 0.02, // 2% chance of outliers
    outlierScale = 3, // Outliers are 3x the normal variation
    series = ['Series A'],
    seriesVariation = 0.3 // 30% variation between series
  } = options;
  
  const result = [];
  const dateRange = endDate.getTime() - startDate.getTime();
  const timeStep = dateRange / (points - 1);
  
  for (let i = 0; i < points; i++) {
    const timestamp = new Date(startDate.getTime() + i * timeStep);
    
    // Calculate base value for this time point
    let baseValue = baseline;
    
    // Add trend component
    if (trend !== 0) {
      const progressFactor = i / (points - 1);
      baseValue *= (1 + trend * progressFactor);
    }
    
    // Add seasonality component
    if (seasonality !== 0) {
      const cycleFactor = Math.sin(2 * Math.PI * cycles * i / (points - 1));
      baseValue *= (1 + seasonality * cycleFactor);
    }
    
    // Generate data for each series
    series.forEach((seriesName, seriesIndex) => {
      // Apply series-specific variation
      let seriesValue = baseValue * (1 + seriesVariation * (seriesIndex / series.length));
      
      // Add random noise
      if (noise > 0) {
        seriesValue *= (1 + noise * (Math.random() * 2 - 1));
      }
      
      // Add outliers occasionally
      if (outliers > 0 && Math.random() < outliers) {
        seriesValue *= (1 + outlierScale * noise * (Math.random() > 0.5 ? 1 : -1));
      }
      
      // Round to 2 decimal places
      seriesValue = Math.round(seriesValue * 100) / 100;
      
      result.push({
        timestamp,
        value: seriesValue,
        series: seriesName
      });
    });
  }
  
  return result;
}

/**
 * Generate mock hierarchical data (e.g., for treemaps or sunburst charts)
 * @param {Object} options - Configuration options
 * @returns {Object} - Hierarchical data structure
 */
export function generateMockHierarchicalData(options = {}) {
  const {
    depth = 3,
    breadth = [3, 5], // Min and max children per node
    valueRange = [100, 10000],
    categories = {
      level1: ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'],
      level2: ['Subcategory 1', 'Subcategory 2', 'Subcategory 3', 'Subcategory 4', 'Subcategory 5'],
      level3: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6', 'Item 7', 'Item 8']
    }
  } = options;
  
  /**
   * Generate a node at the specified level
   * @param {number} level - Current level (0-based)
   * @param {string} path - Path to this node
   * @returns {Object} - Node object
   */
  function generateNode(level, path) {
    if (level >= depth) {
      // Leaf node
      return {
        name: path,
        value: Math.floor(Math.random() * (valueRange[1] - valueRange[0]) + valueRange[0])
      };
    }
    
    // Internal node
    const categoryKey = `level${level + 1}`;
    const categoryOptions = categories[categoryKey] || [`Level ${level + 1}`];
    
    // Determine number of children
    const numChildren = Math.floor(Math.random() * (breadth[1] - breadth[0] + 1)) + breadth[0];
    
    // Generate children
    const children = [];
    const usedNames = new Set();
    
    for (let i = 0; i < numChildren; i++) {
      // Pick a unique name for this child
      let childName;
      do {
        childName = categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
        if (categoryOptions.length <= numChildren) {
          childName += ` ${i + 1}`;
        }
      } while (usedNames.has(childName));
      
      usedNames.add(childName);
      
      // Generate child node
      const childPath = path ? `${path} > ${childName}` : childName;
      const child = generateNode(level + 1, childPath);
      
      // Set name from path
      child.name = childName;
      
      children.push(child);
    }
    
    return {
      name: path.split(' > ').pop() || 'Root',
      children
    };
  }
  
  return generateNode(0, '');
}

/**
 * Generate mock network data (e.g., for network graphs)
 * @param {Object} options - Configuration options
 * @returns {Object} - Network data with nodes and links
 */
export function generateMockNetworkData(options = {}) {
  const {
    nodes = 20,
    minConnections = 1,
    maxConnections = 5,
    clusters = 3,
    valueRange = [1, 100]
  } = options;
  
  const result = {
    nodes: [],
    links: []
  };
  
  // Generate nodes
  for (let i = 0; i < nodes; i++) {
    const cluster = Math.floor(i * clusters / nodes);
    
    result.nodes.push({
      id: `node-${i + 1}`,
      name: `Node ${i + 1}`,
      group: cluster,
      value: Math.floor(Math.random() * (valueRange[1] - valueRange[0]) + valueRange[0])
    });
  }
  
  // Generate links
  for (let i = 0; i < nodes; i++) {
    // Determine number of connections for this node
    const numConnections = Math.floor(Math.random() * (maxConnections - minConnections + 1)) + minConnections;
    
    // Create connections
    const connections = new Set();
    
    for (let j = 0; j < numConnections; j++) {
      // Pick a random target node
      let target;
      do {
        target = Math.floor(Math.random() * nodes);
      } while (target === i || connections.has(target));
      
      connections.add(target);
      
      // Create link
      result.links.push({
        source: `node-${i + 1}`,
        target: `node-${target + 1}`,
        value: Math.floor(Math.random() * 10) + 1
      });
    }
  }
  
  return result;
}

/**
 * Generate mock event data (e.g., for Gantt charts or timelines)
 * @param {Object} options - Configuration options
 * @returns {Array} - Array of event data
 */
export function generateMockEventData(options = {}) {
  const {
    startDate = new Date(new Date().getFullYear(), 0, 1),
    endDate = new Date(new Date().getFullYear() + 1, 0, 1),
    events = 20,
    categories = ['Planning', 'Development', 'Testing', 'Deployment', 'Maintenance'],
    minDuration = 3, // days
    maxDuration = 30, // days
    dependencies = true,
    dependencyProbability = 0.3
  } = options;
  
  const result = [];
  const dateRange = endDate.getTime() - startDate.getTime();
  
  // Generate events
  for (let i = 0; i < events; i++) {
    // Generate random start date
    const eventStartTime = startDate.getTime() + Math.random() * (dateRange * 0.8);
    const eventStart = new Date(eventStartTime);
    
    // Generate random duration
    const durationDays = Math.floor(Math.random() * (maxDuration - minDuration + 1)) + minDuration;
    const durationMs = durationDays * 24 * 60 * 60 * 1000;
    
    // Calculate end date
    const eventEnd = new Date(eventStartTime + durationMs);
    
    // Pick a random category
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    // Create event
    result.push({
      id: `event-${i + 1}`,
      name: `Task ${i + 1}`,
      category,
      start: eventStart,
      end: eventEnd,
      progress: Math.round(Math.random() * 100),
      dependencies: []
    });
  }
  
  // Sort events by start date
  result.sort((a, b) => a.start.getTime() - b.start.getTime());
  
  // Add dependencies
  if (dependencies) {
    for (let i = 1; i < events; i++) {
      if (Math.random() < dependencyProbability) {
        // Pick a random predecessor from earlier events
        const predecessorIndex = Math.floor(Math.random() * i);
        result[i].dependencies.push(result[predecessorIndex].id);
      }
    }
  }
  
  return result;
}

/**
 * Generate mock geographic data (e.g., for maps)
 * @param {Object} options - Configuration options
 * @returns {Array} - Array of geographic data points
 */
export function generateMockGeoData(options = {}) {
  const {
    points = 50,
    regions = [
      { name: 'North America', lat: [25, 50], lng: [-125, -70] },
      { name: 'Europe', lat: [35, 60], lng: [-10, 30] },
      { name: 'Asia', lat: [10, 50], lng: [60, 140] },
      { name: 'South America', lat: [-40, 10], lng: [-80, -35] },
      { name: 'Africa', lat: [-30, 35], lng: [-20, 50] },
      { name: 'Oceania', lat: [-40, -10], lng: [110, 180] }
    ],
    valueRange = [100, 10000],
    categories = ['Category A', 'Category B', 'Category C']
  } = options;
  
  const result = [];
  
  for (let i = 0; i < points; i++) {
    // Pick a random region
    const region = regions[Math.floor(Math.random() * regions.length)];
    
    // Generate random coordinates within the region
    const lat = region.lat[0] + Math.random() * (region.lat[1] - region.lat[0]);
    const lng = region.lng[0] + Math.random() * (region.lng[1] - region.lng[0]);
    
    // Generate random value
    const value = Math.floor(Math.random() * (valueRange[1] - valueRange[0]) + valueRange[0]);
    
    // Pick a random category
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    // Create data point
    result.push({
      id: `point-${i + 1}`,
      name: `Location ${i + 1}`,
      region: region.name,
      latitude: lat,
      longitude: lng,
      value,
      category
    });
  }
  
  return result;
}
