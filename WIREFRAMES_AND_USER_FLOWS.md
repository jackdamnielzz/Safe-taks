# SafeWork Pro - Detailed Wireframes and User Flows

## Complete User Journey Documentation for Next.js + Firebase Implementation

### Primary User Flow 1: TRA Creation Journey (Desktop)

**Flow: Safety Manager Creates New TRA**
```
Step 1: Dashboard → Step 2: Template Selection → Step 3: Task Breakdown → 
Step 4: Risk Assessment → Step 5: Control Measures → Step 6: Review & Submit
```

#### 1.1 Dashboard Landing Page
```
┌─────────────────────────────────────────────────────────────────────┐
│ [🏗️] SafeWork Pro - Building Safer Workplaces    [🔔3] [👤John ▼]  │
├─────────────────────────────────────────────────────────────────────┤
│ [📊 Dashboard] [📋 TRAs] [📱 Mobile] [📈 Reports] [👥 Team] [⚙️]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Good morning, John! Here's your safety overview for today:          │
│                                                                     │
│ ┌─── Today's Priorities ──────┐  ┌─── Safety Metrics ─────────────┐  │
│ │ 🔴 2 TRAs need approval     │  │ 📊 Active TRAs: 47            │  │
│ │ 🟡 5 LMRAs overdue         │  │ ⚠️ High Risk: 8               │  │
│ │ 🟢 12 completed today      │  │ ✅ Completed: 156             │  │
│ │ [View All →]               │  │ 📈 Trend: ↗️ 12% improvement   │  │
│ └────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                     │
│ ┌─── Recent Activity ───────────────────────────────────────────────┐ │
│ │ [👤] Sarah Johnson completed LMRA for "Roof Maintenance"    2m ago│ │
│ │ [📋] Mike Stevens created TRA "Electrical Panel Upgrade"   15m ago│ │
│ │ [✅] TRA #789 approved by Lisa Brown                       1h ago │ │
│ │ [⚠️] High risk alert: "Confined Space Entry" - Site B     2h ago │ │
│ │ [📊] Weekly safety report generated                        3h ago │ │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ ┌─── Quick Actions ─────────────────────────────────────────────────┐ │
│ │ [➕ Create New TRA] [📱 Open Mobile App] [📊 Generate Report]    │ │
│ │ [👥 Manage Team]    [📅 Schedule Review]  [🔍 Search TRAs]       │ │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ ┌─── Risk Trend Analysis ──────────────────────────────────────────┐  │
│ │ [📈 Interactive Chart: 6 Month Risk Score Trends]               │  │
│ │ Filter: [All Projects ▼] [All Risk Types ▼] [Last 6 months ▼]   │  │
│ └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

#### 1.2 TRA Creation - Template Selection
```
┌─────────────────────────────────────────────────────────────────────┐
│ Create New TRA                                            [✖️ Close] │
├─────────────────────────────────────────────────────────────────────┤
│ Step 1 of 6: Choose Your Starting Point                             │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 20% Complete        │
│                                                                     │
│ 📋 TRA Details                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ Title: [Electrical Panel Upgrade - Building A_____________]     │  │
│ │ Project: [Building A Renovation                           ▼]     │  │
│ │ Description: [Upgrade main electrical panel to 400A capacity]   │  │
│ │             [with new safety systems and monitoring...]         │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ 📝 Select Template (Recommended based on your project)              │
│ ┌─── VCA Compliant Templates ─────────────────────────────────────┐  │
│ │ ┌─ 🔌 Electrical Work - Construction ────────────────────────┐   │  │
│ │ │ ✅ VCA certified │ 📊 Used 47 times │ ⭐ 4.8/5 rating    │   │  │
│ │ │ Pre-loaded with common electrical hazards and controls   │   │  │
│ │ │ [📄 Preview] [📊 Risk Examples] [✅ Select This Template] │   │  │
│ │ └──────────────────────────────────────────────────────────┘   │  │
│ │                                                                 │  │
│ │ ┌─ ⚡ High Voltage Work - Industrial ────────────────────────┐   │  │
│ │ │ ✅ VCA certified │ 📊 Used 23 times │ ⭐ 4.6/5 rating    │   │  │
│ │ │ Specialized for >1000V electrical systems              │   │  │
│ │ │ [📄 Preview] [📊 Risk Examples] [○ Select This Template] │   │  │
│ │ └──────────────────────────────────────────────────────────┘   │  │
│ │                                                                 │  │
│ │ ┌─ 📝 Custom Template - Start from Scratch ─────────────────┐   │  │
│ │ │ Build your own TRA with our guided wizard               │   │  │
│ │ │ [○ Start Custom TRA]                                    │   │  │
│ │ └──────────────────────────────────────────────────────────┘   │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ 📅 Validity Period                                                  │
│ From: [📅 Oct 26, 2024] Until: [📅 Apr 26, 2025] (6 months)        │
│                                                                     │
│ [Auto-saved ✓ 3 seconds ago]             [Cancel] [Continue →]     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 1.3 TRA Creation - Task Breakdown with Real-time Collaboration
```
┌─────────────────────────────────────────────────────────────────────┐
│ Create New TRA - Electrical Panel Upgrade                [✖️ Close] │
├─────────────────────────────────────────────────────────────────────┤
│ Step 2 of 6: Break Down the Work into Steps                         │
│ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 40% Complete        │
│                                                                     │
│ 👥 Collaborating with: [Sarah●] [Mike●] [Lisa○]          [+ Invite] │
│                                                                     │
│ 🛠️ Task Steps                                         [+ Add Step]   │
│ ┌─ Step 1 ──────────────────────────────────────────────────────────┐ │
│ │ 🔌 Electrical isolation and LOTO procedures             [✏️][🗑️] │ │
│ │ Description: Isolate main electrical feed, apply lockout/tagout │ │ │
│ │ Duration: [45 min] Personnel: [Licensed electrician + helper]  │ │ │
│ │ Location: [Main electrical room - Basement]                   │ │ │
│ │ 💬 Sarah: "Don't forget arc flash PPE!" (2 min ago)           │ │ │
│ │    Mike: "Confirmed - 40 cal suit required" (1 min ago)       │ │ │
│ └────────────────────────────────────────────────────────────────┘  │ │
│                                                                     │
│ ┌─ Step 2 ──────────────────────────────────────────────────────────┐ │
│ │ ⚡ Remove existing panel and components                   [✏️][🗑️] │ │
│ │ Description: Carefully remove old 200A panel and components    │ │ │
│ │ Duration: [90 min] Personnel: [2 licensed electricians]        │ │ │
│ │ Equipment: [Crane, safety harness, insulated tools]           │ │ │
│ │ 🔄 Lisa is editing this step...                               │ │ │
│ └────────────────────────────────────────────────────────────────┘  │ │
│                                                                     │
│ ┌─ Step 3 ──────────────────────────────────────────────────────────┐ │
│ │ 🏗️ Install new 400A panel and connections               [✏️][🗑️] │ │
│ │ [Click to add description...]                                  │ │ │
│ └────────────────────────────────────────────────────────────────┘  │ │
│                                                                     │
│ 💡 Template Suggestions Based on Your Steps:                        │
│ [+ Add: "Test all connections"] [+ Add: "Commission new systems"]   │
│                                                                     │
│ [Auto-saved ✓ just now]                  [← Previous] [Continue →] │
└─────────────────────────────────────────────────────────────────────┘
```

#### 1.4 Risk Assessment with Kinney & Wiruth Calculator
```
┌─────────────────────────────────────────────────────────────────────┐
│ Create New TRA - Risk Assessment                         [✖️ Close] │
├─────────────────────────────────────────────────────────────────────┤
│ Step 3 of 6: Identify Hazards and Assess Risks                      │
│ ████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░ 60% Complete        │
│                                                                     │
│ 🔌 Step 1: Electrical isolation and LOTO procedures                 │
│                                                                     │
│ ⚠️ Identified Hazards                                    [+ Add Hazard] │
│ ┌─ Hazard 1 ────────────────────────────────────────────────────────┐ │
│ │ ⚡ Electrical shock from live conductors                          │ │
│ │ Category: [Electrical ▼]  Source: [Template Library ✓]           │ │
│ │                                                                   │ │
│ │ 📊 Kinney & Wiruth Risk Assessment                                │ │
│ │ ┌─ Effect (E) ─────────┐ ┌─ Exposure (B) ──────┐ ┌─ Probability ─┐ │ │
│ │ │ Score: [15▼]        │ │ Score: [6▼]         │ │ Score: [6▼]    │ │ │
│ │ │ Very serious injury │ │ Daily exposure      │ │ Quite possible │ │ │
│ │ │ or fatality         │ │ (1-8 hours/day)     │ │ (1:10 to 1:3)  │ │ │
│ │ └─────────────────────┘ └─────────────────────┘ └─────────────────┘ │ │
│ │                                                                   │ │
│ │ 🎯 Risk Score: 540 | Risk Level: 🔴 VERY HIGH                     │ │
│ │ ⚠️ Immediate action required - work cannot proceed safely         │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─ Hazard 2 ────────────────────────────────────────────────────────┐ │
│ │ 🔥 Arc flash during switching operations                          │ │
│ │ Category: [Electrical ▼]  Source: [Manual Entry]                 │ │
│ │                                                                   │ │
│ │ 📊 Risk Assessment                                                │ │
│ │ Effect: [12▼] | Exposure: [3▼] | Probability: [4▼]               │ │
│ │ 🎯 Risk Score: 144 | Risk Level: 🟡 SUBSTANTIAL                   │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 📈 Step Risk Summary: Highest Risk = 540 (Very High)                │
│ ⚠️ This step requires additional control measures before proceeding  │
│                                                                     │
│ [← Previous] [Continue to Control Measures →]                       │
└─────────────────────────────────────────────────────────────────────┘
```

#### 1.5 Control Measures with AI Recommendations
```
┌─────────────────────────────────────────────────────────────────────┐
│ Create New TRA - Control Measures                       [✖️ Close] │
├─────────────────────────────────────────────────────────────────────┤
│ Step 4 of 6: Define Control Measures                                │
│ ████████████████████████████████░░░░░░░░░░░░░░░░ 80% Complete        │
│                                                                     │
│ ⚡ Hazard: Electrical shock from live conductors (Risk: 540 - Very High) │
│                                                                     │
│ 🛡️ Recommended Control Measures (Hierarchy of Controls)             │
│ ┌─ 1. Elimination ──────────────────────────────────────────────────┐ │
│ │ ✅ Complete electrical isolation at main breaker                 │ │
│ │ Responsible: [John Smith - Lead Electrician ▼]                   │ │
│ │ Deadline: [Before work starts] Status: [Mandatory ✓]            │ │
│ │ Verification: [Visual confirmation + voltage testing]            │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─ 2. Engineering Controls ─────────────────────────────────────────┐ │
│ │ ✅ LOTO (Lockout/Tagout) procedures with personal locks          │ │
│ │ ✅ Insulated tools and equipment                                  │ │
│ │ ✅ Ground fault circuit interrupter (GFCI) protection            │ │
│ │ Responsible: [John Smith ▼] Deadline: [Before work starts]       │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─ 3. Administrative Controls ──────────────────────────────────────┐ │
│ │ ✅ Electrical safety training verification                        │ │
│ │ ✅ Work permit and supervisor approval                            │ │
│ │ ✅ Emergency response procedures briefing                         │ │
│ │ [+ Add Control Measure]                                           │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─ 4. Personal Protective Equipment ────────────────────────────────┐ │
│ │ ✅ Arc flash suit (40 cal/cm²)                                    │ │
│ │ ✅ Insulated gloves rated for voltage                             │ │
│ │ ✅ Safety glasses with side shields                               │ │
│ │ ✅ Hard hat with face shield                                      │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 🎯 Residual Risk After Controls: 45 (🟢 Low - Acceptable)           │
│                                                                     │
│ [← Previous] [Continue to Review →]                                 │
└─────────────────────────────────────────────────────────────────────┘
```

#### 1.6 TRA Review and Approval Workflow
```
┌─────────────────────────────────────────────────────────────────────┐
│ Create New TRA - Final Review                           [✖️ Close] │
├─────────────────────────────────────────────────────────────────────┤
│ Step 5 of 6: Review and Submit for Approval                         │
│ ████████████████████████████████████████░░░░░░░░ 90% Complete        │
│                                                                     │
│ 📋 TRA Summary                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ Title: Electrical Panel Upgrade - Building A                   │  │
│ │ Project: Building A Renovation                                  │  │
│ │ Valid: Oct 26, 2024 - Apr 26, 2025                             │  │
│ │ Created by: John Smith                                          │  │
│ │                                                                 │  │
│ │ 📊 Overall Risk Assessment                                       │  │
│ │ • Total Steps: 4                                               │  │
│ │ • Hazards Identified: 8                                        │  │
│ │ │ │ • Highest Risk: 540 (Very High) → 45 (Low) after controls  │  │
│ │ • Control Measures: 15                                         │  │
│ │ • Overall TRA Risk Level: 🟢 ACCEPTABLE                        │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ 👥 Approval Workflow                                                │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ Step 1: Technical Review                                        │  │
│ │ ✅ Sarah Johnson (Senior Electrician) [Auto-assigned]           │  │
│ │                                                                 │  │
│ │ Step 2: Safety Manager Approval                                 │  │
│ │ ⏳ Mike Stevens (Safety Manager) [Auto-assigned]                │  │
│ │                                                                 │  │
│ │ Step 3: Project Manager Sign-off                                │  │
│ │ ⏳ Lisa Brown (Project Manager) [Auto-assigned]                 │  │
│ │                                                                 │  │
│ │ ⏱️ Estimated approval time: 2-3 business days                   │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ 📧 Notifications will be sent to all approvers                      │
│ 🔔 You'll receive updates on approval progress                      │
│                                                                     │
│ [← Previous] [Save as Draft] [📤 Submit for Approval]              │
└─────────────────────────────────────────────────────────────────────┘
```

### Primary User Flow 2: Mobile LMRA Execution (PWA)

**Flow: Field Worker Performs Pre-task Safety Check**
```
Step 1: Login → Step 2: Select TRA → Step 3: Location Verification → 
Step 4: Environmental Checks → Step 5: Team Verification → Step 6: Final Assessment
```

#### 2.1 Mobile Login with Biometric
```
┌─────────────────────────────────────┐
│          SafeWork Pro              │
│     Building Safer Workplaces      │
├─────────────────────────────────────┤
│                                     │
│        [🏗️ Large App Icon]          │
│                                     │
│ Welcome back!                       │
│                                     │
│ ┌─ Quick Login ─────────────────────┐ │
│ │                                   │ │
│ │ [👤] john.smith@company.com       │ │
│ │                                   │ │
│ │ [🔐 Use Fingerprint to Login]     │ │
│ │                                   │ │
│ │         [Scan Fingerprint]        │ │
│ │                                   │ │
│ │ Or enter your PIN:                │ │
│ │ [⚪⚪⚪⚪⚪⚪]                      │ │
│ │                                   │ │
│ │ [Forgot PIN?]                     │ │
│ └───────────────────────────────────┘ │
│                                     │
│ 🌐 Status: Online ✓                 │
│ 📍 Location Services: Enabled ✓     │
│ 📷 Camera Access: Enabled ✓         │
│                                     │
│ [Need Help?] [Company Support]      │
└─────────────────────────────────────┘
```

#### 2.2 Available TRAs for LMRA Execution
```
┌─────────────────────────────────────┐
│ SafeWork Pro              [🔔] [⚙️] │
│ 👤 John Smith - Electrician         │
├─────────────────────────────────────┤
│ 📍 Current Location                 │
│ Building A - Electrical Room        │
│ [📍 Verify Location]                │
├─────────────────────────────────────┤
│                                     │
│ 📋 Available TRAs for Today          │
│                                     │
│ ┌─ TRA #123 ─────────────────────────┐ │
│ │ ⚡ Electrical Panel Upgrade       │ │
│ │ 🏗️ Building A Renovation          │ │
│ │ ⏰ Scheduled: 9:00 AM - 12:00 PM   │ │
│ │ 👥 Team: John, Sarah (2/2 ready)   │ │
│ │ 🎯 Risk Level: 🟢 Acceptable       │ │
│ │ [🚀 Start LMRA]                   │ │
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ TRA #124 ─────────────────────────┐ │
│ │ 🔧 Emergency Lighting Repair      │ │
│ │ 🏗️ Building B - 3rd Floor         │ │
│ │ ⏰ Scheduled: 2:00 PM - 4:00 PM    │ │
│ │ 👥 Team: John, Mike (1/2 ready)    │ │
│ │ 🎯 Risk Level: 🟡 Moderate         │ │
│ │ [⏰ Starts in 4h 30m]             │ │
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ TRA #125 ─────────────────────────┐ │
│ │ 🚨 Urgent: Fire Alarm Repair      │ │
│ │ 🏗️ Building C - Main Lobby        │ │
│ │ ⏰ Scheduled: ASAP                 │ │
│ │ 👥 Team: John only                 │ │
│ │ 🎯 Risk Level: 🔴 High             │ │
│ │ [🚨 Emergency LMRA]               │ │
│ └───────────────────────────────────┘ │
│                                     │
│ [🔍 Search TRAs] [📅 Schedule]      │
└─────────────────────────────────────┘
```

#### 2.3 LMRA Execution - Environmental Checks
```
┌─────────────────────────────────────┐
│ LMRA #123 - Step 1 of 5       [📱] │
│ ⚡ Electrical Panel Upgrade          │
├─────────────────────────────────────┤
│ 🌍 Environmental Assessment         │
│                                     │
│ 📍 Location Verification             │
│ ┌─────────────────────────────────┐ │
│ │ Required: Building A - Elec Room │ │
│ │ Current: Building A - Elec Room  │ │
│ │ ✅ Location Confirmed            │ │
│ │ Accuracy: ±2m GPS               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🌤️ Weather Conditions               │
│ ┌─────────────────────────────────┐ │
│ │ Temperature: 18°C ✅            │ │
│ │ Humidity: 45% ✅                │ │
│ │ Wind: 5 km/h ✅                 │ │
│ │ Visibility: Clear ✅            │ │
│ │ [🔄 Auto-detected via API]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🔬 Environmental Hazards            │
│ ┌─────────────────────────────────┐ │
│ │ ☐ Gas levels check required     │ │
│ │ ☐ Noise level assessment        │ │
│ │ ☑️ Lighting adequate             │ │
│ │ ☑️ Ventilation sufficient        │ │
│ │ ☐ Confined space protocols      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚠️ 2 checks remaining               │
│                                     │
│ [← Back] [Skip for Now] [Continue →] │
└─────────────────────────────────────┘
```

#### 2.4 LMRA - Team and Equipment Verification
```
┌─────────────────────────────────────┐
│ LMRA #123 - Step 3 of 5       [📱] │
│ 👥 Team & Equipment Verification    │
├─────────────────────────────────────┤
│                                     │
│ 👨‍🔧 Team Member Verification        │
│ ┌─ John Smith (You) ─────────────────┐ │
│ │ ✅ Licensed Electrician           │ │
│ │ ✅ Arc flash training current     │ │
│ │ ✅ Company safety certified       │ │
│ │ ✅ Medical clearance valid        │ │
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ Sarah Johnson ────────────────────┐ │
│ │ ✅ Electrician Apprentice         │ │
│ │ ✅ Safety training current        │ │
│ │ ❓ Waiting for check-in...        │ │
│ │ [📞 Call Sarah] [📱 Send Reminder] │ │
│ └───────────────────────────────────┘ │
│                                     │
│ 🛠️ Required Equipment Check         │
│ ┌─────────────────────────────────┐ │
│ │ ☑️ Arc flash suit (40 cal)       │ │
│ │ ☑️ Insulated gloves (class 2)    │ │
│ │ ☑️ Voltage tester                │ │
│ │ ☑️ Personal lockout kit          │ │
│ │ ☐ First aid kit                 │ │
│ │ ☐ Emergency communication       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📷 [Take Equipment Photo]           │
│ 📋 [Scan QR Codes]                  │
│                                     │
│ ⚠️ Waiting for Sarah's confirmation │
│                                     │
│ [← Previous] [Continue →]          │
└─────────────────────────────────────┘
```

#### 2.5 LMRA Final Assessment with Photo Documentation
```
┌─────────────────────────────────────┐
│ LMRA #123 - Step 5 of 5       [📱] │
│ ✅ Final Safety Assessment           │
├─────────────────────────────────────┤
│                                     │
│ 🎯 Overall Safety Assessment         │
│                                     │
│ ┌─ Assessment Summary ───────────────┐ │
│ │ ✅ All environmental checks OK    │ │
│ │ ✅ Team competency verified       │ │
│ │ ✅ Equipment inspection complete  │ │
│ │ ✅ Risk controls in place         │ │
│ │ ✅ Emergency procedures briefed   │ │
│ └───────────────────────────────────┘ │
│                                     │
│ 📷 Safety Documentation             │
│ ┌─ Photos Captured ─────────────────┐ │
│ │ [📷 Work area setup]              │ │
│ │ [📷 PPE verification]             │ │
│ │ [📷 Equipment layout]             │ │
│ │ [+ Add Photo]                     │ │
│ └───────────────────────────────────┘ │
│                                     │
│ 💬 Additional Comments              │
│ ┌─────────────────────────────────┐ │
│ │ Weather conditions ideal for     │ │
│ │ outdoor work. Sarah confirmed    │ │
│ │ all safety protocols. Ready to   │ │
│ │ proceed with electrical isolation │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🚦 Final Decision                    │
│ ┌─────────────────────────────────┐ │
│ │ ○ 🔴 STOP WORK - Unsafe         │ │
│ │ ○ 🟡 PROCEED WITH CAUTION       │ │
│ │ ● 🟢 SAFE TO PROCEED            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [📤 Submit LMRA] [📞 Call Supervisor] │
└─────────────────────────────────────┘
```

### User Flow 3: Real-time Collaboration (Multi-user)

#### 3.1 Collaborative TRA Editing (Desktop)
```
┌─────────────────────────────────────────────────────────────────────┐
│ TRA #123 - Electrical Panel Upgrade (Editing)           [✖️ Close] │
├─────────────────────────────────────────────────────────────────────┤
│ 👥 Live Collaboration: [John●] [Sarah●] [Mike○] [Lisa○]           │
│ Last saved: Auto-saved just now ✓                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 📝 Step 2: Remove existing panel and components                     │
│                                                                     │
│ 📝 Description                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ Carefully remove old 200A panel and components using proper    │  │
│ │ lifting techniques and safety equipment. [Sarah is typing...]   │  │
│ │ ▌                                                               │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ ⚠️ Hazards (2 identified)                              [+ Add Hazard] │
│ ┌─ Heavy lifting injury ────────────────────────────────────────────┐ │
│ │ 💬 Mike commented 2 min ago:                                     │ │
│ │ "Should we add mechanical lifting aid requirement?"              │ │
│ │ ┌─ Your reply ──────────────────────────────────────────────────┐ │ │
│ │ │ [Good point! I'll add a hoist requirement________________]   │ │ │
│ │ └────────────────────────────────────────────────────────────────┘ │ │
│ │ [💬 Reply] [👍 Like] [📝 Edit Hazard]                           │ │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ ┌─ Electrical components handling ──────────────────────────────────┐ │
│ │ Risk Score: 240 (🟡 Substantial)                                 │ │
│ │ ✅ Sarah approved the control measures                            │ │
│ │ [View Details]                                                   │ │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ 🔔 Notifications:                                                   │
│ • Mike added a new control measure (30s ago)                       │
│ • Sarah approved hazard assessment (2m ago)                        │
│                                                                     │
│ [💾 Save Changes] [👥 Share] [🔄 Sync Status]                      │
└─────────────────────────────────────────────────────────────────────┘
```

### User Flow 4: Analytics and Reporting Dashboard

#### 4.1 Executive Safety Dashboard
```
┌─────────────────────────────────────────────────────────────────────┐
│ 📊 Executive Safety Dashboard - October 2024            [⬇️ Export] │
├─────────────────────────────────────────────────────────────────────┤
│ [📈 Overview] [🎯 KPIs] [📊 Trends] [🔍 Details] [⚙️ Settings]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─── Key Safety Indicators ─────────────────────────────────────────┐ │
│ │ ┌─ TRAs ────────┐ ┌─ LMRAs ─────┐ ┌─ Risk Score ──┐ ┌─ Incidents ─┐ │ │
│ │ │ 📋 Active: 47 │ │ ✅ Today: 23│ │ 📊 Avg: 65   │ │ 🚨 Month: 1 │ │ │
│ │ │ ⏳ Pending: 8 │ │ ⏰ Late: 3  │ │ 📈 Trend: ↓  │ │ 📈 YoY: -40%│ │ │
│ │ │ ✅ Month: 156 │ │ 🎯 Rate: 94%│ │ 🎯 Target: <70│ │ 🎯 Goal: 0  │ │ │
│ │ └───────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ ┌─── Risk Distribution by Project ──────────────────────────────────┐  │
│ │ [📊 Horizontal Bar Chart]                                         │  │
│ │ Building A Renovation    ████████████████▓▓▓▓▓░░░  (65% Complete) │  │
│ │ Building B Maintenance   ████████████▓▓▓▓▓▓▓▓▓░░  (45% Complete) │  │
│ │ Parking Garage Repair    ████████▓▓▓▓▓▓▓▓▓▓▓▓░░  (30% Complete) │  │
│ │ Emergency Systems        ██████████████████████  (85% Complete) │  │
│ │                                                                   │  │
│ │ Legend: ████ Low Risk  ▓▓▓▓ Medium Risk  ░░░░ High Risk           │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ ┌─── Monthly Trend Analysis ───────┐ ┌─── Top Risk Categories ────────┐ │
│ │ [📈 Line Chart]                 │ │ [🍩 Donut Chart]              │ │
│ │ Risk Score Trends (6 months)     │ │ 🔌 Electrical: 35%            │ │
│ │ ✓ Steady improvement             │ │ 🏗️ Working at Height: 25%     │ │
│ │ Target line: 70                  │ │ 🔥 Fire/Explosion: 20%        │ │
│ │ Current: 65 (✅ Below target)    │ │ 🚧 Mechanical: 15%            │ │
│ │                                 │ │ 🧪 Chemical: 5%               │ │
│ └─────────────────────────────────┘ └─────────────────────────────────┘ │
│                                                                     │
│ ┌─── Action Items ─────────────────────────────────────────────────┐  │
│ │ 🔴 URGENT: TRA #125 requires immediate safety manager review     │  │
│ │ 🟡 5 LMRAs overdue - automatic supervisor notifications sent     │  │
│ │ 🟢 Compliance audit scheduled for next week - 94% ready          │  │
│ │ 💡 Suggestion: Schedule safety training for new team members     │  │
│ └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### User Flow 5: Multi-tenant Organization Management

#### 5.1 Organization Setup and User Management
```
┌─────────────────────────────────────────────────────────────────────┐
│ ⚙️ Organization Settings - ABC Construction Ltd     [Save Changes] │
├─────────────────────────────────────────────────────────────────────┤
│ [🏢 General] [👥 Users] [🔐 Security] [💳 Billing] [🔌 Integrations] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 🏢 Organization Information                                         │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ Company Name: [ABC Construction Ltd_________________________]    │  │
│ │ Industry: [Construction & Engineering                      ▼]    │  │
│ │ Company Size: [50-200 employees                           ▼]    │  │
│ │ Address: [123 Industrial Way, Amsterdam, Netherlands______]      │  │
│ │ Contact: [info@abcconstruction.nl________________________]      │  │
│ │ Phone: [+31 20 123 4567__________________________________]      │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ 🛡️ Safety Compliance Settings                                       │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ Primary Framework: [☑️ VCA] [☑️ ISO 45001] [☐ OSHA] [☐ Custom]   │  │
│ │ TRA Validity Period: [6 months ▼] (VCA standard)               │  │
│ │ Risk Acceptance Threshold: [70 points ▼] (Substantial level)    │  │
│ │ Approval Requirements: [2 approvers ▼] minimum                 │  │
│ │ Digital Signatures: [☑️ Required for all approvals]             │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ 🎨 Branding & Customization                                         │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ Company Logo: [📁 Upload Logo] [Current: ABC_logo.png]          │  │
│ │ Primary Color: [🎨 #1E40AF] Brand Blue                         │  │
│ │ Report Template: [🏢 Corporate] [🔧 Industrial] [📋 Simple]     │  │
│ │ Email Signature: [Include company branding ☑️]                  │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ [Reset to Defaults] [Save Changes] [Preview Settings]               │
└─────────────────────────────────────────────────────────────────────┘
```

#### 5.2 User Management with Role-Based Access
```
┌─────────────────────────────────────────────────────────────────────┐
│ 👥 User Management - ABC Construction Ltd              [+ Add User] │
├─────────────────────────────────────────────────────────────────────┤
│ [🔍 Search users...] [Filter: All Roles ▼] [Sort: Name ▼] [📊 Export] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─ John Smith ───────────────────────────────────────────────────────┐ │
│ │ 👤 john.smith@abcconstruction.nl          🟢 Active              │ │
│ │ 🎖️ Safety Manager | 📅 Joined: Jan 2024 | 🔑 Last Login: 2h ago  │ │
│ │                                                                   │ │
│ │ Permissions: Create TRA ✅ | Approve TRA ✅ | Admin Access ✅      │ │
│ │ Projects: All Projects (Global Access)                           │ │
│ │ Certifications: VCA Safety Manager, NEBOSH General Certificate   │ │
│ │                                                                   │ │
│ │ [✏️ Edit] [🔐 Reset Password] [📧 Send Invite] [❌ Deactivate]   │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─ Sarah Johnson ────────────────────────────────────────────────────┐ │
│ │ 👤 sarah.johnson@abcconstruction.nl       🟢 Active              │ │
│ │ 🔧 Senior Electrician | 📅 Joined: Mar 2024 | 🔑 Last Login: 30m │ │
│ │                                                                   │ │
│ │ Permissions: Create TRA ✅ | Review TRA ✅ | Admin Access ❌       │ │
│ │ Projects: Building A, Emergency Systems                          │ │
│ │ Certifications: Licensed Electrician, Arc Flash Training         │ │
│ │                                                                   │ │
│ │ [✏️ Edit] [📱 Mobile Access ✅] [🏗️ Add Projects] [📋 View TRAs] │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─ Mike Stevens ─────────────────────────────────────────────────────┐ │
│ │ 👤 mike.stevens@abcconstruction.nl        🟡 Pending Approval    │ │
│ │ 👷 Field Worker | 📅 Invited: Today | 🔑 Never logged in         │ │
│ │                                                                   │ │
│ │ Permissions: Execute LMRA ✅ | View TRA ✅ | Create TRA ❌         │ │
│ │ Projects: Parking Garage Repair                                  │ │
│ │ Certifications: Pending verification                             │ │
│ │                                                                   │ │
│ │ [📧 Resend Invite] [✏️ Edit Role] [❌ Cancel Invitation]         │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 📊 Team Statistics: 12 Users | 8 Active | 2 Pending | 2 Inactive   │
└─────────────────────────────────────────────────────────────────────┘
```

### User Flow 6: Professional Reporting System

#### 6.1 Custom Report Builder
```
┌─────────────────────────────────────────────────────────────────────┐
│ 📊 Safety Report Builder                               [💾 Save Template] │
├─────────────────────────────────────────────────────────────────────┤
│ [📋 Quick Reports] [🎨 Custom Builder] [📅 Scheduled] [📁 Templates] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 📝 Report Configuration                                              │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ Report Title: [Monthly Safety Performance Report_______________]  │  │
│ │ Period: [📅 Sep 1, 2024] to [📅 Sep 30, 2024]                  │  │
│ │ Projects: [☑️ All] [☐ Building A] [☐ Building B] [☐ Emergency]   │  │
│ │ Format: [📄 PDF] [📊 Excel] [📧 Email] [🔗 Shareable Link]       │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ 📊 Report Sections (Drag to reorder)                                │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ ☑️ [≡] Executive Summary with key metrics                       │  │
│ │ ☑️ [≡] TRA completion statistics and trends                     │  │
│ │ ☑️ [≡] Risk assessment distribution analysis                    │  │
│ │ ☑️ [≡] LMRA execution rates and timing                          │  │
│ │ ☑️ [≡] Incident correlation with TRA compliance                 │  │
│ │ ☑️ [≡] Control measure effectiveness analysis                   │  │
│ │ ☑️ [≡] Compliance status (VCA, ISO 45001)                       │  │
│ │ ☐ [≡] Individual TRA details (full data)                       │  │
│ │ ☑️ [≡] Recommendations and action items                         │  │
│ │ ☑️ [≡] Team performance and training needs                      │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ 🎨 Customization Options                                            │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ Include Charts: [☑️ Risk trends] [☑️ Project comparison]         │  │
│ │ Branding: [☑️ Company logo] [☑️ Custom colors]                   │  │
│ │ Audience: [📋 Board of Directors ▼]                             │  │
│ │ Confidentiality: [🔒 Internal Use Only ▼]                       │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ [👁️ Preview Report] [📧 Schedule Email] [🔗 Generate Now]           │
└─────────────────────────────────────────────────────────────────────┘
```

### User Flow 7: Mobile Offline Synchronization

#### 7.1 Offline Mode Indicator and Data Sync
```
┌─────────────────────────────────────┐
│ SafeWork Pro              [🔔] [⚙️] │
│ 👤 John Smith                       │
├─────────────────────────────────────┤
│ 🌐 Status: Offline Mode            │
│ 📱 Local Data: 5 TRAs, 12 LMRAs     │
│ 🔄 Last Sync: 2 hours ago           │
├─────────────────────────────────────┤
│                                     │
│ ⚠️ Working Offline                  │
│ Your data will sync automatically   │
│ when connection returns.            │
│                                     │
│ 📋 Available Offline TRAs:          │
│                                     │
│ ┌─ TRA #123 ─────────────────────────┐ │
│ │ ⚡ Electrical Panel Upgrade       │ │
│ │ 📱 Downloaded ✓ Ready for LMRA   │ │
│ │ 🔄 Status: Local changes pending  │ │
│ │ [🚀 Start LMRA]                   │ │
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ TRA #124 ─────────────────────────┐ │
│ │ 🔧 Emergency Lighting Repair      │ │
│ │ 📱 Downloaded ✓ Ready for LMRA   │ │
│ │ 🔄 Status: Synchronized           │ │
│ │ [🚀 Start LMRA]                   │ │
│ └───────────────────────────────────┘ │
│                                     │
│ 🔄 Sync Queue (3 items pending):    │
│ • LMRA #456 completion              │
│ • Photo uploads (5 images)          │
│ • Risk assessment update            │
│                                     │
│ [🔄 Manual Sync] [📶 Check Connection] │
└─────────────────────────────────────┘

Connection Restored:
┌─────────────────────────────────────┐
│ 🌐 Connected! Syncing data...       │
│ ████████████████████████████░ 95%   │
│                                     │
│ ✅ LMRA completions synced          │
│ ✅ Photos uploaded                  │
│ ✅ Risk assessments updated         │
│ 🔄 Downloading new TRAs...          │
│                                     │
│ [View Sync Log] [Continue Working]  │
└─────────────────────────────────────┘
```

### Design Principles for Next.js Implementation

#### Mobile-First Responsive Breakpoints
```css
/* Tailwind CSS Responsive Design Strategy */
/* Mobile First - Base styles */
.tra-card {
  @apply p-4 mb-4 bg-white rounded-lg shadow;
}

/* Tablet - sm: 640px */
@screen sm {
  .tra-card {
    @apply p-6 grid grid-cols-2 gap-4;
  }
}

/* Desktop - lg: 1024px */
@screen lg {
  .tra-card {
    @apply p-8 grid-cols-3 max-w-6xl mx-auto;
  }
}

/* Large Desktop - xl: 1280px */
@screen xl {
  .tra-card {
    @apply grid-cols-4;
  }
}
```

#### Component Architecture for Reusability
```
📁 src/
├── 📁 components/
│   ├── 📁 ui/ (Reusable UI components)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── RiskBadge.tsx
│   ├── 📁 tra/ (TRA-specific components)
│   │   ├── TRAWizard.tsx
│   │   ├── RiskCalculator.tsx
│   │   ├── HazardSelector.tsx
│   │   └── ControlMeasures.tsx
│   ├── 📁 lmra/ (LMRA-specific components)
│   │   ├── LMRAChecklist.tsx
│   │   ├── EnvironmentalCheck.tsx
│   │   ├── TeamVerification.tsx
│   │   └── PhotoCapture.tsx
│   └── 📁 layout/ (Layout components)
│       ├── Header.tsx
│       ├── Navigation.tsx
│       ├── Sidebar.tsx
│       └── MobileMenu.tsx
├── 📁 pages/ (Next.js pages)
│   ├── index.tsx (Dashboard)
│   ├── tras/
│   │   ├── index.tsx (TRA List)
│   │   ├── create.tsx (TRA Creation)
│   │   └── [id].tsx (TRA Detail)
│   ├── mobile/
│   │   ├── index.tsx (Mobile Dashboard)
│   │   └── lmra/[id].tsx (LMRA Execution)
│   └── api/ (API Routes)
│       ├── tras/
│       ├── lmra/
│       └── auth/
└── 📁 lib/ (Utilities and Firebase config)
    ├── firebase.ts
    ├── auth.ts
    ├── validation.ts
    └── calculations.ts
```

### Accessibility and User Experience Considerations

#### WCAG 2.1 AA Compliance Implementation
```html
<!-- Example: Accessible Risk Score Display -->
<div 
  className="risk-badge risk-high"
  role="alert"
  aria-label="High risk level with score 240"
  tabIndex="0"
>
  <span className="sr-only">Risk Level:</span>
  <span className="risk-score" aria-label="Risk score 240 out of 1500">240</span>
  <span className="risk-level" aria-label="High risk classification">High Risk</span>
</div>

<!-- Example: Accessible Form with Clear Labels -->
<form className="tra-form" aria-labelledby="tra-form-title">
  <h2 id="tra-form-title">Task Risk Assessment Form</h2>
  
  <div className="form-group">
    <label htmlFor="tra-title" className="form-label required">
      TRA Title
      <span aria-label="Required field">*</span>
    </label>
    <input
      id="tra-title"
      type="text"
      className="form-input"
      aria-describedby="tra-title-help"
      required
    />
    <div id="tra-title-help" className="form-help">
      Provide a clear, descriptive title for this task risk assessment
    </div>
  </div>
</form>
```

#### Touch and Gesture Optimization for Mobile
```css
/* Touch-friendly design principles */
.mobile-button {
  min-height: 44px; /* iOS Human Interface Guidelines */
  min-width: 44px;
  padding: 12px 16px;
  touch-action: manipulation; /* Prevent zoom on double-tap */
}

.swipe-action {
  /* Enable swipe gestures for list items */
  touch-action: pan-x pan-y;
}

.drag-handle {
  /* Larger touch area for drag operations */
  padding: 16px;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}
```

### Performance Optimization Patterns

#### Next.js Performance Best Practices
```typescript
// Example: Optimized TRA List with ISR
export async function getStaticProps() {
  return {
    props: {
      tras: await getTRAs(),
    },
    revalidate: 60, // Revalidate every minute
  }
}

// Example: Dynamic imports for large components
const TRAWizard = dynamic(() => import('@/components/tra/TRAWizard'), {
  loading: () => <TRAWizardSkeleton />,
  ssr: false // Client-side only for complex forms
})

// Example: Image optimization
import Image from 'next/image'

<Image
  src="/safety-photo.jpg"
  alt="Safety equipment verification"
  width={300}
  height={200}
  priority={false}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Firebase Integration Patterns

#### Real-time Collaboration Implementation
```typescript
// Real-time TRA collaboration
useEffect(() => {
  if (!traId) return

  const unsubscribe = onSnapshot(
    doc(db, `organizations/${orgId}/tras`, traId),
    (doc) => {
      if (doc.exists()) {
        const updatedTRA = doc.data()
        setTRA(updatedTRA)
        
        // Show who's currently editing
        setActiveCollaborators(updatedTRA.activeUsers || [])
      }
    }
  )

  return () => unsubscribe()
}, [traId, orgId])

// Optimistic updates for better UX
const updateTRAStep = async (stepIndex: number, updates: Partial<TaskStep>) => {
  // Update local state immediately
  setTRA(prev => ({
    ...prev,
    taskSteps: prev.taskSteps.map((step, index) => 
      index === stepIndex ? { ...step, ...updates } : step
    )
  }))

  // Then sync to Firebase
  try {
    await updateDoc(doc(db, `organizations/${orgId}/tras`, traId), {
      [`taskSteps.${stepIndex}`]: {
        ...currentStep,
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      }
    })
  } catch (error) {
    // Revert on error
    console.error('Failed to update TRA:', error)
    // Show error message and revert local state
  }
}
```

This comprehensive wireframe and user flow documentation provides clear guidance for implementing the Next.js + Firebase + Vercel solution with excellent user experience across all devices and use cases.