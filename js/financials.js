// ========================================
// Financial Analysis Engine
// ========================================

class FinancialAnalyzer {
    constructor(companies) {
        this.companies = companies;
    }

    // Calculate financial metrics for a company
    calculateMetrics(company) {
        const latestYear = company.years[company.years.length - 1];
        
        const metrics = {
            // Profitability
            profitMargin: Utils.safeDivide(latestYear.netProfit, latestYear.revenue) * 100,
            roe: Utils.safeDivide(latestYear.netProfit, latestYear.totalEquity) * 100,
            
            // Leverage
            debtToEquity: Utils.safeDivide(latestYear.totalDebt, latestYear.totalEquity),
            
            // Valuation
            priceToEquity: Utils.safeDivide(latestYear.marketCap, latestYear.totalEquity),
            priceToSales: Utils.safeDivide(latestYear.marketCap, latestYear.revenue),
            
            // Raw values
            revenue: latestYear.revenue,
            netProfit: latestYear.netProfit,
            totalDebt: latestYear.totalDebt,
            totalEquity: latestYear.totalEquity,
            marketCap: latestYear.marketCap
        };

        return metrics;
    }

    // Calculate financial health score (0-100)
    calculateHealthScore(company) {
        const metrics = this.calculateMetrics(company);
        
        let score = 0;
        
        // Profitability (40 points)
        if (metrics.profitMargin > 20) score += 20;
        else if (metrics.profitMargin > 10) score += 15;
        else if (metrics.profitMargin > 5) score += 10;
        else if (metrics.profitMargin > 0) score += 5;
        
        if (metrics.roe > 20) score += 20;
        else if (metrics.roe > 15) score += 15;
        else if (metrics.roe > 10) score += 10;
        else if (metrics.roe > 5) score += 5;
        
        // Debt management (30 points)
        if (metrics.debtToEquity < 0.5) score += 30;
        else if (metrics.debtToEquity < 1) score += 20;
        else if (metrics.debtToEquity < 2) score += 10;
        else if (metrics.debtToEquity < 3) score += 5;
        
        // Growth (30 points) - using historical data
        if (company.years.length >= 2) {
            const recentYear = company.years[company.years.length - 1];
            const prevYear = company.years[company.years.length - 2];
            
            const revenueGrowth = Utils.growthRate(prevYear.revenue, recentYear.revenue);
            const profitGrowth = Utils.growthRate(prevYear.netProfit, recentYear.netProfit);
            
            if (revenueGrowth > 20) score += 15;
            else if (revenueGrowth > 10) score += 10;
            else if (revenueGrowth > 5) score += 5;
            
            if (profitGrowth > 20) score += 15;
            else if (profitGrowth > 10) score += 10;
            else if (profitGrowth > 5) score += 5;
        }
        
        return Utils.clamp(score, 0, 100);
    }

    // Identify undervalued stocks
    findUndervalued() {
        return this.companies.filter(company => {
            const metrics = this.calculateMetrics(company);
            const healthScore = this.calculateHealthScore(company);
            
            return (
                healthScore > 60 && // Good fundamentals
                metrics.priceToEquity < 3 && // Low valuation
                metrics.profitMargin > 5 && // Profitable
                metrics.debtToEquity < 2 // Manageable debt
            );
        }).map(company => ({
            ...company,
            metrics: this.calculateMetrics(company),
            healthScore: this.calculateHealthScore(company)
        }));
    }

    // Identify overvalued stocks
    findOvervalued() {
        return this.companies.filter(company => {
            const metrics = this.calculateMetrics(company);
            const healthScore = this.calculateHealthScore(company);
            
            return (
                healthScore < 40 && // Poor fundamentals
                (metrics.priceToEquity > 5 || // High valuation
                 metrics.profitMargin < 0 || // Unprofitable
                 metrics.debtToEquity > 3) // High debt
            );
        }).map(company => ({
            ...company,
            metrics: this.calculateMetrics(company),
            healthScore: this.calculateHealthScore(company)
        }));
    }

    // Find consistent growth companies
    findGrowthLeaders() {
        return this.companies.filter(company => {
            if (company.years.length < 3) return false;
            
            let consistentGrowth = true;
            for (let i = 1; i < company.years.length; i++) {
                const prevYear = company.years[i - 1];
                const currYear = company.years[i];
                
                if (currYear.revenue <= prevYear.revenue || 
                    currYear.netProfit <= prevYear.netProfit) {
                    consistentGrowth = false;
                    break;
                }
            }
            
            return consistentGrowth;
        }).map(company => ({
            ...company,
            metrics: this.calculateMetrics(company),
            healthScore: this.calculateHealthScore(company)
        }));
    }

    // Find stable, low-risk companies
    findStableCompanies() {
        return this.companies.filter(company => {
            if (company.years.length < 3) return false;
            
            const metrics = this.calculateMetrics(company);
            const healthScore = this.calculateHealthScore(company);
            
            // Large market cap, consistent profits, low debt
            return (
                metrics.marketCap > 50000 && // Large cap (>50k Cr)
                metrics.debtToEquity < 1 && // Low debt
                healthScore > 50 && // Decent health
                company.years.every(y => y.netProfit > 0) // Always profitable
            );
        }).map(company => ({
            ...company,
            metrics: this.calculateMetrics(company),
            healthScore: this.calculateHealthScore(company)
        }));
    }

    // Calculate risk level
    calculateRisk(company) {
        const metrics = this.calculateMetrics(company);

        let riskScore = 0;

    // -------------------------
    // Debt Risk (heaviest weight)
    // -------------------------
        if (metrics.debtToEquity > 3) riskScore += 45;
        else if (metrics.debtToEquity > 2) riskScore += 30;
        else if (metrics.debtToEquity > 1) riskScore += 15;

    // -------------------------
    // Profitability Risk
    // -------------------------
        if (metrics.profitMargin < 0) riskScore += 40;
        else if (metrics.profitMargin < 5) riskScore += 25;
        else if (metrics.profitMargin < 10) riskScore += 10;

    // -------------------------
    // Valuation Risk
    // -------------------------
        if (metrics.priceToEquity > 12) riskScore += 20;
        else if (metrics.priceToEquity > 7) riskScore += 10;

    // -------------------------
    // FINAL CALIBRATION (KEY FIX)
    // -------------------------
        if (riskScore >= 65) return 'high';
        if (riskScore >= 35) return 'medium';
        return 'low';
    }


    // Calculate potential return (simple heuristic)
    calculatePotentialReturn(company) {
        const metrics = this.calculateMetrics(company);
        const healthScore = this.calculateHealthScore(company);
        
        // Growth companies with good health and low valuation = high potential
        let potential = healthScore;
        
        if (metrics.priceToEquity < 2) potential += 20;
        if (metrics.profitMargin > 15) potential += 15;
        if (metrics.debtToEquity < 0.5) potential += 10;
        
        // Historical growth
        if (company.years.length >= 2) {
            const recentYear = company.years[company.years.length - 1];
            const prevYear = company.years[company.years.length - 2];
            const growth = Utils.growthRate(prevYear.revenue, recentYear.revenue);
            
            if (growth > 20) potential += 15;
            else if (growth > 10) potential += 10;
        }
        
        return Utils.clamp(potential, 0, 100);
    }

    // Get risk-return data for all companies
    getRiskReturnData() {
        return this.companies.map(company => ({
            company: company.company,
            ticker: company.ticker,
            sector: company.sector,
            risk: company.risk,
            potentialReturn: this.calculatePotentialReturn(company),
            healthScore: this.calculateHealthScore(company),
            metrics: this.calculateMetrics(company)
        }));
    }

    // Analyze all companies
    analyzeAll() {
        return this.companies.map(company => ({
            ...company,
            metrics: this.calculateMetrics(company),
            healthScore: this.calculateHealthScore(company),
            risk: this.calculateRisk(company),
            potentialReturn: this.calculatePotentialReturn(company)
        }));
    }
}

// Make FinancialAnalyzer available globally
window.FinancialAnalyzer = FinancialAnalyzer;