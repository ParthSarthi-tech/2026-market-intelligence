// ========================================
// Data Loader - CSV Parsing
// ========================================

class DataLoader {
    constructor() {
        this.rawData = [];
        this.processedData = [];
        this.companies = [];
    }

    // Load CSV file
    async loadCSV(filePath) {
        return new Promise((resolve, reject) => {
            Papa.parse(filePath, {
                download: true,
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    this.rawData = results.data;
                    this.processData();
                    resolve(this.processedData);
                },
                error: (error) => {
                    console.error('Error loading CSV:', error);
                    reject(error);
                }
            });
        });
    }

    // Process raw data
    processData() {
        // Clean headers (remove whitespace)
        this.rawData = this.rawData.map(row => {
            const cleaned = {};
            Object.keys(row).forEach(key => {
                const cleanKey = key.trim();
                cleaned[cleanKey] = row[key];
            });
            return cleaned;
        });

        // Group by company
        const companyGroups = {};
        
        this.rawData.forEach(row => {
            const ticker = row.Ticker;
            if (!ticker) return;

            if (!companyGroups[ticker]) {
                companyGroups[ticker] = {
                    company: row.Company,
                    ticker: row.Ticker,
                    sector: row.Sector,
                    years: []
                };
            }

            companyGroups[ticker].years.push({
                fy: row.FY,
                revenue: row.Revenue_Cr || 0,
                netProfit: row.Net_Profit_Cr || 0,
                totalDebt: row.Total_Debt_Cr || 0,
                totalEquity: row.Total_Equity_Cr || 0,
                marketCap: row.Market_Cap_Cr || 0
            });
        });

        // Convert to array and sort years
        this.companies = Object.values(companyGroups).map(company => {
            company.years.sort((a, b) => {
                const yearA = parseInt(a.fy.replace('FY', ''));
                const yearB = parseInt(b.fy.replace('FY', ''));
                return yearA - yearB;
            });
            return company;
        });

        this.processedData = this.companies;
    }

    // Get all unique sectors
    getSectors() {
        return Utils.unique(this.companies.map(c => c.sector)).filter(Boolean);
    }

    // Get companies by sector
    getCompaniesBySector(sector) {
        if (sector === 'all') return this.companies;
        return this.companies.filter(c => c.sector === sector);
    }

    // Get latest year data for each company
    getLatestData() {
        return this.companies.map(company => {
            const latestYear = company.years[company.years.length - 1];
            return {
                ...company,
                latest: latestYear,
                historicalData: company.years
            };
        });
    }

    // Search companies
    searchCompanies(query) {
        const lowerQuery = query.toLowerCase();
        return this.companies.filter(company => 
            company.company.toLowerCase().includes(lowerQuery) ||
            company.ticker.toLowerCase().includes(lowerQuery) ||
            company.sector.toLowerCase().includes(lowerQuery)
        );
    }

    // Get sector statistics
    getSectorStats() {
        const sectors = this.getSectors();
        return sectors.map(sector => {
            const companies = this.getCompaniesBySector(sector);
            const latestData = companies
                .map(c => c.years[c.years.length - 1])
                .filter(d => d.revenue > 0 && d.netProfit !== null);

            
            const totalRevenue = latestData.reduce((sum, d) => sum + (d.revenue || 0), 0);
            const totalProfit = latestData.reduce((sum, d) => sum + (d.netProfit || 0), 0);
            const avgMargin = latestData.length > 0 
                ? latestData.reduce((sum, d) => sum + Utils.safeDivide(d.netProfit, d.revenue) * 100, 0) / latestData.length 
                : 0;

            return {
                sector,
                companies: companies.length,
                totalRevenue,
                totalProfit,
                avgMargin
            };
        });
    }

    // Get top companies by market cap
    getTopByMarketCap(limit = 10) {
        const latest = this.getLatestData();
        return Utils.sortBy(latest, 'latest.marketCap', true).slice(0, limit);
    }

    // Calculate year-over-year growth for all companies
    calculateGrowthMetrics() {
        return this.companies.map(company => {
            const years = company.years;
            if (years.length < 2) {
                return { ...company, growth: null };
            }

            const revenueGrowth = [];
            const profitGrowth = [];

            for (let i = 1; i < years.length; i++) {
                const prevYear = years[i - 1];
                const currYear = years[i];

                revenueGrowth.push(Utils.growthRate(prevYear.revenue, currYear.revenue));
                profitGrowth.push(Utils.growthRate(prevYear.netProfit, currYear.netProfit));
            }

            return {
                ...company,
                growth: {
                    avgRevenueGrowth: Utils.average(revenueGrowth),
                    avgProfitGrowth: Utils.average(profitGrowth),
                    revenueGrowthTrend: revenueGrowth,
                    profitGrowthTrend: profitGrowth,
                    consistentGrowth: revenueGrowth.every(g => g > 0) && profitGrowth.every(g => g > 0)
                }
            };
        });
    }
}

// Make DataLoader available globally
window.DataLoader = DataLoader;