// ============================================
// AI CHAT ASSISTANT - Gemini Integration
// ============================================

var FamilyOffice = FamilyOffice || {};

FamilyOffice.ChatAssistant = (function() {
    // Gemini API configuration - key stored in localStorage for security
    var GEMINI_API_KEY_STORAGE = 'dholakia_gemini_api_key';
    var GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    // Get API key from localStorage
    function getApiKey() {
        return localStorage.getItem(GEMINI_API_KEY_STORAGE) || '';
    }

    // Set API key in localStorage
    function setApiKey(key) {
        if (key && key.trim()) {
            localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
            return true;
        }
        return false;
    }

    // Check if API key is configured
    function hasApiKey() {
        return !!getApiKey();
    }

    // Chat state
    var isOpen = false;
    var messages = [];
    var isLoading = false;

    // System prompt with dashboard context
    function getSystemPrompt() {
        return `You are the Dholakia Ventures Portfolio Assistant - a helpful AI that answers questions about the family office investment portfolio.

## CRITICAL RULES:
1. You ONLY have access to the portfolio data provided below. DO NOT ask for external sources.
2. NEVER ask the user for company lists, stock prices, or external data - you already have all the data.
3. Answer questions DIRECTLY using the portfolio data provided in this message.
4. If asked about "top companies by value" or "best performers":
   - ONLY include companies that have verified valuation from follow-on rounds
   - Companies without follow-on rounds have no current valuation data - exclude them
   - Show the Current Value, MOIC (multiple), and invested amount
5. All monetary values are in Indian Rupees (₹). Display in Crores (Cr).

## Your Role:
- Answer questions about THIS portfolio using ONLY the data provided below
- Explain how calculations and formulas work
- Guide users on how to use the dashboard

## Key Formulas:

### Unrealized Value (for Active companies):
Latest Valuation × Current Ownership % / 100

### MOIC (Multiple on Invested Capital):
(Unrealized Value + Realized Value) / Total Invested

### IRR: Uses XIRR method with cash flows

## Response Style:
- Be concise and direct
- Use specific numbers from the portfolio data
- Format: ₹X.XX Cr for currency
- List company names with their values when asked about rankings`;
    }

    // Get portfolio context for the AI
    function getPortfolioContext() {
        // Get fresh references to modules
        var Data = FamilyOffice.Data;
        var Utils = FamilyOffice.Utils;

        if (!Data || !Utils) {
            console.error('[Chat Assistant] Data or Utils not available');
            return '## Portfolio data not available\nPlease refresh the page and try again.';
        }

        var companies = Data.getCompanies();
        console.log('[Chat Assistant] Got', companies.length, 'companies from Data');

        // Calculate summary stats
        var totalInvested = 0;
        var totalUnrealized = 0;
        var activeCount = 0;
        var exitedCount = 0;
        var writtenOffCount = 0;
        var sectors = {};
        var stages = {};

        companies.forEach(function(c) {
            totalInvested += c.totalInvested || c.initialInvestment || 0;

            if (c.status === 'Active') {
                activeCount++;
                var unrealized = Utils.getUnrealizedValue(c);
                totalUnrealized += unrealized;
            } else if (c.status === 'Exited') {
                exitedCount++;
            } else if (c.status === 'Written-off') {
                writtenOffCount++;
            }

            // Track sectors
            if (c.industry) {
                sectors[c.industry] = (sectors[c.industry] || 0) + 1;
            }

            // Track stages
            if (c.currentStage) {
                stages[c.currentStage] = (stages[c.currentStage] || 0) + 1;
            }
        });

        // Helper: check if company has follow-on with valuation data
        function hasValuationData(c) {
            return c.followOns && c.followOns.length > 0 &&
                   c.followOns.some(function(fo) { return fo.roundValuation > 0; });
        }

        // Helper: calculate total invested including follow-ons where we participated
        function calcTotalInvested(c) {
            var initial = c.initialInvestment || 0;
            var followOnInvested = (c.followOns || []).reduce(function(sum, f) {
                return sum + (f.didWeInvest ? (f.ourInvestment || f.amount || 0) : 0);
            }, 0);
            return initial + followOnInvested;
        }

        // Get companies WITH verified valuation (follow-on rounds with valuation)
        var companiesWithValuation = companies
            .filter(function(c) { return c.status === 'Active' && hasValuationData(c); })
            .map(function(c) {
                var invested = calcTotalInvested(c);
                var unrealized = Utils.getUnrealizedValue(c);
                var moic = invested > 0 ? (unrealized / invested) : 0;
                return {
                    name: c.name,
                    invested: invested,
                    unrealized: unrealized,
                    ownership: Utils.getCurrentOwnership(c),
                    valuation: Utils.getLatestValuation(c),
                    moic: moic,
                    hasUpround: unrealized > invested
                };
            })
            .sort(function(a, b) { return b.unrealized - a.unrealized; });

        // Get companies WITHOUT valuation data (no follow-ons or no valuation in follow-ons)
        var companiesWithoutValuation = companies
            .filter(function(c) { return c.status === 'Active' && !hasValuationData(c); })
            .map(function(c) {
                return {
                    name: c.name,
                    invested: calcTotalInvested(c)
                };
            });

        // Format for AI
        var context = `
## Current Portfolio Summary:
- Total Companies: ${companies.length}
- Active: ${activeCount} (${companiesWithValuation.length} with valuation data, ${companiesWithoutValuation.length} without)
- Exited: ${exitedCount}
- Written-off: ${writtenOffCount}
- Total Invested: ₹${(totalInvested / 10000000).toFixed(2)} Cr
- Total Unrealized Value: ₹${(totalUnrealized / 10000000).toFixed(2)} Cr
- Portfolio MOIC: ${totalInvested > 0 ? (totalUnrealized / totalInvested).toFixed(2) : 'N/A'}x

## Sector Distribution:
${Object.keys(sectors).map(function(s) { return '- ' + s + ': ' + sectors[s] + ' companies'; }).join('\n')}

## Stage Distribution:
${Object.keys(stages).map(function(s) { return '- ' + s + ': ' + stages[s] + ' companies'; }).join('\n')}

## Top Companies by Current Value (ONLY companies with verified valuation from follow-on rounds):
${companiesWithValuation.length > 0 ? companiesWithValuation.slice(0, 10).map(function(c, i) {
    return (i + 1) + '. ' + c.name + ' - Current Value: ₹' + (c.unrealized / 10000000).toFixed(2) + ' Cr | Invested: ₹' + (c.invested / 10000000).toFixed(2) + ' Cr | MOIC: ' + c.moic.toFixed(2) + 'x | Val: ₹' + (c.valuation / 10000000).toFixed(2) + ' Cr @ ' + c.ownership.toFixed(2) + '%';
}).join('\n') : 'No companies with valuation data from follow-on rounds.'}

## Companies WITHOUT valuation data (no follow-on rounds - cannot calculate current value):
${companiesWithoutValuation.length > 0 ? companiesWithoutValuation.map(function(c) {
    return '- ' + c.name + ' (Invested: ₹' + (c.invested / 10000000).toFixed(2) + ' Cr) - No upround yet';
}).join('\n') : 'All active companies have valuation data.'}

## All Companies (for reference):
${companies.map(function(c) {
    var hasVal = hasValuationData(c) ? '✓ Has valuation' : '✗ No valuation data';
    return '- ' + c.name + ' | ' + (c.industry || 'N/A') + ' | ' + c.status + ' | Invested: ₹' + (calcTotalInvested(c) / 10000000).toFixed(2) + ' Cr | ' + hasVal;
}).join('\n')}
`;
        return context;
    }

    // Send message to Gemini API
    function sendToGemini(userMessage) {
        return new Promise(function(resolve, reject) {
            var apiKey = getApiKey();
            if (!apiKey) {
                reject(new Error('API key not configured. Please add your Gemini API key in Settings.'));
                return;
            }

            var systemPrompt = getSystemPrompt();
            var portfolioContext = getPortfolioContext();

            // Build conversation history
            var conversationHistory = messages.map(function(m) {
                return {
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                };
            });

            // Always include full context with every message to ensure AI has the data
            var fullMessage = `${systemPrompt}\n\n${portfolioContext}\n\n---\nUser Question: ${userMessage}`;
            console.log('[Chat Assistant] Sending context with', portfolioContext.length, 'chars');

            var requestBody = {
                contents: conversationHistory.concat([{
                    role: 'user',
                    parts: [{ text: fullMessage }]
                }]),
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024
                }
            };

            fetch(GEMINI_API_URL + '?key=' + apiKey, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })
            .then(function(response) {
                if (!response.ok) {
                    return response.json().then(function(err) {
                        throw new Error(err.error?.message || 'API request failed');
                    });
                }
                return response.json();
            })
            .then(function(data) {
                if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                    var text = data.candidates[0].content.parts[0].text || '';
                    resolve(text);
                } else {
                    console.error('[Chat Assistant] Invalid API response:', data);
                    reject(new Error('Invalid response from AI. Please try again.'));
                }
            })
            .catch(function(error) {
                reject(error);
            });
        });
    }

    // Render chat widget
    function render() {
        var existingWidget = document.getElementById('chat-assistant-widget');
        if (existingWidget) {
            existingWidget.remove();
        }

        var widget = document.createElement('div');
        widget.id = 'chat-assistant-widget';
        widget.innerHTML = renderChatButton() + renderChatPanel();
        document.body.appendChild(widget);

        initEvents();

        if (isOpen) {
            document.getElementById('chat-panel').classList.add('open');
        }
    }

    function renderChatButton() {
        return '<button id="chat-toggle-btn" class="chat-toggle-btn" title="Ask AI Assistant">' +
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>' +
            '</svg>' +
            '</button>';
    }

    function renderChatPanel() {
        var messagesHtml = messages.map(function(m) {
            var roleClass = m.role === 'user' ? 'user-message' : 'assistant-message';
            return '<div class="chat-message ' + roleClass + '">' +
                '<div class="message-content">' + formatMessage(m.content) + '</div>' +
                '</div>';
        }).join('');

        if (messages.length === 0) {
            if (!hasApiKey()) {
                // Show setup instructions if no API key
                messagesHtml = '<div class="chat-welcome">' +
                    '<div class="welcome-icon">🔑</div>' +
                    '<h3>Setup Required</h3>' +
                    '<p>To use the AI assistant, please configure your Gemini API key in <strong>Settings</strong>.</p>' +
                    '<p style="margin-top: 12px; font-size: 13px; color: var(--color-text-muted);">Get your free API key from <a href="https://aistudio.google.com/apikey" target="_blank" style="color: #3b82f6;">Google AI Studio</a></p>' +
                    '</div>';
            } else {
                messagesHtml = '<div class="chat-welcome">' +
                    '<div class="welcome-icon">🤖</div>' +
                    '<h3>Dholakia Ventures Assistant</h3>' +
                    '<p>Ask me anything about your portfolio!</p>' +
                    '<div class="quick-questions">' +
                    '<button class="quick-question" data-question="What is my total invested amount?">Total invested?</button>' +
                    '<button class="quick-question" data-question="What are my top 5 companies by value?">Top 5 companies?</button>' +
                    '<button class="quick-question" data-question="How is IRR calculated?">How is IRR calculated?</button>' +
                    '<button class="quick-question" data-question="Show me sector breakdown">Sector breakdown</button>' +
                    '</div>' +
                    '</div>';
            }
        }

        return '<div id="chat-panel" class="chat-panel">' +
            '<div class="chat-header">' +
            '<div class="chat-header-title">' +
            '<span class="chat-icon">🤖</span>' +
            '<span>Portfolio Assistant</span>' +
            '</div>' +
            '<div class="chat-header-actions">' +
            '<button id="chat-clear-btn" class="chat-header-btn" title="Clear chat">🗑️</button>' +
            '<button id="chat-close-btn" class="chat-header-btn" title="Close">✕</button>' +
            '</div>' +
            '</div>' +
            '<div id="chat-messages" class="chat-messages">' + messagesHtml + '</div>' +
            '<div class="chat-input-container">' +
            '<input type="text" id="chat-input" class="chat-input" placeholder="Ask about your portfolio..." ' + (isLoading ? 'disabled' : '') + '>' +
            '<button id="chat-send-btn" class="chat-send-btn" ' + (isLoading ? 'disabled' : '') + '>' +
            (isLoading ? '<span class="loading-spinner"></span>' : '➤') +
            '</button>' +
            '</div>' +
            '</div>';
    }

    function formatMessage(content) {
        // Handle undefined or null content
        if (!content) return '';

        // Convert markdown-like formatting to HTML
        return String(content)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/^- (.*)/gm, '• $1');
    }

    function initEvents() {
        var toggleBtn = document.getElementById('chat-toggle-btn');
        var closeBtn = document.getElementById('chat-close-btn');
        var clearBtn = document.getElementById('chat-clear-btn');
        var sendBtn = document.getElementById('chat-send-btn');
        var input = document.getElementById('chat-input');
        var panel = document.getElementById('chat-panel');

        if (toggleBtn) {
            toggleBtn.onclick = function() {
                isOpen = !isOpen;
                panel.classList.toggle('open', isOpen);
                if (isOpen && input) {
                    input.focus();
                }
            };
        }

        if (closeBtn) {
            closeBtn.onclick = function() {
                isOpen = false;
                panel.classList.remove('open');
            };
        }

        if (clearBtn) {
            clearBtn.onclick = function() {
                messages = [];
                render();
                if (isOpen) {
                    document.getElementById('chat-panel').classList.add('open');
                }
            };
        }

        if (sendBtn) {
            sendBtn.onclick = sendMessage;
        }

        if (input) {
            input.onkeypress = function(e) {
                if (e.key === 'Enter' && !isLoading) {
                    sendMessage();
                }
            };
        }

        // Quick question buttons
        document.querySelectorAll('.quick-question').forEach(function(btn) {
            btn.onclick = function() {
                var question = btn.dataset.question;
                document.getElementById('chat-input').value = question;
                sendMessage();
            };
        });
    }

    function sendMessage() {
        var input = document.getElementById('chat-input');
        var userMessage = input.value.trim();

        if (!userMessage || isLoading) return;

        // Add user message
        messages.push({ role: 'user', content: userMessage });
        input.value = '';
        isLoading = true;
        render();
        document.getElementById('chat-panel').classList.add('open');
        scrollToBottom();

        // Send to AI
        sendToGemini(userMessage)
            .then(function(response) {
                messages.push({ role: 'assistant', content: response });
                isLoading = false;
                render();
                document.getElementById('chat-panel').classList.add('open');
                scrollToBottom();
            })
            .catch(function(error) {
                console.error('Chat error:', error);
                var errorMsg = error && error.message ? error.message : 'Unknown error occurred';
                messages.push({
                    role: 'assistant',
                    content: 'Sorry, I encountered an error: ' + errorMsg + '\n\nPlease try again or check if the API key is configured correctly in Settings.'
                });
                isLoading = false;
                render();
                document.getElementById('chat-panel').classList.add('open');
            });
    }

    function scrollToBottom() {
        var messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // Initialize on page load
    function init() {
        render();
    }

    return {
        init: init,
        render: render,
        setApiKey: setApiKey,
        hasApiKey: hasApiKey
    };
})();

// Auto-initialize when DOM is ready or immediately if already loaded
(function initChatAssistant() {
    function doInit() {
        if (FamilyOffice.ChatAssistant && FamilyOffice.Data) {
            FamilyOffice.ChatAssistant.init();
            console.log('[Chat Assistant] Initialized');
        } else {
            // Retry if modules not ready
            setTimeout(doInit, 100);
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        // DOM already loaded, init after a short delay
        setTimeout(doInit, 100);
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(doInit, 100);
        });
    }
})();
