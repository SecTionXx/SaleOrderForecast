# Loading States and Transitions Guide

This guide explains how to use the loading states and transitions components in the SaleOrderForecast application. These components provide a consistent way to manage loading indicators, error/success messages, and smooth transitions between different sections of the application.

## Table of Contents

1. [Overview](#overview)
2. [Loading States](#loading-states)
3. [Transitions](#transitions)
4. [Integration with Data Containers](#integration-with-data-containers)
5. [API Reference](#api-reference)
6. [Demo](#demo)

## Overview

The loading states and transitions system consists of several components:

- **CSS Styles**: Defined in `css/components/loadingStates.css`
- **Loading State Manager**: Implemented in `js/utils/loadingStateManager.js`
- **Data Container with Loading**: Implemented in `js/components/dataContainerWithLoading.js`
- **Application Integration**: Implemented in `js/app/loadingIntegration.js`
- **Demo**: Available at `loading-demo.html`

## Loading States

### Basic Loading Indicators

To show a loading indicator on any element:

```javascript
import { showLoading, hideLoading } from './js/app/loadingIntegration.js';

// Show loading
const loadingController = showLoading('#my-element', 'Loading data...');

// Later, hide loading
hideLoading('#my-element');
// OR
loadingController.setLoading(false);
```

### Error and Success Messages

To show error or success messages:

```javascript
import { showError, showSuccess } from './js/app/loadingIntegration.js';

// Show error
showError('#my-element', 'Failed to load data. Please try again.');

// Show success
showSuccess('#my-element', 'Data loaded successfully!');
```

### API Loading States

To show loading states during API calls:

```javascript
import { withLoading } from './js/app/loadingIntegration.js';

async function fetchData() {
  return withLoading(async () => {
    // Your API call here
    const response = await fetch('/api/data');
    return await response.json();
  }, {
    loadingMessage: 'Loading data...',
    errorMessage: 'Failed to load data. Please try again.'
  });
}
```

### Button Loading States

To show loading states on buttons:

```javascript
import { createButtonLoadingState } from './js/utils/loadingStateManager.js';

const button = document.getElementById('my-button');
const buttonLoading = createButtonLoadingState(button, {
  loadingText: 'Processing...'
});

button.addEventListener('click', buttonLoading.withLoading(async () => {
  // Your async operation here
  await someAsyncOperation();
}));
```

### Form Loading States

To show loading states on forms:

```javascript
import { createFormLoadingState } from './js/utils/loadingStateManager.js';

const form = document.getElementById('my-form');
const formLoading = createFormLoadingState(form, {
  loadingMessage: 'Submitting...',
  successMessage: 'Form submitted successfully!',
  errorMessage: 'Form submission failed. Please try again.',
  resetFormOnSuccess: true
});

form.addEventListener('submit', formLoading.withLoading(async (event) => {
  event.preventDefault();
  // Your form submission logic here
  await submitForm(new FormData(form));
}));
```

### Declarative Loading States

You can also use data attributes to declaratively add loading states:

```html
<!-- Button with loading state -->
<button data-loading data-loading-text="Processing..." data-click-handler="handleButtonClick">
  Click Me
</button>

<!-- Form with loading state -->
<form data-loading data-loading-message="Submitting..." data-success-message="Form submitted successfully!" data-error-message="Form submission failed. Please try again." data-reset-on-success="true">
  <!-- Form fields -->
  <button type="submit">Submit</button>
</form>
```

## Transitions

### Page Transitions

To navigate between pages with transitions:

```javascript
import { navigateToPage } from './js/app/loadingIntegration.js';

// Navigate to a page with fade transition
navigateToPage('page-id', 'fade');

// Available transitions: 'fade', 'slide', 'slideUp', 'zoom'
```

### Declarative Page Transitions

You can also use data attributes to declaratively add page transitions:

```html
<!-- Navigation link with transition -->
<a href="#" data-page="page-id" data-transition="fade">Go to Page</a>
```

### Section Transitions

To transition between sections within a page:

```javascript
import { createSectionTransition } from './js/utils/loadingStateManager.js';

const container = document.getElementById('section-container');
const sectionTransition = createSectionTransition(container, {
  sectionSelector: '.section',
  activeClass: 'active',
  transitionDuration: 300,
  defaultTransition: 'fade'
});

// Show a section with transition
sectionTransition.showSection('#section-id', 'slide');
```

## Integration with Data Containers

The loading states system integrates with data containers (tables and charts) to provide a consistent loading experience:

### Tables with Loading

```javascript
import { createTableWithLoading } from './js/components/dataContainerWithLoading.js';

const tableContainer = document.getElementById('table-container');
const tableWithLoading = createTableWithLoading(tableContainer, {
  loadingMessage: 'Loading data...',
  errorMessage: 'Failed to load data. Please try again.',
  emptyMessage: 'No data available.',
  dataProvider: async () => {
    // Your data fetching logic here
    return await fetchData();
  },
  progressiveOptions: {
    columns: [
      { id: 'date', label: 'Date', type: 'date' },
      { id: 'amount', label: 'Amount', type: 'currency' }
    ],
    pageSize: 10,
    sortable: true,
    filterable: true
  }
});

// Load data
tableWithLoading.loadData();
```

### Charts with Loading

```javascript
import { createChartWithLoading } from './js/components/dataContainerWithLoading.js';

const chartContainer = document.getElementById('chart-container');
const chartWithLoading = createChartWithLoading(chartContainer, {
  loadingMessage: 'Loading chart data...',
  errorMessage: 'Failed to load chart data. Please try again.',
  emptyMessage: 'No chart data available.',
  dataProvider: async () => {
    // Your data fetching logic here
    return await fetchChartData();
  },
  progressiveOptions: {
    type: 'line',
    xKey: 'date',
    yKey: 'amount',
    groupKey: 'category',
    aggregation: 'sum',
    timeUnit: 'month'
  }
});

// Load data
chartWithLoading.loadData();
```

### Declarative Data Containers

You can also use data attributes to declaratively add data containers with loading:

```html
<!-- Table with loading -->
<div id="sales-table" 
     data-container="table" 
     data-provider="fetchSalesData" 
     data-loading-message="Loading sales data..." 
     data-error-message="Failed to load sales data. Please try again." 
     data-empty-message="No sales data available." 
     data-columns='[{"id":"date","label":"Date","type":"date"},{"id":"amount","label":"Amount","type":"currency"}]' 
     data-page-size="10" 
     data-sortable="true" 
     data-filterable="true" 
     data-auto-load="true">
</div>

<!-- Chart with loading -->
<div id="sales-chart" 
     data-container="chart" 
     data-provider="fetchSalesChartData" 
     data-loading-message="Loading sales chart..." 
     data-error-message="Failed to load sales chart. Please try again." 
     data-empty-message="No sales chart data available." 
     data-chart-type="line" 
     data-x-key="date" 
     data-y-key="amount" 
     data-group-key="category" 
     data-aggregation="sum" 
     data-time-unit="month" 
     data-auto-load="true">
</div>
```

## API Reference

### Loading State Manager

```javascript
import { 
  globalLoadingManager,
  createLoadingManager,
  createButtonLoadingState,
  createFormLoadingState,
  createApiLoadingManager,
  createTransitionManager,
  createSectionTransition
} from './js/utils/loadingStateManager.js';
```

### Data Container with Loading

```javascript
import { 
  createDataContainerWithLoading,
  createTableWithLoading,
  createChartWithLoading
} from './js/components/dataContainerWithLoading.js';
```

### Application Integration

```javascript
import { 
  initLoadingStates,
  showLoading,
  hideLoading,
  showError,
  showSuccess,
  withLoading,
  navigateToPage,
  appApiLoadingManager
} from './js/app/loadingIntegration.js';
```

## Demo

A comprehensive demo of all loading states and transitions is available at `loading-demo.html`. To run the demo:

1. Start the local development server:
   ```
   node server.js
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000/loading-demo.html
   ```

The demo includes examples of:

- Button loading states
- Element loading states (overlay, error, success)
- Form loading states
- Section transitions
- Skeleton loading
- Progressive table with loading
- Progressive chart with loading

## Best Practices

1. **Consistent Messages**: Use consistent loading, error, and success messages throughout the application.
2. **Appropriate Timing**: Show loading indicators for operations that take longer than 300ms.
3. **Feedback**: Always provide feedback to users when operations are in progress or have completed.
4. **Progressive Enhancement**: Use skeleton loading for a better user experience when appropriate.
5. **Accessibility**: Ensure loading states and transitions are accessible to all users.
6. **Performance**: Use lightweight loading indicators for frequent operations.
7. **Error Handling**: Always provide clear error messages and recovery options.
