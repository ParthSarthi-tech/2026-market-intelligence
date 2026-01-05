// ========================================
// Utility Functions
// ========================================

const Utils = {
    // Format numbers to Indian currency (Crores)
    formatCurrency: (num) => {
        if (num === null || num === undefined) return '₹0 Cr';
        return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
    },

    // Format percentage
    formatPercent: (num) => {
        if (num === null || num === undefined) return '0%';
        return `${num.toFixed(2)}%`;
    },

    // Format large numbers
    formatNumber: (num) => {
        if (num === null || num === undefined) return '0';
        return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    },

    // Animate counter
    animateCounter: (element, target, duration = 1000) => {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = Math.round(target);
                clearInterval(timer);
            } else {
                element.textContent = Math.round(current);
            }
        }, 16);
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Get color based on value (for charts)
    getColorByValue: (value, thresholds = { low: 30, medium: 70 }) => {
        if (value < thresholds.low) return '#FF4560';
        if (value < thresholds.medium) return '#FFB020';
        return '#00FF88';
    },

    // Sort array by property
    sortBy: (arr, prop, desc = true) => {
        return arr.sort((a, b) => {
            const aVal = a[prop] || 0;
            const bVal = b[prop] || 0;
            return desc ? bVal - aVal : aVal - bVal;
        });
    },

    // Group by property
    groupBy: (arr, prop) => {
        return arr.reduce((acc, item) => {
            const key = item[prop];
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});
    },

    // Calculate average
    average: (arr) => {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    },

    // Get unique values
    unique: (arr) => [...new Set(arr)],

    // Clamp value between min and max
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),

    // Generate random color
    randomColor: () => {
        const colors = ['#00D9FF', '#00FF88', '#FFB020', '#FF4560', '#8B5CF6', '#EC4899'];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    // Show notification
    notify: (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'error' ? '#FF4560' : '#00FF88'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    },

    // Calculate growth rate
    growthRate: (oldVal, newVal) => {
        if (!oldVal || oldVal === 0) return 0;
        return ((newVal - oldVal) / oldVal) * 100;
    },

    // Safe division
    safeDivide: (a, b) => {
        if (!b || b === 0) return 0;
        return a / b;
    },

    // Check if value is valid number
    isValidNumber: (val) => {
        return typeof val === 'number' && !isNaN(val) && isFinite(val);
    }
};

// Make Utils available globally
window.Utils = Utils;