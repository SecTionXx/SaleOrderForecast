// chartUpdate.js
import { charts, enhancedPalette } from "./chartInit.js"
import { adaptiveChartOptimization } from "./chartOptimization.js"

function updateCharts(filteredData, chartColors, salesRepColors) {
  // Apply adaptive chart optimization based on dataset size and device capabilities
  console.log(`Updating charts with ${filteredData.length} data points`);
  // --- 1. Forecast & Actual by Month (Weighted) ---
  if (charts.monthlyForecastChart) {
    // Group by month (YYYY-MM), sum weightedValue and actual closed value
    const monthMap = {}

    // Ensure we cover at least 6 months for better visualization
    const today = new Date("2025-04-28")
    for (let i = 0; i < 6; i++) {
      const d = new Date(today)
      d.setMonth(d.getMonth() - i)
      const monthKey = d.toISOString().slice(0, 7)
      monthMap[monthKey] = { forecast: 0, actual: 0 }
    }

    filteredData.forEach((deal) => {
      let month = ""
      if (
        deal.expectedCloseDate instanceof Date &&
        !isNaN(deal.expectedCloseDate.getTime())
      ) {
        month = deal.expectedCloseDate.toISOString().slice(0, 7)
      } else if (
        typeof deal.expectedCloseDate === "string" &&
        deal.expectedCloseDate.length >= 7
      ) {
        month = deal.expectedCloseDate.slice(0, 7)
      }
      if (!month) return
      if (!monthMap[month]) monthMap[month] = { forecast: 0, actual: 0 }
      monthMap[month].forecast += deal.weightedValue || 0
      if ((deal.dealStage || "").toLowerCase() === "closed won") {
        monthMap[month].actual += deal.totalValue || 0 // Use actual value for closed deals
      }
    })

    // Sort months for proper timeline display
    const months = Object.keys(monthMap).sort()

    charts.monthlyForecastChart.data.labels = months
    charts.monthlyForecastChart.data.datasets = [
      {
        label: "Weighted Forecast",
        data: months.map((m) => monthMap[m].forecast),
        backgroundColor: enhancedPalette.blue[1],
        borderRadius: 6,
        barPercentage: 0.7,
        order: 2, // Draw bars below the line
      },
      {
        label: "Actual Closed",
        data: months.map((m) => monthMap[m].actual),
        type: "line",
        borderColor: enhancedPalette.green[0],
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        fill: false,
        tension: 0.2,
        borderWidth: 3,
        pointBackgroundColor: enhancedPalette.green[0],
        pointRadius: 5,
        pointHoverRadius: 7,
        order: 1, // Draw line above the bars
      },
    ]

    charts.monthlyForecastChart.update()
  }

  // --- 2. Deal Stage Chart (Proportion) ---
  if (charts.dealStageChart) {
    const stageMap = {}
    let totalDeals = 0

    // Define stage order for consistent coloring
    const stageOrder = [
      "Proposal Sent",
      "Negotiation",
      "Verbal Agreement",
      "Closed Won",
      "Closed Lost",
      "Lead",
    ]

    // Initialize all standard stages with 0 to ensure they appear even if no deals
    stageOrder.forEach((stage) => {
      stageMap[stage] = 0
    })

    // Count deals by stage
    filteredData.forEach((deal) => {
      const stage = deal.dealStage || "Unknown"
      stageMap[stage] = (stageMap[stage] || 0) + 1
      totalDeals++
    })

    // Get stages in the right order: first defined stages, then other stages
    const orderedStages = [
      ...stageOrder.filter((s) => stageMap[s] > 0),
      ...Object.keys(stageMap).filter(
        (s) => !stageOrder.includes(s) && stageMap[s] > 0
      ),
    ]

    // Create enhanced color mapping
    const stageBaseColors = {
      "Proposal Sent": enhancedPalette.blue[0],
      Negotiation: enhancedPalette.amber[0],
      "Verbal Agreement": enhancedPalette.orange[0],
      "Closed Won": enhancedPalette.green[0],
      "Closed Lost": enhancedPalette.red[0],
      Lead: enhancedPalette.purple[0],
      default: enhancedPalette.indigo[0],
    }

    // Map colors to stages
    const stageColors = orderedStages.map(
      (stage) => stageBaseColors[stage] || stageBaseColors.default
    )

    charts.dealStageChart.data.labels = orderedStages
    charts.dealStageChart.data.datasets = [
      {
        label: "Deal Stage",
        data: orderedStages.map((s) => stageMap[s]),
        backgroundColor: stageColors,
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ]

    // Update the center label text
    if (charts.dealStageChart.options.plugins.doughnutlabel?.labels) {
      charts.dealStageChart.options.plugins.doughnutlabel.labels[1].text =
        totalDeals.toString() // Update the second label (the number)
    }

    charts.dealStageChart.update()
  }

  // --- 3. Sales Performance Chart ---
  if (charts.salesPerformanceChart) {
    const repMap = {}

    // Add all sales reps with their total weighted value
    filteredData.forEach((deal) => {
      const rep = deal.salesRep || "Unknown"
      repMap[rep] = (repMap[rep] || 0) + (deal.weightedValue || 0)
    })

    // Sort sales reps by value for better visualization (desc)
    const sortedReps = Object.keys(repMap).sort((a, b) => repMap[b] - repMap[a])

    // Create an array of gradients for reps
    const ctx = charts.salesPerformanceChart.ctx
    const createGradient = (ctx, startColor, endColor) => {
      const gradient = ctx.createLinearGradient(0, 0, 400, 0)
      gradient.addColorStop(0, startColor)
      gradient.addColorStop(1, endColor)
      return gradient
    }

    // Create custom gradients for each rep
    const repGradients = sortedReps.map((rep, index) => {
      // Cycle through color palette
      const colorIndex = index % enhancedPalette.blue.length
      const palette =
        Object.values(enhancedPalette)[
          index % Object.keys(enhancedPalette).length
        ]
      return createGradient(ctx, palette[0], palette[1])
    })

    charts.salesPerformanceChart.data.labels = sortedReps
    charts.salesPerformanceChart.data.datasets = [
      {
        label: "Weighted Value",
        data: sortedReps.map((r) => repMap[r]),
        backgroundColor: repGradients,
        borderRadius: 6,
        borderSkipped: false,
      },
    ]

    charts.salesPerformanceChart.update()
  }

  // --- 4. Sales Funnel Chart ---
  if (charts.salesFunnelChart) {
    // Define funnel stages in order (top to bottom of funnel)
    const funnelStages = [
      "Proposal Sent",
      "Negotiation",
      "Verbal Agreement",
      "Closed Won",
      "Closed Lost",
    ]

    const funnelMap = {}
    // Initialize all standard stages with 0 to ensure they appear even if no deals
    funnelStages.forEach((stage) => {
      funnelMap[stage] = 0
    })

    // Count deals by stage
    filteredData.forEach((deal) => {
      const stage = deal.dealStage || "Unknown"
      funnelMap[stage] = (funnelMap[stage] || 0) + 1
    })

    // Create ordered stages array (first define standard funnel stages, then others)
    const allStages = [
      ...funnelStages.filter((s) => funnelMap[s] > 0),
      ...Object.keys(funnelMap).filter(
        (s) => !funnelStages.includes(s) && funnelMap[s] > 0
      ),
    ]

    // Create custom colors based on stage
    const stageColors = allStages.map((stage) => {
      const lowerStage = stage.toLowerCase()
      if (lowerStage.includes("proposal")) return enhancedPalette.blue[0]
      if (lowerStage.includes("negotiation")) return enhancedPalette.amber[0]
      if (lowerStage.includes("verbal")) return enhancedPalette.orange[0]
      if (lowerStage.includes("won")) return enhancedPalette.green[0]
      if (lowerStage.includes("lost")) return enhancedPalette.red[0]
      return enhancedPalette.purple[0] // Default for unknown stages
    })

    // Sort funnel stages if needed for visualization
    // For funnel, we typically reverse order: largest bar at top, smallest at bottom
    const stageData = allStages.map((stage) => funnelMap[stage])

    charts.salesFunnelChart.data.labels = allStages
    charts.salesFunnelChart.data.datasets = [
      {
        label: "Deal Count",
        data: stageData,
        backgroundColor: stageColors,
        borderRadius: 6,
        borderSkipped: false,
      },
    ]

    charts.salesFunnelChart.update()
  }

  // --- 5. Forecast Accuracy Chart ---
  if (charts.forecastAccuracyChart) {
    // Group by month, sum forecast and actual closed
    const monthMap = {}

    // Create a 6-month range for time-series visualization
    const today = new Date("2025-04-28")
    for (let i = 0; i < 6; i++) {
      const d = new Date(today)
      d.setMonth(d.getMonth() - i)
      const monthKey = d.toISOString().slice(0, 7)
      monthMap[monthKey] = { forecast: 0, actual: 0 }
    }

    filteredData.forEach((deal) => {
      let month = ""
      if (
        deal.expectedCloseDate instanceof Date &&
        !isNaN(deal.expectedCloseDate.getTime())
      ) {
        month = deal.expectedCloseDate.toISOString().slice(0, 7)
      } else if (
        typeof deal.expectedCloseDate === "string" &&
        deal.expectedCloseDate.length >= 7
      ) {
        month = deal.expectedCloseDate.slice(0, 7)
      }

      if (!month) return
      if (!monthMap[month]) monthMap[month] = { forecast: 0, actual: 0 }

      // Add weighted forecast value
      monthMap[month].forecast += deal.weightedValue || 0

      // Add actual value for closed won deals
      if ((deal.dealStage || "").toLowerCase() === "closed won") {
        monthMap[month].actual += deal.totalValue || 0
      }
    })

    // Sort months chronologically
    const months = Object.keys(monthMap).sort()

    // Calculate accuracy as percentage for additional dataset
    const accuracyData = months.map((month) => {
      const forecast = monthMap[month].forecast
      const actual = monthMap[month].actual
      if (forecast === 0 || actual === 0) return null
      return (actual / forecast) * 100 // Accuracy percentage
    })

    charts.forecastAccuracyChart.data.labels = months
    charts.forecastAccuracyChart.data.datasets = [
      {
        label: "Forecast (Weighted)",
        data: months.map((m) => monthMap[m].forecast),
        borderColor: enhancedPalette.blue[0],
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.3,
        borderWidth: 3,
        pointBackgroundColor: enhancedPalette.blue[0],
        pointRadius: 4,
        pointHoverRadius: 6,
        order: 2, // Draw below actual line
      },
      {
        label: "Actual Closed",
        data: months.map((m) => monthMap[m].actual),
        borderColor: enhancedPalette.green[0],
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.3,
        borderWidth: 3,
        pointBackgroundColor: enhancedPalette.green[0],
        pointRadius: 4,
        pointHoverRadius: 6,
        order: 1, // Draw above forecast line
      },
    ]

    charts.forecastAccuracyChart.update()
  }

  // --- 6. Deal Aging Chart ---
  if (charts.dealAgingChart) {
    // Define stages in consistent order
    const stages = [
      "Proposal Sent",
      "Negotiation",
      "Verbal Agreement",
      "Closed Won",
      "Closed Lost",
    ]

    // Create age buckets for each stage
    const buckets = {
      "<30": {},
      "30-60": {},
      ">60": {},
    }

    // Initialize all standard stages
    stages.forEach((stage) => {
      buckets["<30"][stage] = 0
      buckets["30-60"][stage] = 0
      buckets[">60"][stage] = 0
    })

    // Distribute deals into age buckets
    filteredData.forEach((deal) => {
      const stage = deal.dealStage || "Unknown"
      const age = deal.ageDays
      if (age == null) return

      let bucket
      if (age < 30) bucket = "<30"
      else if (age < 61) bucket = "30-60"
      else bucket = ">60"

      buckets[bucket][stage] = (buckets[bucket][stage] || 0) + 1
    })

    // Combine standard stages with any other stages found in data
    const uniqueStages = new Set([
      ...stages,
      ...Object.keys(buckets["<30"]),
      ...Object.keys(buckets["30-60"]),
      ...Object.keys(buckets[">60"]),
    ])
    const allStages = Array.from(uniqueStages)

    // Update chart data
    charts.dealAgingChart.data.labels = allStages
    charts.dealAgingChart.data.datasets = [
      {
        label: "<30 days",
        data: allStages.map((s) => buckets["<30"][s] || 0),
        backgroundColor: enhancedPalette.blue[1],
        borderRadius: 6,
        stack: "age",
      },
      {
        label: "30-60 days",
        data: allStages.map((s) => buckets["30-60"][s] || 0),
        backgroundColor: enhancedPalette.amber[1],
        borderRadius: 6,
        stack: "age",
      },
      {
        label: ">60 days",
        data: allStages.map((s) => buckets[">60"][s] || 0),
        backgroundColor: enhancedPalette.red[1],
        borderRadius: 6,
        stack: "age",
      },
    ]

    charts.dealAgingChart.update()
  }

  // --- 7. Win/Loss Reason Analysis Chart Update ---
  if (charts.winLossReasonChart) {
    // Filter for Closed Lost deals with a reason
    const lostDeals = filteredData.filter(
      (deal) =>
        (deal.dealStage || "").toLowerCase() === "closed lost" &&
        deal.winLossReason
    )
    // Count reasons
    const reasonMap = {}
    lostDeals.forEach((deal) => {
      const reason = deal.winLossReason || "Other"
      reasonMap[reason] = (reasonMap[reason] || 0) + 1
    })
    // Prepare data for chart
    const labels = Object.keys(reasonMap)
    const data = labels.map((r) => reasonMap[r])
    // Assign colors (cycle if more reasons than colors)
    const baseColors = [
      enhancedPalette.red[0],
      enhancedPalette.amber[0],
      enhancedPalette.blue[0],
      enhancedPalette.purple[0],
      enhancedPalette.green[0],
      enhancedPalette.indigo[0],
      enhancedPalette.orange[0],
      enhancedPalette.emerald[0],
    ]
    const backgroundColors = labels.map(
      (_, i) => baseColors[i % baseColors.length]
    )
    charts.winLossReasonChart.data.labels = labels
    charts.winLossReasonChart.data.datasets[0].data = data
    charts.winLossReasonChart.data.datasets[0].backgroundColor =
      backgroundColors
    charts.winLossReasonChart.update()
  }
  
  // Apply chart optimization after all charts have been updated with their data
  // This ensures the optimization is applied to the final datasets
  adaptiveChartOptimization(Object.values(charts).filter(chart => chart !== null), filteredData);
}

export { updateCharts }
