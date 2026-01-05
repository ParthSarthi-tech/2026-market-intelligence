// ========================================
// Machine Learning Engine
// ========================================

class MLEngine {
    constructor(companies, analyzer) {
        this.companies = companies;
        this.analyzer = analyzer;
    }

    // Normalize value to 0-1 range
    normalize(value, min, max) {
        if (max === min) return 0.5;
        return (value - min) / (max - min);
    }

    // Calculate undervaluation score using ML-inspired approach
    calculateUndervaluationScore(company) {
        const metrics = this.analyzer.calculateMetrics(company);
        
        // Get all companies' metrics for normalization
        const allMetrics = this.companies.map(c => this.analyzer.calculateMetrics(c));
        
        // Extract ranges
        const peRatios = allMetrics.map(m => m.priceToEquity).filter(v => Utils.isValidNumber(v));
        const margins = allMetrics.map(m => m.profitMargin).filter(v => Utils.isValidNumber(v));
        const debtRatios = allMetrics.map(m => m.debtToEquity).filter(v => Utils.isValidNumber(v));
        
        const peMin = Math.min(...peRatios);
        const peMax = Math.max(...peRatios);
        const marginMin = Math.min(...margins);
        const marginMax = Math.max(...margins);
        const debtMin = Math.min(...debtRatios);
        const debtMax = Math.max(...debtRatios);
        
        // Feature engineering
        const features = {
            // Lower PE is better (invert normalization)
            valuationScore: 1 - this.normalize(metrics.priceToEquity, peMin, peMax),
            // Higher margin is better
            profitabilityScore: this.normalize(metrics.profitMargin, marginMin, marginMax),
            // Lower debt is better (invert normalization)
            debtScore: 1 - this.normalize(metrics.debtToEquity, debtMin, debtMax),
            // ROE score
            roeScore: Utils.clamp(metrics.roe / 30, 0, 1)
        };
        
        // Weighted scoring
        const weights = {
            valuationScore: 0.35,
            profitabilityScore: 0.30,
            debtScore: 0.20,
            roeScore: 0.15
        };
        
        let score = 0;
        Object.keys(features).forEach(key => {
            score += features[key] * weights[key];
        });
        
        return Utils.clamp(score * 100, 0, 100);
    }

    // Calculate momentum score based on historical trends
    calculateMomentumScore(company) {
        if (company.years.length < 3) return 50; // Neutral if insufficient data
        
        const years = company.years;
        let score = 50; // Start neutral
        
        // Revenue momentum
        let revenueIncreasing = 0;
        for (let i = 1; i < years.length; i++) {
            if (years[i].revenue > years[i - 1].revenue) {
                revenueIncreasing++;
            }
        }
        const revenueMomentum = revenueIncreasing / (years.length - 1);
        
        // Profit momentum
        let profitIncreasing = 0;
        for (let i = 1; i < years.length; i++) {
            if (years[i].netProfit > years[i - 1].netProfit) {
                profitIncreasing++;
            }
        }
        const profitMomentum = profitIncreasing / (years.length - 1);
        
        // Calculate acceleration (are growth rates increasing?)
        const revenueGrowthRates = [];
        for (let i = 1; i < years.length; i++) {
            revenueGrowthRates.push(Utils.growthRate(years[i - 1].revenue, years[i].revenue));
        }
        
        let acceleration = 0;
        if (revenueGrowthRates.length >= 2) {
            for (let i = 1; i < revenueGrowthRates.length; i++) {
                if (revenueGrowthRates[i] > revenueGrowthRates[i - 1]) {
                    acceleration++;
                }
            }
            acceleration = acceleration / (revenueGrowthRates.length - 1);
        }
        
        // Weighted momentum score
        score = (revenueMomentum * 40) + (profitMomentum * 40) + (acceleration * 20);
        
        return Utils.clamp(score * 100, 0, 100);
    }

    // Predict 2026 revenue using simple linear regression
    predict2026Revenue(company) {
        if (company.years.length < 3) return null;
        
        const years = company.years.map((y, i) => i); // 0, 1, 2, 3, 4
        const revenues = company.years.map(y => y.revenue);
        
        // Calculate linear regression
        const n = years.length;
        const sumX = years.reduce((a, b) => a + b, 0);
        const sumY = revenues.reduce((a, b) => a + b, 0);
        const sumXY = years.reduce((sum, x, i) => sum + x * revenues[i], 0);
        const sumX2 = years.reduce((sum, x) => sum + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Predict for next year (years.length index)
        const predictedRevenue = slope * years.length + intercept;
        
        return Math.max(0, predictedRevenue); // No negative predictions
    }

    // Predict 2026 profit
    predict2026Profit(company) {
        if (company.years.length < 3) return null;
        
        const years = company.years.map((y, i) => i);
        const profits = company.years.map(y => y.netProfit);
        
        const n = years.length;
        const sumX = years.reduce((a, b) => a + b, 0);
        const sumY = profits.reduce((a, b) => a + b, 0);
        const sumXY = years.reduce((sum, x, i) => sum + x * profits[i], 0);
        const sumX2 = years.reduce((sum, x) => sum + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        const predictedProfit = slope * years.length + intercept;
        
        return predictedProfit; // Can be negative
    }

    // Classify company into investment category
    classifyCompany(company) {
        const healthScore = this.analyzer.calculateHealthScore(company);
        const undervalScore = this.calculateUndervaluationScore(company);
        const momentum = this.calculateMomentumScore(company);
        const risk = this.analyzer.calculateRisk(company);
        const metrics = this.analyzer.calculateMetrics(company);
        
        // Decision tree logic
        if (undervalScore > 70 && healthScore > 60) {
            return { category: 'undervalued', confidence: 0.9 };
        }
        
        if (healthScore < 40 && (metrics.debtToEquity > 3 || metrics.profitMargin < 0)) {
            return { category: 'overvalued', confidence: 0.85 };
        }
        
        if (momentum > 75 && healthScore > 50) {
            return { category: 'growth', confidence: 0.8 };
        }
        
        if (risk === 'low' && metrics.marketCap > 50000 && healthScore > 50) {
            return { category: 'stable', confidence: 0.85 };
        }
        
        // Default to neutral
        return { category: 'neutral', confidence: 0.5 };
    }

    // Generate ML-powered insights
    generateInsights(company) {
        const healthScore = this.analyzer.calculateHealthScore(company);
        const undervalScore = this.calculateUndervaluationScore(company);
        const momentum = this.calculateMomentumScore(company);
        const metrics = this.analyzer.calculateMetrics(company);
        const classification = this.classifyCompany(company);
        const predicted2026Revenue = this.predict2026Revenue(company);
        const predicted2026Profit = this.predict2026Profit(company);
        
        const insights = [];
        
        // Health insights
        if (healthScore > 70) {
            insights.push({ type: 'positive', text: 'Strong financial health with solid fundamentals' });
        } else if (healthScore < 40) {
            insights.push({ type: 'negative', text: 'Weak financial health - caution advised' });
        }
        
        // Valuation insights
        if (undervalScore > 70) {
            insights.push({ type: 'positive', text: 'Potentially undervalued with good upside' });
        } else if (metrics.priceToEquity > 8) {
            insights.push({ type: 'warning', text: 'High valuation - may be overpriced' });
        }
        
        // Momentum insights
        if (momentum > 75) {
            insights.push({ type: 'positive', text: 'Strong positive momentum in growth' });
        } else if (momentum < 30) {
            insights.push({ type: 'negative', text: 'Declining momentum - growth slowing' });
        }
        
        // Debt insights
        if (metrics.debtToEquity > 3) {
            insights.push({ type: 'negative', text: 'High debt levels pose risk' });
        } else if (metrics.debtToEquity < 0.5) {
            insights.push({ type: 'positive', text: 'Low debt provides financial flexibility' });
        }
        
        // Profitability insights
        if (metrics.profitMargin > 20) {
            insights.push({ type: 'positive', text: 'Excellent profit margins' });
        } else if (metrics.profitMargin < 0) {
            insights.push({ type: 'negative', text: 'Company is currently unprofitable' });
        }
        
        return {
            healthScore,
            undervalScore,
            momentum,
            classification,
            predicted2026Revenue,
            predicted2026Profit,
            insights
        };
    }

    // Analyze all companies with ML
    analyzeAllWithML() {
        return this.companies.map(company => ({
            ...company,
            ml: this.generateInsights(company)
        }));
    }

    // Get sector predictions for 2026
    getSectorPredictions() {
        const sectors = Utils.unique(this.companies.map(c => c.sector));
        
        return sectors.map(sector => {
            const sectorCompanies = this.companies.filter(c => c.sector === sector);
            const avgMomentum = Utils.average(
                sectorCompanies.map(c => this.calculateMomentumScore(c))
            );
            const avgHealth = Utils.average(
                sectorCompanies.map(c => this.analyzer.calculateHealthScore(c))
            );
            
            return {
                sector,
                momentum: avgMomentum,
                health: avgHealth,
                score: (avgMomentum * 0.6) + (avgHealth * 0.4)
            };
        }).sort((a, b) => b.score - a.score);
    }
}

// Make MLEngine available globally
window.MLEngine = MLEngine;