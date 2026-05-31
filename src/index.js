const VERSION = "1.0.4";
const logTag = `[helloworldwidget_v${VERSION}]`;

import { Desktop } from "@wxcc-desktop/sdk";

class HelloWorldWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.desktop = null;
        this.sdkReady = false;
    }

    connectedCallback() {
        console.log(`${logTag} Widget connected`);
        this.render();
        this.initSDK();
        this.subscribeToAgentContactEvents();
    }

    disconnectedCallback() {
        Desktop.agentContact.removeAllEventListeners();
    }
    
    subscribeToAgentContactEvents () {
        // Listen to contact events
        Desktop.agentContact.addEventListener("eAgentContact", (event) => {
            console.log(`${logTag} Contact Event:`, event);
        });
    }

    async initSDK() {
        console.log(`${logTag} Initializing SDK...`);
        this.updateStatus('Initializing SDK...');

        try {
            // Initialize Desktop SDK (v2.0+ requires await and parameters)
            await Desktop.config.init('hello-world-widget', 'cduzpalau');
            
            this.desktop = Desktop;
            this.sdkReady = true;
            
            console.log(`${logTag} ✅ SDK Initialized Successfully`);

            // Make Desktop globally accessible for debugging
            window.Desktop = Desktop;
    
            this.updateStatus('SDK Ready');
            
        } catch (error) {
            console.error(`${logTag} ❌ SDK Initialization Error:`, error);
            this.updateStatus(`SDK Error: ${error.message}`);
        }
    }
    
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    padding: 20px;
                    box-sizing: border-box;
                    position: relative;
                }
                
                .version-tag {
                    position: absolute;
                    bottom: 10px;
                    right: 15px;
                    font-size: 10px;
                    color: #7f8c8d;
                    opacity: 0.7;
                }

                .card {
                    background: white;
                    padding: 40px;
                    border-radius: 16px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    text-align: center;
                    max-width: 500px;
                    width: 100%;
                    transition: transform 0.3s ease;
                }

                .card:hover {
                    transform: translateY(-5px);
                }
                
                h2 {
                    color: #2c3e50;
                    margin-bottom: 20px;
                }

                .button-group {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    justify-content: center;
                    margin-bottom: 20px;
                }

                button {
                    background: #049fd9;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    font-size: 14px;
                    font-weight: 600;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    outline: none;
                    box-shadow: 0 4px 6px rgba(4, 159, 217, 0.2);
                }

                button:hover {
                    background: #0386b8;
                    box-shadow: 0 6px 12px rgba(4, 159, 217, 0.3);
                }

                button.secondary {
                    background: #6c757d;
                    box-shadow: 0 4px 6px rgba(108, 117, 125, 0.2);
                }

                button.secondary:hover {
                    background: #5a6268;
                }

                button:active {
                    transform: scale(0.98);
                }

                #message {
                    margin-top: 10px;
                    font-size: 24px;
                    font-weight: bold;
                    color: #049fd9;
                    opacity: 0;
                    transform: scale(0.5);
                    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                #message.show {
                    opacity: 1;
                    transform: scale(1);
                }

                .status-msg {
                    margin-top: 15px;
                    font-size: 12px;
                    padding: 10px;
                    border-radius: 4px;
                    min-height: 20px;
                    word-break: break-word;
                    text-align: left;
                }

                .status-msg.info { color: #0c5460; background: #d1ecf1; }
                .status-msg.success { color: #155724; background: #d4edda; }
                .status-msg.error { color: #721c24; background: #f8d7da; }
            </style>
            
            <div class="card">
                <h2>WxCC Widget v${VERSION}</h2>
                <div class="button-group">
                    <button id="hello-btn">Hello Toggle</button>
                    <button id="available-btn" class="secondary">Go Available</button>
                </div>
                <div id="message">Hello World! 🌍</div>
                <div id="status-message" class="status-msg"></div>
            </div>
            <div class="version-tag">v${VERSION}</div>
        `;

        this.shadowRoot.getElementById('hello-btn').addEventListener('click', () => {
            const msg = this.shadowRoot.getElementById('message');
            msg.classList.toggle('show');
        });

        this.shadowRoot.getElementById('available-btn').addEventListener('click', async () => {
            const statusMsg = this.shadowRoot.getElementById('status-message');
            if (!this.sdkReady) {
                statusMsg.textContent = 'SDK not ready yet.';
                statusMsg.className = 'status-msg error';
                return;
            }

            try {
                console.group(`${logTag} State Change`);
                const currentData = Desktop.agentStateInfo.latestData;
                
                statusMsg.textContent = 'Setting state to Available...';
                statusMsg.className = 'status-msg info';
                
                // Payload includes auxCodeIdArray to clear sub-status
                const payload = {
                    state: "Available",
                    auxCodeIdArray: "0"
                };
                
                await Desktop.agentStateInfo.stateChange(payload);
                
                statusMsg.textContent = 'Successfully set to Available!';
                statusMsg.className = 'status-msg success';
                console.groupEnd();
                setTimeout(() => { statusMsg.textContent = ''; }, 3000);
            } catch (error) {
                console.error(`${logTag} State change failed:`, error);
                const errorDetail = error.data?.message || error.message || 'Unknown Error';
                statusMsg.textContent = `Error: ${errorDetail}`;
                statusMsg.className = 'status-msg error';
                console.groupEnd();
            }
        });
    }
    
    updateStatus(message) {
        const el = this.shadowRoot?.getElementById('status');
        if (el) {
            el.textContent = message;
            el.className = 'status';
            if (message.includes('Ready')) el.classList.add('ready');
            if (message.includes('Error')) el.classList.add('error');
        }
    }
    
    debugDesktop() {
        if (!this.desktop) {
            console.warn(`${logTag} Desktop SDK not initialized yet`);
            return;
        }

        console.group('🖥️ Desktop SDK Debug Info');
        console.log('Current State:', this.desktop.agentStateInfo.latestData);
        console.groupEnd();
    }
    
}

customElements.define('hello-world-widget', HelloWorldWidget);
console.log(`${logTag} Widget loaded`);
