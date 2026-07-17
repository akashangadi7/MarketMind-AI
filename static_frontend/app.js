// MarketMind AI Platform JS Engine
const API_BASE_HOST = window.location.host;
const API_BASE = '/api/v1';

// Global application state
const state = {
    token: localStorage.getItem('mm_token') || null,
    role: localStorage.getItem('mm_role') || null,
    email: localStorage.getItem('mm_email') || null,
    activeTab: 'dashboard',
    charts: {},
    watchlistPrices: {}
};

// ==========================================================================
// Core Utilities & Fetch Wrappers
// ==========================================================================

function showToast(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';
    if (type === 'warning') iconName = 'alert-circle';

    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    lucide.createIcons();

    // Auto-remove after 4.5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

// Global fetch wrapper with automatic headers, error notifications, and timeout
async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    // Set headers
    options.headers = options.headers || {};
    if (state.token) {
        options.headers['Authorization'] = `Bearer ${state.token}`;
    }
    
    if (options.body && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams)) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }

    // Timeout: 35s for file uploads, 15s for regular requests
    const isUpload = options.body instanceof FormData;
    const timeoutMs = isUpload ? 35000 : 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    options.signal = controller.signal;

    try {
        const response = await fetch(url, options);
        clearTimeout(timeoutId);
        
        // Handle 204 No Content
        if (response.status === 204) return null;
        
        const data = await response.json();
        
        if (!response.ok) {
            const errorMsg = data.detail || 'Request failed';
            // Auto logout on token expiration/invalid credentials
            if (response.status === 401 && state.token) {
                showToast('Session expired. Please log in again.', 'error');
                logout();
            } else {
                throw new Error(errorMsg);
            }
        }
        return data;
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            const msg = isUpload
                ? 'Chart analysis timed out. The AI service may be busy — showing simulated results.'
                : 'Request timed out. Please try again.';
            showToast(msg, 'warning');
            throw new Error(msg);
        }
        showToast(err.message, 'error');
        throw err;
    }
}


// Check if port 8000 is open by running a simple health fetch
async function checkBackendConnection() {
    const statusLabel = document.getElementById('api-status');
    try {
        const res = await fetch('/health');
        if (res.ok) {
            statusLabel.className = 'status-indicator connected';
            statusLabel.innerHTML = '<span class="status-dot"></span> API Connected';
        } else {
            throw new Error();
        }
    } catch (err) {
        statusLabel.className = 'status-indicator disconnected';
        statusLabel.innerHTML = '<span class="status-dot"></span> Offline';
    }
}

// ==========================================================================
// Authentication Logic
// ==========================================================================

function checkAuth() {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    if (state.token) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'flex';
        
        document.getElementById('user-email').textContent = state.email;
        document.getElementById('user-role').textContent = `${state.role} member`;
        
        // If admin, show Admin Panel link in sidebar
        const adminLinks = document.querySelectorAll('.admin-only');
        adminLinks.forEach(link => {
            link.style.display = state.role === 'admin' ? 'flex' : 'none';
        });

        // Load active view data
        checkBackendConnection();
        switchTab(state.activeTab);
    } else {
        authContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }
}

function logout() {
    state.token = null;
    state.role = null;
    state.email = null;
    localStorage.removeItem('mm_token');
    localStorage.removeItem('mm_role');
    localStorage.removeItem('mm_email');
    checkAuth();
}

// ==========================================================================
// Router / Navigation Switching
// ==========================================================================

function switchTab(tabId) {
    state.activeTab = tabId;
    
    // Toggle active classes in viewport
    const views = document.querySelectorAll('.tab-view');
    views.forEach(view => view.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');

    // Toggle active class in sidebar items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update Header title
    const titles = {
        dashboard: 'Dashboard Overview',
        analysis: 'AI Technical Chart Analyzer',
        calculator: 'Risk Management Calculator',
        portfolio: 'Portfolio Holdings & Performance',
        watchlist: 'Real-Time Market Watchlist',
        admin: 'Global Administration & Audit Console'
    };
    document.getElementById('active-tab-title').textContent = titles[tabId] || 'Dashboard';

    // Trigger tab specific loads
    if (tabId === 'dashboard') loadDashboard();
    if (tabId === 'analysis') loadAnalysisHistory();
    if (tabId === 'portfolio') loadPortfolio();
    if (tabId === 'watchlist') loadWatchlist();
    if (tabId === 'admin') loadAdminConsole();
}

// ==========================================================================
// TAB 1: Dashboard View Loads
// ==========================================================================

async function loadDashboard() {
    try {
        // Fetch dashboard components in parallel
        const [portfolioItems, watchlistItems, history] = await Promise.all([
            request('/portfolio'),
            request('/watchlist'),
            request('/analysis/history')
        ]);

        // 1. Calculate values
        let totalValue = 0;
        portfolioItems.forEach(item => {
            totalValue += item.current_value || (item.shares_quantity * item.average_buy_price);
        });
        document.getElementById('widget-portfolio-val').textContent = `$${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

        // 2. Set counts
        document.getElementById('widget-watchlist-count').textContent = watchlistItems.length;
        document.getElementById('widget-audit-count').textContent = history.length;

        // 3. Render watchlist mini panel
        const wPreview = document.getElementById('dashboard-watchlist-preview');
        wPreview.innerHTML = '';
        if (watchlistItems.length === 0) {
            wPreview.innerHTML = '<p class="text-muted text-center py-4">No assets watchlisted.</p>';
        } else {
            // Get watchlist live prices
            const prices = await request('/watchlist/prices').catch(() => ({}));
            watchlistItems.slice(0, 4).forEach(item => {
                const price = prices[item.symbol] || 100.0;
                const card = document.createElement('div');
                card.style.display = 'flex';
                card.style.justify = 'space-between';
                card.style.padding = '8px 12px';
                card.style.background = 'var(--bg-base)';
                card.style.borderRadius = 'var(--border-radius-sm)';
                card.innerHTML = `
                    <strong>${item.symbol}</strong>
                    <span style="font-family: monospace;">$${price.toFixed(2)}</span>
                `;
                wPreview.appendChild(card);
            });
        }

        // 4. Load recent table
        const tbody = document.querySelector('#dashboard-recent-table tbody');
        tbody.innerHTML = '';
        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No records found. Run an AI upload.</td></tr>';
        } else {
            history.slice(0, 5).forEach(record => {
                const res = record.analysis_result;
                const path = res.technical_observations?.trend_direction || 'Neutral';
                const color = path.toLowerCase() === 'bullish' ? 'text-green' : (path.toLowerCase() === 'bearish' ? 'text-red' : 'text-muted');
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${record.asset_symbol}</strong></td>
                    <td style="text-transform: capitalize;">${record.asset_type}</td>
                    <td>${res.confidence_score}%</td>
                    <td class="${color}"><strong>${path.toUpperCase()}</strong></td>
                    <td>${new Date(record.created_at).toLocaleDateString()}</td>
                `;
                tbody.appendChild(row);
            });
        }

        // 5. Draw Pie Chart
        renderDashboardPieChart(history);

    } catch (e) {
        console.error('Failed to load dashboard', e);
    }
}

function renderDashboardPieChart(history) {
    const canvas = document.getElementById('dashboard-pie-chart');
    if (!canvas) return;

    // Compile trend counts
    let bullish = 0, bearish = 0, sideways = 0;
    history.forEach(item => {
        const trend = item.analysis_result?.technical_observations?.trend_direction?.toLowerCase();
        if (trend === 'bullish') bullish++;
        else if (trend === 'bearish') bearish++;
        else sideways++;
    });

    if (history.length === 0) {
        bullish = 1; bearish = 1; sideways = 1; // Default placeholders
    }

    if (state.charts['dashboard-pie']) {
        state.charts['dashboard-pie'].destroy();
    }

    state.charts['dashboard-pie'] = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Bullish', 'Bearish', 'Sideways'],
            datasets: [{
                data: [bullish, bearish, sideways],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: document.body.classList.contains('dark-theme') ? '#9ca3af' : '#475569' }
                }
            }
        }
    });
}

// ==========================================================================
// TAB 2: Chart Upload & AI Analysis Logs History
// ==========================================================================

async function loadAnalysisHistory() {
    try {
        const history = await request('/analysis/history');
        const tbody = document.querySelector('#analysis-history-table tbody');
        tbody.innerHTML = '';
        
        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No records. Upload a chart to trigger Gemini.</td></tr>';
            return;
        }

        history.forEach(record => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${record.asset_symbol}</strong></td>
                <td style="text-transform: capitalize;">${record.asset_type}</td>
                <td>${record.analysis_result.confidence_score}%</td>
                <td>${new Date(record.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="secondary-btn btn-sm view-rpt-btn" data-id="${record.id}"><i data-lucide="eye" style="width:12px;height:12px;"></i> View</button>
                    <button class="secondary-btn btn-sm fav-rpt-btn" data-id="${record.id}">
                        <i data-lucide="star" style="width:12px;height:12px; ${record.is_favorite ? 'fill:#fbbf24;color:#fbbf24' : ''}"></i>
                    </button>
                    <button class="secondary-btn btn-sm del-rpt-btn text-rose" data-id="${record.id}"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        lucide.createIcons();

        // Wire up buttons
        document.querySelectorAll('.view-rpt-btn').forEach(btn => {
            btn.addEventListener('click', () => showReport(btn.getAttribute('data-id'), history));
        });
        document.querySelectorAll('.fav-rpt-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleFavorite(btn.getAttribute('data-id')));
        });
        document.querySelectorAll('.del-rpt-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteReport(btn.getAttribute('data-id')));
        });

    } catch (e) {
        console.error(e);
    }
}

async function toggleFavorite(id) {
    await request(`/analysis/${id}/favorite`, { method: 'PUT' });
    showToast('Analysis favorite state toggled.', 'success');
    loadAnalysisHistory();
}

async function deleteReport(id) {
    if (confirm('Are you sure you want to delete this analysis record?')) {
        await request(`/analysis/${id}`, { method: 'DELETE' });
        showToast('Record deleted.', 'success');
        document.getElementById('analysis-report-viewer').style.display = 'none';
        loadAnalysisHistory();
    }
}

function showReport(id, history) {
    const record = history.find(r => r.id == id);
    if (!record) return;
    
    const panel = document.getElementById('analysis-report-viewer');
    panel.style.display = 'block';
    
    // Fill fields
    document.getElementById('report-title').textContent = `Analysis Report: ${record.asset_symbol}`;
    document.getElementById('report-meta').textContent = `Analyzed on: ${new Date(record.created_at).toLocaleString()} | Type: ${record.asset_type.toUpperCase()}`;
    
    const imagePath = record.chart_image_path ? record.chart_image_path : '';
    document.getElementById('report-img').src = imagePath;
    
    const res = record.analysis_result;
    document.getElementById('report-confidence').textContent = `${res.confidence_score}%`;
    
    const trend = res.technical_observations?.trend_direction || 'Neutral';
    const trendEl = document.getElementById('report-trend');
    trendEl.textContent = trend.toUpperCase();
    trendEl.className = trend.toLowerCase() === 'bullish' ? 'text-green' : (trend.toLowerCase() === 'bearish' ? 'text-red' : 'text-muted');
    
    document.getElementById('report-summary').textContent = res.executive_summary || 'N/A';
    
    // Technical parameters
    document.getElementById('report-candles').textContent = res.technical_observations?.candlestick_patterns?.join(', ') || 'None';
    document.getElementById('report-patterns').textContent = res.technical_observations?.chart_patterns?.join(', ') || 'None';
    document.getElementById('report-momentum').textContent = res.technical_observations?.momentum || 'Neutral';
    document.getElementById('report-volatility').textContent = res.technical_observations?.volatility || 'Moderate';
    
    // Support Resistance levels lists
    const supports = document.getElementById('report-supports');
    supports.innerHTML = '';
    (res.support_resistance?.support_levels || []).forEach(val => {
        supports.innerHTML += `<li>$${val}</li>`;
    });
    
    const resistances = document.getElementById('report-resistances');
    resistances.innerHTML = '';
    (res.support_resistance?.resistance_levels || []).forEach(val => {
        resistances.innerHTML += `<li>$${val}</li>`;
    });
    
    // Scenarios
    const bullish = res.probability_analysis?.bullish || 0;
    const bearish = res.probability_analysis?.bearish || 0;
    const sideways = res.probability_analysis?.sideways || 0;
    
    document.getElementById('prob-bullish').textContent = `${bullish}%`;
    document.getElementById('prob-bullish-fill').style.width = `${bullish}%`;
    
    document.getElementById('prob-bearish').textContent = `${bearish}%`;
    document.getElementById('prob-bearish-fill').style.width = `${bearish}%`;
    
    document.getElementById('prob-sideways').textContent = `${sideways}%`;
    document.getElementById('prob-sideways-fill').style.width = `${sideways}%`;
    
    document.getElementById('report-risk-assessment').innerHTML = `
        <strong>Market Triggers:</strong> ${res.opportunity_risk?.opportunities?.join('; ') || 'None'}<br><br>
        <strong>Risk Factors:</strong> ${res.opportunity_risk?.risk_factors?.join('; ') || 'None'}<br><br>
        <strong>Guidelines:</strong> ${res.opportunity_risk?.suggested_risk_management || 'N/A'}
    `;
    
    document.getElementById('report-educational').textContent = res.educational_explanation || 'No educational context provided.';
    
    // Wire download buttons
    document.getElementById('export-csv-btn').onclick = () => {
        window.open(`/api/v1/analysis/${record.id}/export/csv?token=${state.token}`, '_blank');
    };
    document.getElementById('export-pdf-btn').onclick = () => {
        window.open(`/api/v1/analysis/${record.id}/export/pdf?token=${state.token}`, '_blank');
    };

    // Scroll details card into viewport view
    panel.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================================================
// TAB 3: Risk Sizing Calculator
// ==========================================================================

function initCalculator() {
    const calcBtn = document.getElementById('calc-calculate-btn');
    if (!calcBtn) return;
    
    calcBtn.addEventListener('click', async () => {
        const capital = parseFloat(document.getElementById('calc-balance').value);
        const riskPct = parseFloat(document.getElementById('calc-risk-pct').value);
        const entry = parseFloat(document.getElementById('calc-entry').value);
        const stop = parseFloat(document.getElementById('calc-stop').value);
        const target = parseFloat(document.getElementById('calc-target').value);
        
        if (isNaN(capital) || isNaN(riskPct) || isNaN(entry) || isNaN(stop) || isNaN(target)) {
            showToast('Please enter valid numeric values.', 'warning');
            return;
        }

        try {
            // Hit FastAPI calculator
            const res = await request('/calculator', {
                method: 'POST',
                body: {
                    available_capital: capital,
                    entry_price: entry,
                    stop_loss: stop,
                    target_price: target,
                    max_risk_pct: riskPct
                }
            });

            // Show results
            document.getElementById('calc-results-box').style.display = 'block';
            document.getElementById('calc-res-shares').textContent = `${res.position_size} shares`;
            document.getElementById('calc-res-cost').textContent = `$${(res.position_size * entry).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            document.getElementById('calc-res-risk-amt').textContent = `$${res.max_loss.toFixed(2)}`;
            document.getElementById('calc-res-rrr').textContent = `1 : ${res.risk_reward_ratio}`;
            document.getElementById('calc-res-profit').textContent = `$${res.expected_profit.toFixed(2)}`;
            
            const stopLossDist = (Math.abs(entry - stop) / entry * 100).toFixed(2);
            document.getElementById('calc-res-stop-dist').textContent = `${stopLossDist}%`;
            
            // Render advisory guidance card
            const advisory = document.getElementById('calc-advisory');
            const advisoryText = document.getElementById('calc-advisory-text');
            if (res.risk_reward_ratio >= 2.0) {
                advisory.className = 'calc-advisory-card green-bg';
                advisoryText.textContent = `Excellent setup! Trade fits professional risk standards with a 1:${res.risk_reward_ratio} payout ratio. Stop loss requires ${stopLossDist}% price wiggle room.`;
            } else {
                advisory.className = 'calc-advisory-card red-bg';
                advisoryText.textContent = `Caution: Trade has a subpar risk-reward ratio of 1:${res.risk_reward_ratio} (Target recommendation is 1:2.0 or higher). Re-evaluate target or stop spacing.`;
            }
            
        } catch (e) {
            console.error(e);
        }
    });
}

// ==========================================================================
// TAB 4: Portfolio Holdings Manager
// ==========================================================================

async function loadPortfolio() {
    try {
        const holdings = await request('/portfolio');
        const tbody = document.querySelector('#portfolio-table tbody');
        tbody.innerHTML = '';
        
        let totalVal = 0;
        
        if (holdings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No holdings added to portfolio.</td></tr>';
            document.getElementById('portfolio-total-val').textContent = '$0.00';
            return;
        }

        holdings.forEach(asset => {
            const currentVal = asset.current_value || (asset.shares_quantity * asset.average_buy_price);
            totalVal += currentVal;
            
            const pl = asset.profit_loss || 0;
            const plPct = asset.profit_loss_pct || 0;
            const plColor = pl >= 0 ? 'text-green' : 'text-red';
            const plSign = pl >= 0 ? '+' : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${asset.symbol}</strong></td>
                <td>${asset.shares_quantity}</td>
                <td>$${asset.average_buy_price.toFixed(2)}</td>
                <td>$${(asset.current_price || asset.average_buy_price).toFixed(2)}</td>
                <td><strong>$${currentVal.toFixed(2)}</strong></td>
                <td class="${plColor}"><strong>${plSign}$${pl.toFixed(2)} (${plSign}${plPct.toFixed(2)}%)</strong></td>
                <td>
                    <button class="secondary-btn btn-sm sell-asset-btn text-rose" data-symbol="${asset.symbol}" data-qty="${asset.shares_quantity}" data-price="${asset.current_price || asset.average_buy_price}">
                        <i data-lucide="minus-circle" style="width:12px;height:12px;"></i> Sell
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('portfolio-total-val').textContent = `$${totalVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        lucide.createIcons();

        // Wire sell buttons
        document.querySelectorAll('.sell-asset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const sym = btn.getAttribute('data-symbol');
                const maxQty = parseFloat(btn.getAttribute('data-qty'));
                const curPrice = parseFloat(btn.getAttribute('data-price'));
                
                const qtyStr = prompt(`Enter quantity of ${sym} to sell (Max: ${maxQty}):`, maxQty);
                if (qtyStr === null) return;
                const qty = parseFloat(qtyStr);
                
                if (isNaN(qty) || qty <= 0 || qty > maxQty) {
                    showToast('Invalid sell quantity.', 'warning');
                    return;
                }
                
                recordTransaction(sym, 'SELL', qty, curPrice);
            });
        });

    } catch (e) {
        console.error(e);
    }
}

async function recordTransaction(symbol, type, quantity, price) {
    try {
        await request('/portfolio/transaction', {
            method: 'POST',
            body: { symbol, type, quantity, price }
        });
        showToast(`Successfully registered ${type} transaction for ${symbol}.`, 'success');
        loadPortfolio();
    } catch (e) {
        console.error(e);
    }
}

// ==========================================================================
// TAB 5: Market Watchlist
// ==========================================================================

async function loadWatchlist() {
    try {
        const items = await request('/watchlist');
        const grid = document.getElementById('watchlist-grid');
        grid.innerHTML = '';
        
        if (items.length === 0) {
            grid.innerHTML = '<div class="card w-100 text-center py-5"><p class="text-muted">No symbols added to watchlist yet. Add one above.</p></div>';
            return;
        }

        // Fetch live prices for watched symbols from backend
        const prices = await request('/watchlist/prices').catch(() => ({}));

        items.forEach(item => {
            const price = prices[item.symbol] || 100.0;
            // Generate a random daily fluctuation percentage for mock styling if not yfinance real-time
            const changePct = (Math.random() * 4 - 2); // -2% to +2%
            const changeClass = changePct >= 0 ? 'positive' : 'negative';
            const changeSign = changePct >= 0 ? '+' : '';

            const card = document.createElement('div');
            card.className = 'watchlist-card';
            card.innerHTML = `
                <div class="watchlist-header">
                    <div>
                        <span class="watchlist-sym">${item.symbol}</span>
                        <span class="text-muted block text-xs" style="text-transform: capitalize;">${item.asset_type}</span>
                    </div>
                    <button class="icon-btn delete-btn remove-watch-btn" data-id="${item.id}" title="Remove from Watchlist">
                        <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                    </button>
                </div>
                <div class="watchlist-metrics">
                    <span class="watchlist-price">$${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span class="watchlist-pct ${changeClass}">${changeSign}${changePct.toFixed(2)}%</span>
                </div>
                <div class="watchlist-indicator-row">
                    <span>Note: ${item.notes || 'No custom alerts'}</span>
                </div>
            `;
            grid.appendChild(card);
        });

        lucide.createIcons();

        // Wire remove buttons
        document.querySelectorAll('.remove-watch-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (confirm('Remove symbol from watchlist?')) {
                    await request(`/watchlist/${id}`, { method: 'DELETE' });
                    showToast('Watchlist item removed.', 'success');
                    loadWatchlist();
                }
            });
        });

    } catch (e) {
        console.error(e);
    }
}

// ==========================================================================
// TAB 6: Admin Dashboard Panel
// ==========================================================================

async function loadAdminConsole() {
    try {
        const stats = await request('/admin/stats');
        const logs = await request('/admin/logs');

        // Fill statistics
        document.getElementById('admin-users-count').textContent = stats.total_users;
        document.getElementById('admin-uploads-count').textContent = stats.total_analyses;
        document.getElementById('admin-logs-count').textContent = logs.length;

        // Render system audit table
        const tbody = document.querySelector('#admin-audit-table tbody');
        tbody.innerHTML = '';
        
        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No audit logs found.</td></tr>';
            return;
        }

        logs.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${log.id}</td>
                <td>${log.email || 'System / Guest'} (ID: ${log.user_id || 'N/A'})</td>
                <td><code style="background:var(--border-color);padding:2px 6px;border-radius:4px;">${log.action}</code></td>
                <td>${new Date(log.timestamp).toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (e) {
        console.error(e);
    }
}

// ==========================================================================
// App Initialization & Form Hooks
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initCalculator();

    // Check backend health status periodically
    setInterval(checkBackendConnection, 10000);

    // Sidebar navigation clicks
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Theme Toggle switch
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.addEventListener('click', () => {
        const body = document.body;
        const icon = document.getElementById('theme-icon');
        
        if (body.classList.contains('dark-theme')) {
            body.classList.replace('dark-theme', 'light-theme');
            icon.setAttribute('data-lucide', 'moon');
        } else {
            body.classList.replace('light-theme', 'dark-theme');
            icon.setAttribute('data-lucide', 'sun');
        }
        lucide.createIcons();
        
        // Re-render pie chart to update label colors
        if (state.activeTab === 'dashboard') {
            loadDashboard();
        }
    });

    // Auth Screen: Form tab toggles
    document.getElementById('go-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form-box').style.display = 'none';
        document.getElementById('register-form-box').style.display = 'block';
        document.getElementById('auth-subtitle').textContent = 'Create Enterprise Account';
    });

    document.getElementById('go-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form-box').style.display = 'block';
        document.getElementById('register-form-box').style.display = 'none';
        document.getElementById('auth-subtitle').textContent = 'Enterprise Technical Intelligence Platform';
    });

    // Sign Out Hook
    document.getElementById('signout-btn').addEventListener('click', () => {
        logout();
        showToast('Successfully signed out.', 'info');
    });

    // Close Report viewer Card
    document.getElementById('close-report-btn').addEventListener('click', () => {
        document.getElementById('analysis-report-viewer').style.display = 'none';
    });

    // ---------------------------------------------------------
    // Submit Hooks
    // ---------------------------------------------------------

    // Form Submit: Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // FastAPI standard oauth2_scheme expectations: UrlEncoded Form parameters!
        const bodyParams = new URLSearchParams();
        bodyParams.append('username', email);
        bodyParams.append('password', password);

        try {
            const data = await request('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: bodyParams
            });

            state.token = data.access_token;
            state.role = data.role;
            state.email = data.email;
            localStorage.setItem('mm_token', data.access_token);
            localStorage.setItem('mm_role', data.role);
            localStorage.setItem('mm_email', data.email);

            showToast('Sign in authorized successfully.', 'success');
            checkAuth();
        } catch (err) {
            console.error(err);
        }
    });

    // Form Submit: Register
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const role = document.getElementById('register-role').value;

        try {
            await request('/auth/register', {
                method: 'POST',
                body: { email, password, role }
            });

            showToast('Registration successful! Please login.', 'success');
            document.getElementById('go-to-login').click();
        } catch (err) {
            console.error(err);
        }
    });

    // Form Submit: Portfolio Asset Add
    document.getElementById('portfolio-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const symbol = document.getElementById('portfolio-symbol').value.trim().toUpperCase();
        const type = document.getElementById('portfolio-type').value;
        const qty = parseFloat(document.getElementById('portfolio-quantity').value);
        const price = parseFloat(document.getElementById('portfolio-buy-price').value);

        await recordTransaction(symbol, 'BUY', qty, price);
        document.getElementById('portfolio-form').reset();
    });

    // Form Submit: Watchlist Asset Add
    document.getElementById('watchlist-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const symbol = document.getElementById('watchlist-symbol').value.trim().toUpperCase();
        
        // Auto classify symbol as stock or crypto
        const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE'];
        const isCrypto = cryptoSymbols.includes(symbol) || symbol.endsWith('USDT') || symbol.endsWith('USD');
        const asset_type = isCrypto ? 'crypto' : 'stock';

        try {
            await request('/watchlist', {
                method: 'POST',
                body: { symbol, asset_type, notes: 'Added via watchlist widget' }
            });
            showToast(`${symbol} added to watchlist.`, 'success');
            document.getElementById('watchlist-form').reset();
            loadWatchlist();
        } catch (err) {
            console.error(err);
        }
    });

    // File Selector Dropzone interactions
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('chart-file-input');
    const fileSelectedLabel = document.getElementById('file-selected-name');

    dropzone.addEventListener('click', () => fileInput.click());
    
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            updateFileName();
        }
    });

    fileInput.addEventListener('change', updateFileName);

    function updateFileName() {
        if (fileInput.files.length) {
            fileSelectedLabel.style.display = 'block';
            fileSelectedLabel.textContent = `Selected: ${fileInput.files[0].name}`;
        } else {
            fileSelectedLabel.style.display = 'none';
        }
    }

    // Form Submit: Chart Analysis Upload & Trigger
    document.getElementById('chart-upload-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const symbol = document.getElementById('upload-symbol').value.trim().toUpperCase();
        const type = document.getElementById('upload-type').value;
        const file = fileInput.files[0];

        if (!file) {
            showToast('Please select a chart image screenshot to upload.', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('asset_symbol', symbol);
        formData.append('asset_type', type);

        showToast('Uploading chart and triggering Gemini AI vision indicator scan. Please hold...', 'info');
        
        const submitBtn = document.getElementById('upload-submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="logo-icon animate-pulse" data-lucide="loader-2"></i> Scanning Chart...';
        lucide.createIcons();

        try {
            const data = await request('/analysis/upload', {
                method: 'POST',
                body: formData
            });

            showToast('AI technical observer scan completed successfully.', 'success');
            document.getElementById('chart-upload-form').reset();
            fileSelectedLabel.style.display = 'none';
            
            // Reload logs and load this specific report view card
            await loadAnalysisHistory();
            showReport(data.id, [data]);
        } catch (err) {
            console.error(err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="brain"></i> Trigger AI Analysis';
            lucide.createIcons();
        }
    });
});
