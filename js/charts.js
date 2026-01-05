// ========================================
// Charts & Visualizations
// ========================================

class ChartManager {
    constructor() {
        this.charts = {};
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#E7EBF0',
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(19, 47, 76, 0.9)',
                    titleColor: '#00D9FF',
                    bodyColor: '#E7EBF0',
                    borderColor: '#00D9FF',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    ticks: { color: '#8B98A8' },
                    grid: { color: 'rgba(139, 152, 168, 0.1)' }
                },
                x: {
                    ticks: { color: '#8B98A8' },
                    grid: { color: 'rgba(139, 152, 168, 0.1)' }
                }
            }
        };
    }

    // Destroy existing chart
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    }

    // Market Pulse Chart (Sector Distribution)
    createMarketPulseChart(data) {
        this.destroyChart('marketPulse');
        
        const ctx = document.getElementById('marketPulseChart');
        if (!ctx) return;
        
        const sectorCounts = {};
        data.forEach(company => {
            sectorCounts[company.sector] = (sectorCounts[company.sector] || 0) + 1;
        });
        
        this.charts.marketPulse = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(sectorCounts),
                datasets: [{
                    data: Object.values(sectorCounts),
                    backgroundColor: [
                        '#00D9FF', '#00FF88', '#FFB020', '#FF4560',
                        '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'
                    ],
                    borderWidth: 2,
                    borderColor: '#0A1929'
                }]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    ...this.defaultOptions.plugins,
                    legend: {
                        position: 'right',
                        labels: { color: '#E7EBF0', font: { size: 11 } }
                    }
                }
            }
        });
    }

    // Sector Performance Chart
    createSectorChart(sectorStats) {
        this.destroyChart('sector');
        
        const ctx = document.getElementById('sectorChart');
        if (!ctx) return;
        
        const sectors = sectorStats.map(s => s.sector);
        const revenues = sectorStats.map(s => s.totalRevenue);
        const profits = sectorStats.map(s => s.totalProfit);
        
        this.charts.sector = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sectors,
                datasets: [
                    {
                        label: 'Revenue (Cr)',
                        data: revenues,
                        backgroundColor: 'rgba(0, 217, 255, 0.7)',
                        borderColor: '#00D9FF',
                        borderWidth: 2
                    },
                    {
                        label: 'Net Profit (Cr)',
                        data: profits,
                        backgroundColor: 'rgba(0, 255, 136, 0.7)',
                        borderColor: '#00FF88',
                        borderWidth: 2
                    }
                ]
            },
            options: this.defaultOptions
        });
    }

    // Momentum Chart
    createMomentumChart(sectorPredictions) {
        this.destroyChart('momentum');
        
        const ctx = document.getElementById('momentumChart');
        if (!ctx) return;
        
        const sectors = sectorPredictions.map(s => s.sector);
        const scores = sectorPredictions.map(s => s.score);
        
        this.charts.momentum = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: sectors,
                datasets: [{
                    label: '2026 Momentum Score',
                    data: scores,
                    backgroundColor: 'rgba(0, 217, 255, 0.2)',
                    borderColor: '#00D9FF',
                    borderWidth: 2,
                    pointBackgroundColor: '#00FF88',
                    pointBorderColor: '#00D9FF',
                    pointRadius: 5
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(139, 152, 168, 0.2)' },
                        grid: { color: 'rgba(139, 152, 168, 0.2)' },
                        pointLabels: { color: '#8B98A8', font: { size: 11 } },
                        ticks: { color: '#8B98A8', backdropColor: 'transparent' },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }

    // Risk vs Return Scatter Plot
    createRiskReturnChart(riskReturnData) {
        this.destroyChart('riskReturn');
        
        const ctx = document.getElementById('riskReturnChart');
        if (!ctx) return;
        
        const data= riskReturnData.map(item =>{
            let riskValue;

            switch (item.risk?.toLowerCase()){
                case 'low':
                    riskValue=1;
                    break;
                case 'medium':
                    riskValue=2;
                    break;
                case 'high':
                    riskValue=3;
                    break;
                default:
                    console.warn('Invalid risk value:',item.risk,item.company);
                    riskValue=2;//fallback to medium
            }

            return {
                x: riskValue,
                y: item.potentialReturn,
                company: item.company,
                ticker: item.ticker
            };
        });
        console.table(
            riskReturnData.map(d => ({
                company: d.company,
                risk: d.risk,
                 potentialReturn: d.potentialReturn
            }))
        );

        
        this.charts.riskReturn = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Companies',
                    data: data,
                    backgroundColor: 'rgba(0, 217, 255, 0.6)',
                    borderColor: '#00D9FF',
                    borderWidth: 2,
                    pointRadius: 8,
                    pointHoverRadius: 12
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Risk Level',
                            color: '#E7EBF0'
                        },
                        ticks: {
                            color: '#8B98A8',
                            callback: (value) => {
                                if (value === 1) return 'Low';
                                if (value === 2) return 'Medium';
                                if (value === 3) return 'High';
                                return '';
                            }
                        },
                        grid: { color: 'rgba(139, 152, 168, 0.1)' },
                        min: 0.5,
                        max: 3.5
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Potential Return Score',
                            color: '#E7EBF0'
                        },
                        ticks: { color: '#8B98A8' },
                        grid: { color: 'rgba(139, 152, 168, 0.1)' },
                        min: 0,
                        max: 100
                    }
                },
                plugins: {
                    ...this.defaultOptions.plugins,
                    tooltip: {
                        ...this.defaultOptions.plugins.tooltip,
                        callbacks: {
                            label: (context) => {
                                const point = context.raw;
                                return [
                                    `${point.company} (${point.ticker})`,
                                    `Return Score: ${point.y.toFixed(1)}`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }

    // Revenue Growth Chart
    createRevenueGrowthChart(companies) {
        this.destroyChart('revenueGrowth');
        
        const ctx = document.getElementById('revenueGrowthChart');
        if (!ctx) return;
        
        // Top 8 companies by latest revenue
        const topCompanies = companies
            .sort((a, b) => {
                const aRev = a.years[a.years.length - 1].revenue;
                const bRev = b.years[b.years.length - 1].revenue;
                return bRev - aRev;
            })
            .slice(0, 8);
        
        const datasets = topCompanies.map((company, i) => {
            const colors = ['#00D9FF', '#00FF88', '#FFB020', '#FF4560', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];
            return {
                label: company.company,
                data: company.years.map(y => y.revenue),
                borderColor: colors[i],
                backgroundColor: colors[i] + '33',
                borderWidth: 2,
                tension: 0.4
            };
        });
        
        const labels = topCompanies[0].years.map(y => y.fy);
        
        this.charts.revenueGrowth = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                ...this.defaultOptions,
                scales: {
                    ...this.defaultOptions.scales,
                    y: {
                        ...this.defaultOptions.scales.y,
                        title: {
                            display: true,
                            text: 'Revenue (Crores)',
                            color: '#E7EBF0'
                        }
                    }
                }
            }
        });
    }

    // Debt to Equity Chart
    createDebtEquityChart(companies) {
        this.destroyChart('debtEquity');
        
        const ctx = document.getElementById('debtEquityChart');
        if (!ctx) return;
        
        // Top 10 by market cap
        const topCompanies = companies
            .sort((a, b) => {
                const aMC = a.years[a.years.length - 1].marketCap;
                const bMC = b.years[b.years.length - 1].marketCap;
                return bMC - aMC;
            })
            .slice(0, 10);
        
        const labels = topCompanies.map(c => c.ticker);
        const debtToEquity = topCompanies.map(c => {
            const latest = c.years[c.years.length - 1];
            return Utils.safeDivide(latest.totalDebt, latest.totalEquity);
        });
        
        const colors = debtToEquity.map(ratio => {
            if (ratio < 1) return '#00FF88';
            if (ratio < 2) return '#FFB020';
            return '#FF4560';
        });
        
        this.charts.debtEquity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Debt-to-Equity Ratio',
                    data: debtToEquity,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 2
                }]
            },
            options: {
                ...this.defaultOptions,
                scales: {
                    ...this.defaultOptions.scales,
                    y: {
                        ...this.defaultOptions.scales.y,
                        title: {
                            display: true,
                            text: 'D/E Ratio',
                            color: '#E7EBF0'
                        }
                    }
                },
                plugins: {
                    ...this.defaultOptions.plugins,
                    legend: { display: false }
                }
            }
        });
    }
}

// Make ChartManager available globally
window.ChartManager = ChartManager;