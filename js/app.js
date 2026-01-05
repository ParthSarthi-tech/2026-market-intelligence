// ========================================
// Main Application Controller
// ========================================

class App {
    constructor() {
        this.dataLoader = new DataLoader();
        this.analyzer = null;
        this.mlEngine = null;
        this.chartManager = new ChartManager();
        this.currentCategory = 'all';
        this.currentSector = 'all';
        this.currentRisk = 'all';
        this.searchQuery = '';
        this.allAnalyzedData = [];
    }

    async init() {
        try {
            // Load CSV data
            await this.dataLoader.loadCSV('data/indian_companies_financials.csv');
            
            // Initialize analyzers
            this.analyzer = new FinancialAnalyzer(this.dataLoader.companies);
            this.mlEngine = new MLEngine(this.dataLoader.companies, this.analyzer);
            
            // Analyze all companies
            this.allAnalyzedData = this.mlEngine.analyzeAllWithML();
            
            // Setup UI
            this.setupEventListeners();
            this.populateFilters();
            this.renderDashboard();
            this.hideLoading();
            
            Utils.notify('Market Intelligence Loaded Successfully!', 'success');
        } catch (error) {
            console.error('Initialization error:', error);
            Utils.notify('Error loading data. Please check CSV file path.', 'error');
            this.hideLoading();
        }
    }

    hideLoading() {
        const loader = document.getElementById('loadingScreen');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 500);
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Category tabs
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.currentCategory = e.target.dataset.category;
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.renderStocks();
            });
        });

        // Filters
        const sectorFilter = document.getElementById('sectorFilter');
        if (sectorFilter) {
            sectorFilter.addEventListener('change', (e) => {
                this.currentSector = e.target.value;
                this.renderStocks();
            });
        }

        const riskFilter = document.getElementById('riskFilter');
        if (riskFilter) {
            riskFilter.addEventListener('change', (e) => {
                this.currentRisk = e.target.value;
                this.renderStocks();
            });
        }

        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.renderStocks();
            }, 300));
        }

        // Modal close
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                document.getElementById('companyModal').classList.remove('show');
            });
        }

        // Close modal on outside click
        document.getElementById('companyModal').addEventListener('click', (e) => {
            if (e.target.id === 'companyModal') {
                e.target.classList.remove('show');
            }
        });
    }

    switchSection(sectionId) {
        // Update nav
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');

        // Render appropriate content
        if (sectionId === 'dashboard') this.renderDashboard();
        if (sectionId === 'sectors') this.renderSectors();
        if (sectionId === 'stocks') this.renderStocks();
        if (sectionId === 'analysis') this.renderAnalysis();
    }

    populateFilters() {
        const sectors = this.dataLoader.getSectors();
        const sectorFilter = document.getElementById('sectorFilter');
        
        if (sectorFilter) {
            sectors.forEach(sector => {
                const option = document.createElement('option');
                option.value = sector;
                option.textContent = sector;
                sectorFilter.appendChild(option);
            });
        }
    }

    renderDashboard() {
        // Animate stats
        const statElements = document.querySelectorAll('.stat-value[data-count]');
        statElements.forEach(el => {
            const target = parseInt(el.dataset.count);
            Utils.animateCounter(el, target);
        });

        // Update dynamic stats
        const sectorStats = this.dataLoader.getSectorStats();
        const topSector = Utils.sortBy(sectorStats, 'avgMargin', true)[0];
        document.getElementById('topSectorGrowth').textContent = Utils.formatPercent(topSector.avgMargin);

        const undervalued = this.analyzer.findUndervalued();
        document.getElementById('undervaluedCount').textContent = undervalued.length;

        const overvalued = this.analyzer.findOvervalued();
        document.getElementById('overvaluedCount').textContent = overvalued.length;

        // Market pulse chart
        this.chartManager.createMarketPulseChart(this.dataLoader.companies);

        // 2026 Sector predictions
        this.render2026Predictions();

        // Top companies
        this.renderTopCompanies();
    }

    render2026Predictions() {
        const predictions = [
            {
                title: '🤖 AI & Technology',
                desc: '75% of companies investing in agentic AI. Semiconductor earnings growth at 26% annually. Strongest economic force for 2026.'
            },
            {
                title: '🛡️ Defense & Aerospace',
                desc: 'India\'s ₹6.81L Cr defense budget driven by geopolitical tensions. ₹4L Cr procurement pipeline over 5-7 years.'
            },
            {
                title: '⚡ Renewable Energy',
                desc: 'Sector projected to grow 25%. AI data centers driving unprecedented power demand across infrastructure.'
            }
        ];

        const container = document.getElementById('sectorPredictions');
        if (!container) return;

        container.innerHTML = predictions.map(p => `
            <div class="prediction-item">
                <div class="prediction-title">${p.title}</div>
                <div class="prediction-desc">${p.desc}</div>
            </div>
        `).join('');
    }

    renderTopCompanies() {
        const topCompanies = this.dataLoader.getTopByMarketCap(12);
        const container = document.getElementById('topCompanies');
        if (!container) return;

        container.innerHTML = topCompanies.map(company => {
            const latest = company.latest;
            const metrics = this.analyzer.calculateMetrics(company);
            const healthScore = this.analyzer.calculateHealthScore(company);
            const classification = this.mlEngine.classifyCompany(company);

            return `
                <div class="company-card" onclick="app.showCompanyDetails('${company.ticker}')">
                    <div class="company-header">
                        <div>
                            <div class="company-name">${company.company}</div>
                            <div class="company-sector">${company.sector}</div>
                        </div>
                        <div class="company-ticker">${company.ticker}</div>
                    </div>
                    <div class="company-metrics">
                        <div class="metric">
                            <span class="metric-label">Market Cap</span>
                            <span class="metric-value">${Utils.formatCurrency(latest.marketCap)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Profit Margin</span>
                            <span class="metric-value">${Utils.formatPercent(metrics.profitMargin)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Health Score</span>
                            <span class="metric-value">${healthScore.toFixed(0)}/100</span>
                        </div>
                    </div>
                    <span class="badge ${classification.category}">${classification.category.toUpperCase()}</span>
                </div>
            `;
        }).join('');
    }

    renderSectors() {
        const sectorStats = this.dataLoader.getSectorStats();
        const sectorPredictions = this.mlEngine.getSectorPredictions();

        this.chartManager.createSectorChart(sectorStats);
        this.chartManager.createMomentumChart(sectorPredictions);
    }

    renderStocks() {
        let filteredData = [...this.allAnalyzedData];

        // Apply category filter
        if (this.currentCategory !== 'all') {
            filteredData = filteredData.filter(company => {
                const classification = company.ml.classification.category;
                return classification === this.currentCategory;
            });
        }

        // Apply sector filter
        if (this.currentSector !== 'all') {
            filteredData = filteredData.filter(c => c.sector === this.currentSector);
        }

        // Apply risk filter
        if (this.currentRisk !== 'all') {
            filteredData = filteredData.filter(c => {
                const risk = this.analyzer.calculateRisk(c);
                return risk === this.currentRisk;
            });
        }

        // Apply search
        if (this.searchQuery) {
            filteredData = filteredData.filter(c => 
                c.company.toLowerCase().includes(this.searchQuery) ||
                c.ticker.toLowerCase().includes(this.searchQuery) ||
                c.sector.toLowerCase().includes(this.searchQuery)
            );
        }

        // Render
        const container = document.getElementById('stocksGrid');
        if (!container) return;

        if (filteredData.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No companies found matching filters.</p>';
            return;
        }

        container.innerHTML = filteredData.map(company => {
            const latest = company.years[company.years.length - 1];
            const metrics = this.analyzer.calculateMetrics(company);
            const risk = this.analyzer.calculateRisk(company);

            return `
                <div class="company-card" onclick="app.showCompanyDetails('${company.ticker}')">
                    <div class="company-header">
                        <div>
                            <div class="company-name">${company.company}</div>
                            <div class="company-sector">${company.sector}</div>
                        </div>
                        <div class="company-ticker">${company.ticker}</div>
                    </div>
                    <div class="company-metrics">
                        <div class="metric">
                            <span class="metric-label">Revenue</span>
                            <span class="metric-value">${Utils.formatCurrency(latest.revenue)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Net Profit</span>
                            <span class="metric-value">${Utils.formatCurrency(latest.netProfit)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">D/E Ratio</span>
                            <span class="metric-value">${metrics.debtToEquity.toFixed(2)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Health Score</span>
                            <span class="metric-value">${company.ml.healthScore.toFixed(0)}/100</span>
                        </div>
                    </div>
                    <span class="badge ${company.ml.classification.category}">${company.ml.classification.category.toUpperCase()}</span>
                    <span class="badge" style="background: ${risk === 'low' ? '#00FF88' : risk === 'medium' ? '#FFB020' : '#FF4560'}22; color: ${risk === 'low' ? '#00FF88' : risk === 'medium' ? '#FFB020' : '#FF4560'};">${risk.toUpperCase()} RISK</span>
                </div>
            `;
        }).join('');
    }

    renderAnalysis() {
        const riskReturnData = this.analyzer.getRiskReturnData();
        this.chartManager.createRiskReturnChart(riskReturnData);
        this.chartManager.createRevenueGrowthChart(this.dataLoader.companies);
        this.chartManager.createDebtEquityChart(this.dataLoader.companies);
    }

    showCompanyDetails(ticker) {
        const company = this.allAnalyzedData.find(c => c.ticker === ticker);
        if (!company) return;

        const latest = company.years[company.years.length - 1];
        const metrics = this.analyzer.calculateMetrics(company);
        const insights = company.ml.insights;

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <h2 style="color: var(--accent); margin-bottom: 1rem;">${company.company}</h2>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">${company.ticker} | ${company.sector}</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div style="background: var(--secondary); padding: 1rem; border-radius: 10px;">
                    <div style="color: var(--text-muted); font-size: 0.9rem;">Health Score</div>
                    <div style="color: var(--accent); font-size: 2rem; font-weight: 700;">${company.ml.healthScore.toFixed(0)}/100</div>
                </div>
                <div style="background: var(--secondary); padding: 1rem; border-radius: 10px;">
                    <div style="color: var(--text-muted); font-size: 0.9rem;">Undervaluation</div>
                    <div style="color: var(--success); font-size: 2rem; font-weight: 700;">${company.ml.undervalScore.toFixed(0)}/100</div>
                </div>
                <div style="background: var(--secondary); padding: 1rem; border-radius: 10px;">
                    <div style="color: var(--text-muted); font-size: 0.9rem;">Momentum</div>
                    <div style="color: var(--warning); font-size: 2rem; font-weight: 700;">${company.ml.momentum.toFixed(0)}/100</div>
                </div>
            </div>

            <h3 style="color: var(--accent); margin: 1.5rem 0 1rem;">Financial Metrics</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--glass-border);">
                    <span style="color: var(--text-muted);">Revenue</span>
                    <span style="font-weight: 600;">${Utils.formatCurrency(latest.revenue)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--glass-border);">
                    <span style="color: var(--text-muted);">Net Profit</span>
                    <span style="font-weight: 600;">${Utils.formatCurrency(latest.netProfit)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--glass-border);">
                    <span style="color: var(--text-muted);">Market Cap</span>
                    <span style="font-weight: 600;">${Utils.formatCurrency(latest.marketCap)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--glass-border);">
                    <span style="color: var(--text-muted);">Profit Margin</span>
                    <span style="font-weight: 600;">${Utils.formatPercent(metrics.profitMargin)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--glass-border);">
                    <span style="color: var(--text-muted);">ROE</span>
                    <span style="font-weight: 600;">${Utils.formatPercent(metrics.roe)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--glass-border);">
                    <span style="color: var(--text-muted);">Debt-to-Equity</span>
                    <span style="font-weight: 600;">${metrics.debtToEquity.toFixed(2)}</span>
                </div>
            </div>

            <h3 style="color: var(--accent); margin: 1.5rem 0 1rem;">AI Insights</h3>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${insights.map(insight => `
                    <div style="padding: 1rem; background: ${
                        insight.type === 'positive' ? 'rgba(0, 255, 136, 0.1)' :
                        insight.type === 'negative' ? 'rgba(255, 69, 96, 0.1)' :
                        'rgba(255, 176, 32, 0.1)'
                    }; border-left: 4px solid ${
                        insight.type === 'positive' ? '#00FF88' :
                        insight.type === 'negative' ? '#FF4560' :
                        '#FFB020'
                    }; border-radius: 5px;">
                        ${insight.text}
                    </div>
                `).join('')}
            </div>

            ${company.ml.predicted2026Revenue ? `
                <h3 style="color: var(--accent); margin: 1.5rem 0 1rem;">2026 Predictions</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div style="background: var(--secondary); padding: 1rem; border-radius: 10px;">
                        <div style="color: var(--text-muted); font-size: 0.9rem;">Predicted Revenue</div>
                        <div style="color: var(--accent); font-size: 1.5rem; font-weight: 700;">${Utils.formatCurrency(company.ml.predicted2026Revenue)}</div>
                    </div>
                    <div style="background: var(--secondary); padding: 1rem; border-radius: 10px;">
                        <div style="color: var(--text-muted); font-size: 0.9rem;">Predicted Profit</div>
                        <div style="color: var(--success); font-size: 1.5rem; font-weight: 700;">${Utils.formatCurrency(company.ml.predicted2026Profit)}</div>
                    </div>
                </div>
            ` : ''}
        `;

        document.getElementById('companyModal').classList.add('show');
    }
}

// Initialize app
const app = new App();
window.addEventListener('DOMContentLoaded', () => app.init());