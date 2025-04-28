// chartInit.js

// Chart.js global variables (to be imported in script.js)
const charts = {
  monthlyForecastChart: null,
  dealStageChart: null,
  salesPerformanceChart: null,
  salesFunnelChart: null,
  forecastAccuracyChart: null,
  dealAgingChart: null,
}

// Enhanced palette with more distinct colors
const enhancedPalette = {
  blue: ["rgba(59, 130, 246, 1)", "rgba(59, 130, 246, 0.8)"], // Primary blue
  green: ["rgba(16, 185, 129, 1)", "rgba(16, 185, 129, 0.8)"], // Success green
  amber: ["rgba(245, 158, 11, 1)", "rgba(245, 158, 11, 0.8)"], // Warning amber
  orange: ["rgba(249, 115, 22, 1)", "rgba(249, 115, 22, 0.8)"], // Orange
  purple: ["rgba(139, 92, 246, 1)", "rgba(139, 92, 246, 0.8)"], // Purple
  red: ["rgba(239, 68, 68, 1)", "rgba(239, 68, 68, 0.8)"], // Danger red
  indigo: ["rgba(79, 70, 229, 1)", "rgba(79, 70, 229, 0.8)"], // Indigo
  emerald: ["rgba(10, 150, 110, 1)", "rgba(10, 150, 110, 0.8)"], // Emerald
}

// Helper function for currency formatting
const formatCurrency = (value) => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Helper function to format month labels
const formatMonthLabel = (monthStr) => {
  if (!monthStr || monthStr.length < 7) return monthStr

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  const year = monthStr.substring(2, 4) // Get last two digits of year
  const monthIndex = parseInt(monthStr.substring(5, 7), 10) - 1

  return months[monthIndex] + "-" + year
}

function initializeCharts(salesRepColors, chartColors) {
  // --- Chart Default Options ---
  Chart.defaults.font.family = "'Inter', 'Sarabun', sans-serif"
  Chart.defaults.plugins.tooltip.padding = 10
  Chart.defaults.plugins.tooltip.cornerRadius = 6
  Chart.defaults.plugins.tooltip.titleFont = { weight: "bold", size: 13 }
  Chart.defaults.plugins.tooltip.bodyFont = { size: 12 }
  Chart.defaults.plugins.tooltip.backgroundColor = "rgba(17, 24, 39, 0.9)" // dark gray with 90% opacity

  Chart.defaults.plugins.tooltip.callbacks.label = function (context) {
    let label = context.dataset.label || ""
    if (label) {
      label += ": "
    }
    if (context.parsed.y !== null) {
      // Check if it's likely currency based on chart ID or label
      if (
        context.chart.canvas.id.toLowerCase().includes("value") ||
        context.chart.canvas.id.toLowerCase().includes("forecast") ||
        context.dataset.label?.toLowerCase().includes("value") ||
        context.dataset.label?.toLowerCase().includes("forecast") ||
        context.dataset.label?.toLowerCase().includes("actual")
      ) {
        label += formatCurrency(context.parsed.y)
      } else {
        label += context.parsed.y // Use raw number for counts etc.
      }
    }
    // Add percentage for doughnut/pie charts
    if (
      context.chart.config.type === "doughnut" ||
      context.chart.config.type === "pie"
    ) {
      const total = context.chart.data.datasets[0].data.reduce(
        (a, b) => a + b,
        0
      )
      const percentage =
        total > 0 ? ((context.parsed / total) * 100).toFixed(1) + "%" : "0%"
      label += ` (${percentage})`
    }
    return label
  }

  Chart.defaults.plugins.datalabels.anchor = "end"
  Chart.defaults.plugins.datalabels.align = "top"
  Chart.defaults.plugins.datalabels.formatter = (value, context) => {
    // Only show labels for values > 0 for cleaner look
    if (value <= 0) return null
    // Format currency for specific charts
    if (
      context.chart.canvas.id === "monthlyForecastChart" ||
      context.chart.canvas.id === "salesPerformanceChart" ||
      context.chart.canvas.id === "forecastAccuracyChart"
    ) {
      return formatCurrency(value)
    }
    return value // Return raw number for counts
  }
  Chart.defaults.plugins.datalabels.font = {
    size: 10,
    weight: "500",
  }
  Chart.defaults.plugins.datalabels.color = "#4b5563" // text-gray-700

  // Create custom gradient for chart backgrounds
  const createGradient = (ctx, color1, color2) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400)
    gradient.addColorStop(0, color1)
    gradient.addColorStop(1, color2)
    return gradient
  }

  // --- 1. Monthly Forecast Chart ---
  const monthlyCtx = document.getElementById("monthlyForecastChart")
  if (monthlyCtx) {
    // Create gradients for better visual appeal
    const ctx = monthlyCtx.getContext("2d")
    const forecastGradient = createGradient(
      ctx,
      "rgba(59, 130, 246, 0.8)",
      "rgba(59, 130, 246, 0.2)"
    )

    charts.monthlyForecastChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Weighted Forecast",
            data: [],
            backgroundColor: forecastGradient,
            borderRadius: 4,
            barPercentage: 0.7,
            order: 2, // Draw bars below the line
          },
          {
            label: "Actual Closed",
            data: [],
            type: "line", // Change to line chart
            borderColor: enhancedPalette.green[0],
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            borderWidth: 3,
            pointBackgroundColor: enhancedPalette.green[0],
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.2,
            order: 1, // Draw line above the bars
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              usePointStyle: true,
              boxWidth: 8,
              padding: 15,
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              title: function (tooltipItems) {
                return formatMonthLabel(tooltipItems[0].label)
              },
            },
          },
          datalabels: {
            display: function (context) {
              // Only show labels for bars, not for line points
              if (context.datasetIndex === 1) return false // Don't show labels for the line chart
              // Only show labels for larger values to prevent clutter
              return context.dataset.data[context.dataIndex] > 500000
            },
            formatter: (value) => (value > 0 ? formatCurrency(value) : null),
            font: {
              weight: "600",
            },
            offset: 5,
          },
        },
        scales: {
          x: {
            stacked: false,
            grid: {
              display: false, // Remove vertical grid lines
            },
            ticks: {
              callback: function (value, index, ticks) {
                // Format month labels
                return formatMonthLabel(this.getLabelForValue(value))
              },
            },
          },
          y: {
            stacked: false,
            beginAtZero: true,
            title: {
              display: true,
              text: "Value (THB)",
              font: {
                weight: "500",
              },
            },
            grid: {
              color: "rgba(156, 163, 175, 0.15)", // Lighter grid lines
            },
            ticks: {
              callback: function (value) {
                // Use K/M/B notation for large numbers
                if (value >= 1000000) return (value / 1000000).toFixed(1) + "M"
                if (value >= 1000) return (value / 1000).toFixed(0) + "K"
                return value
              },
            },
          },
        },
        animation: {
          duration: 1200, // Slower animation for better visual
          easing: "easeOutQuart",
        },
      },
    })
  }

  // --- 2. Deal Stage Chart ---
  const dealStageCtx = document.getElementById("dealStageChart")
  if (dealStageCtx) {
    // Create enhanced colors with better contrast for the doughnut chart
    const stageBaseColors = {
      "Proposal Sent": enhancedPalette.blue[0],
      Negotiation: enhancedPalette.amber[0],
      "Verbal Agreement": enhancedPalette.orange[0],
      "Closed Won": enhancedPalette.green[0],
      "Closed Lost": enhancedPalette.red[0],
      Lead: enhancedPalette.purple[0],
      default: enhancedPalette.indigo[0],
    }

    charts.dealStageChart = new Chart(dealStageCtx.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [
          {
            label: "Deal Stage",
            data: [],
            backgroundColor: Object.values(stageBaseColors),
            borderWidth: 2,
            borderColor: "#ffffff",
            hoverBorderWidth: 4,
            hoverOffset: 15,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20,
            bottom: 20,
            left: 20,
            right: 20,
          },
        },
        cutout: "55%", // Adjusted for better appearance with larger chart
        plugins: {
          legend: {
            display: true,
            position: "right",
            align: "center",
            labels: {
              boxWidth: 15, // Increased box size for better visibility
              padding: 15, // Increased padding between items
              usePointStyle: true,
              pointStyle: "rectRounded",
              font: {
                size: 13, // Increased font size for better readability
                weight: "500",
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.label || ""
                if (label) {
                  label += ": "
                }
                const value = context.parsed
                const total = context.chart.data.datasets[0].data.reduce(
                  (a, b) => a + b,
                  0
                )
                const percentage =
                  total > 0 ? ((value / total) * 100).toFixed(1) + "%" : "0%"
                label += `${value} (${percentage})`
                return label
              },
            },
            padding: 12,
            titleFont: { size: 14 },
            bodyFont: { size: 13 },
          },
          datalabels: {
            display: function (context) {
              // Only show labels for slices > 5% of total to avoid clutter
              const total = context.chart.data.datasets[0].data.reduce(
                (a, b) => a + b,
                0
              )
              return context.dataset.data[context.dataIndex] / total > 0.05
            },
            formatter: (value, ctx) => {
              if (value <= 0) return null
              let sum = 0
              let dataArr = ctx.chart.data.datasets[0].data
              dataArr.forEach((data) => {
                sum += data
              })
              let percentage =
                sum > 0 ? ((value * 100) / sum).toFixed(1) + "%" : "0%"
              return percentage // Show percentage on slices
            },
            color: "#fff", // White text on slices
            font: {
              weight: "bold",
              size: 14, // Increased size for better visibility
            },
            anchor: "center",
            align: "center",
          },
          doughnutlabel: {
            // Custom plugin for center label
            labels: [
              {
                text: "Total Deals", // Default text
                font: {
                  size: "18", // Increased from 16
                  weight: "600",
                  family: "'Inter', 'Sarabun', sans-serif",
                },
                color: "#4b5563", // text-gray-700
              },
              {
                text: "0", // Default value, will be updated
                font: {
                  size: "32", // Increased from 28
                  weight: "700",
                  family: "'Inter', 'Sarabun', sans-serif",
                },
                color: "#1f2937", // text-gray-800
              },
            ],
          },
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1200,
        },
      },
    })
  }

  // --- 3. Sales Performance Chart ---
  const salesPerformanceCtx = document.getElementById("salesPerformanceChart")
  if (salesPerformanceCtx) {
    const ctx = salesPerformanceCtx.getContext("2d")
    // Create an array of gradients for reps
    const repGradients = salesRepColors.map((color, index) => {
      const baseColor = color.slice(0, -4) // Remove opacity
      return createGradient(
        ctx,
        baseColor + "0.85)", // More opaque at top
        baseColor + "0.55)" // More transparent at bottom
      )
    })

    charts.salesPerformanceChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: "Weighted Value", // Corrected label
            data: [],
            backgroundColor: repGradients,
            borderRadius: 4,
            borderSkipped: false, // Show rounded corners on all sides
          },
        ],
      },
      options: {
        indexAxis: "y", // Make it a horizontal bar chart for better readability with many reps
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }, // Hide legend if only one dataset
          tooltip: {
            mode: "index",
            axis: "y",
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${formatCurrency(
                  context.parsed.x
                )}`
              },
            },
          },
          datalabels: {
            // Enable data labels
            display: true,
            anchor: "end",
            align: "right", // Align to the end of the bar
            formatter: (value) => (value > 0 ? formatCurrency(value) : null),
            font: {
              size: 11,
              weight: "600",
            },
            color: "#374151",
            padding: {
              left: 10,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Weighted Value (THB)",
              font: { weight: "500" },
            },
            grid: {
              color: "rgba(156, 163, 175, 0.15)", // Lighter grid lines
            },
            ticks: {
              callback: function (value) {
                // Use K/M/B notation for large numbers
                if (value >= 1000000) return (value / 1000000).toFixed(1) + "M"
                if (value >= 1000) return (value / 1000).toFixed(0) + "K"
                return value
              },
            },
          },
          y: {
            ticks: {
              autoSkip: false,
              font: {
                weight: "500",
              },
            },
            grid: {
              display: false,
            },
          },
        },
        animation: {
          duration: 1200,
          easing: "easeOutQuart",
        },
      },
    })
  }

  // --- 4. Sales Funnel Chart ---
  const salesFunnelCtx = document.getElementById("salesFunnelChart")
  if (salesFunnelCtx) {
    const ctx = salesFunnelCtx.getContext("2d")

    // Create color gradients for funnel stages
    const stageColors = Object.values(chartColors)
    const stageGradients = stageColors.map((color, index) => {
      // Extract the base color without opacity
      let baseColor = color
      if (baseColor.startsWith("rgba")) {
        const parts = baseColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/)
        if (parts) {
          baseColor = `rgba(${parts[1]}, ${parts[2]}, ${parts[3]}`
        }
      }

      return createGradient(
        ctx,
        baseColor + ", 0.9)", // More opaque
        baseColor + ", 0.7)" // More transparent
      )
    })

    charts.salesFunnelChart = new Chart(ctx, {
      type: "bar", // Keep as bar for funnel stages
      data: {
        labels: [], // Will be ordered stages
        datasets: [
          {
            label: "Deal Count", // Corrected label
            data: [],
            backgroundColor: stageGradients, // Use stage gradients
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: "y", // Horizontal for better stage readability
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }, // Hide legend if only one dataset
          tooltip: {
            mode: "index",
            axis: "y",
          },
          datalabels: {
            // Enable data labels
            display: true,
            anchor: "end",
            align: "right",
            formatter: (value) => (value > 0 ? value : null), // Show count, hide if 0
            font: {
              size: 11,
              weight: "600",
            },
            color: "#374151",
            padding: {
              left: 10,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Number of Deals",
              font: { weight: "500" },
            },
            grid: {
              color: "rgba(156, 163, 175, 0.15)", // Lighter grid lines
            },
          },
          y: {
            // Ensure stages are in the correct order (handled in updateCharts)
            ticks: {
              autoSkip: false,
              font: {
                weight: "500",
              },
            },
            grid: {
              display: false,
            },
          },
        },
        animation: {
          duration: 1200,
          easing: "easeOutQuart",
        },
      },
    })
  }

  // --- 5. Forecast Accuracy Chart ---
  const forecastAccuracyCtx = document.getElementById("forecastAccuracyChart")
  if (forecastAccuracyCtx) {
    const ctx = forecastAccuracyCtx.getContext("2d")

    charts.forecastAccuracyChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Forecast (Weighted)", // Corrected label
            data: [],
            borderColor: enhancedPalette.blue[0],
            backgroundColor: createGradient(
              ctx,
              "rgba(59, 130, 246, 0.2)",
              "rgba(59, 130, 246, 0.01)"
            ),
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointBackgroundColor: enhancedPalette.blue[0],
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            // Added Actual Closed dataset definition
            label: "Actual Closed",
            data: [],
            borderColor: enhancedPalette.green[0],
            backgroundColor: createGradient(
              ctx,
              "rgba(16, 185, 129, 0.2)",
              "rgba(16, 185, 129, 0.01)"
            ),
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointBackgroundColor: enhancedPalette.green[0],
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              usePointStyle: true,
              boxWidth: 8,
              padding: 15,
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              title: function (tooltipItems) {
                return formatMonthLabel(tooltipItems[0].label)
              },
            },
          },
          datalabels: {
            display: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              callback: function (value, index, ticks) {
                // Format month labels
                return formatMonthLabel(this.getLabelForValue(value))
              },
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Value (THB)",
              font: { weight: "500" },
            },
            grid: {
              color: "rgba(156, 163, 175, 0.15)", // Lighter grid lines
            },
            ticks: {
              callback: function (value) {
                // Use K/M/B notation for large numbers
                if (value >= 1000000) return (value / 1000000).toFixed(1) + "M"
                if (value >= 1000) return (value / 1000).toFixed(0) + "K"
                return value
              },
            },
          },
        },
        interaction: {
          mode: "nearest",
          axis: "x",
          intersect: false,
        },
        animation: {
          duration: 1200,
          easing: "easeOutQuart",
        },
      },
    })
  }

  // --- 6. Deal Aging Chart ---
  const dealAgingCtx = document.getElementById("dealAgingChart")
  if (dealAgingCtx) {
    charts.dealAgingChart = new Chart(dealAgingCtx.getContext("2d"), {
      type: "bar",
      data: {
        labels: [], // Stages
        datasets: [
          {
            label: "<30 days",
            data: [],
            backgroundColor: enhancedPalette.blue[1],
            borderRadius: 4,
            stack: "age",
          },
          {
            label: "30-60 days",
            data: [],
            backgroundColor: enhancedPalette.amber[1],
            borderRadius: 4,
            stack: "age",
          },
          {
            label: ">60 days",
            data: [],
            backgroundColor: enhancedPalette.red[1],
            borderRadius: 4,
            stack: "age",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              usePointStyle: true,
              boxWidth: 8,
              padding: 15,
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
          datalabels: {
            // Enable data labels for stacks
            display: function (context) {
              // Only show labels for values > 0 and avoid tiny segments
              return context.dataset.data[context.dataIndex] > 2
            },
            formatter: (value) => (value > 0 ? value : null), // Show count, hide if 0
            color: "#fff", // White text inside bars
            font: { weight: "bold", size: 10 },
            anchor: "center",
            align: "center",
          },
        },
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: "Deal Stage",
              font: { weight: "500" },
            },
            grid: {
              display: false,
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: "Number of Deals",
              font: { weight: "500" },
            },
            grid: {
              color: "rgba(156, 163, 175, 0.15)", // Lighter grid lines
            },
            // Make sure labels are integers since we're counting deals
            ticks: {
              stepSize: 1,
            },
          },
        },
        animation: {
          duration: 1200,
          easing: "easeOutQuart",
        },
      },
    })
  }
}

export { initializeCharts, charts, enhancedPalette }
