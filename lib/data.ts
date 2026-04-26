export const profile = {
  name: "Jeet Vijaywargi",
  role: "Cybersecurity × AI Engineer",
  tagline: "Breaking systems so I can rebuild them smarter.",
  location: "Pittsburgh, PA",
  coordinates: "40.4406°N · 79.9959°W",
  email: "jeetsatishv@gmail.com",
  phone: "+1 617-952-3393",
  available: true,
  bio: `I recently graduated from Carnegie Mellon with a Master's in AI Engineering focused on Information Security. I spend my time at the intersection of offensive security, incident response, and machine learning — from running ransomware recovery across 200 factory endpoints, to training an IDS that fits on a Raspberry Pi, to breaking passkey flows for fun.`,
  socials: {
    github: "https://github.com/jeetsatishv",
    linkedin: "https://linkedin.com/in/jeetvijaywargi",
    instagram: "https://instagram.com/jeetsv",
    email: "mailto:jeetsatishv@gmail.com",
  },
} as const;

export const education = [
  {
    school: "Carnegie Mellon University",
    degree: "M.S. Artificial Intelligence Engineering — Information Security",
    gpa: "3.94 / 4.0",
    location: "Pittsburgh, PA",
    start: "Aug 2024",
    end: "Dec 2025",
    coursework: [
      "ML with Adversaries",
      "Applied Information Assurance",
      "Security in Networked Systems",
      "AI Applications in Info Sec",
      "Hacking & Offensive Security",
      "Network Forensics",
      "Trustworthy AI",
      "Intro to Information Security",
      "Deep Learning",
    ],
  },
  {
    school: "Boston University",
    degree: "B.A. Computer Science · Minor: Business Administration",
    gpa: "3.7 / 4.0",
    location: "Boston, MA",
    start: "Aug 2020",
    end: "May 2024",
    coursework: [
      "Software Engineering",
      "AI",
      "Data Science Tools",
      "Cybersecurity",
      "Entrepreneurship",
    ],
    honor: "Dean's List — 7 of 8 semesters",
  },
] as const;

export const experience = [
  {
    company: "FalconEye Cybersecurity",
    role: "SOC Analyst",
    start: "Jun 2025",
    end: "Dec 2025",
    location: "On-site",
    bullets: [
      "Executed ransomware recovery protocols across 200 OT/factory endpoints, assisting IR to achieve a 3-hour RTO and rapidly restore critical production lines.",
      "Centralized endpoint telemetry in Cortex XDR and authored Palo Alto firewall policies (inbound, outbound, NAT), reducing incident response latency.",
      "Drafted incident response runbooks mapped to MITRE ATT&CK TTPs; validated resilient 3-2-1 backup architectures via recovery drills.",
    ],
    stack: ["Cortex XDR", "Palo Alto", "MITRE ATT&CK", "Splunk"],
  },
  {
    company: "Serene Pharma",
    role: "Security Engineering",
    start: "Jun 2024",
    end: "Aug 2024",
    location: "On-site",
    bullets: [
      "Designed network topology for a multi-site Palo Alto firewall deployment, establishing a unified security baseline across facilities.",
      "Modernized enterprise backbone to 1/10/40 Gb with redundant aggregation switches, eliminating single points of failure.",
      "Ran a targeted risk assessment of enterprise backup practices and proposed a resilient offline-storage model with periodic restore testing.",
    ],
    stack: ["Palo Alto", "Network Topology", "Risk Assessment"],
  },
  {
    company: "Serene Pharma",
    role: "Cybersecurity & Infrastructure Engineering",
    start: "Jun 2023",
    end: "Aug 2023",
    location: "On-site",
    bullets: [
      "Replaced unmanaged legacy switches with centrally managed equipment in critical areas, improving visibility, troubleshooting, and uptime.",
      "Automated endpoint provisioning using DUCKY scripts, cutting setup time ~80% and ensuring consistency.",
      "Engineered a LangChain-powered Telegram bot ecosystem: semantic search for medical reps, plus a real-time factory status dashboard for executives.",
    ],
    stack: ["LangChain", "Telegram Bot API", "DUCKY", "Networking"],
  },
] as const;

export type ProjectTag = "Security" | "AI/ML" | "Full-stack" | "Research";

export const projects = [
  {
    slug: "passkey-misbinding",
    title: "Passkey Misbinding Vulnerability (18-739)",
    date: "Dec 2025",
    tags: ["Security", "Research"] as ProjectTag[],
    summary:
      "Demonstrated a critical WebAuthn logic flaw where manipulating client-side identity data during registration enables account takeover. Final project for Hacking & Offensive Security.",
    highlights: [
      "Built full exploit pipeline using Flask + Docker + Python",
      "Automated IDOR attacks against the passkey registration API",
    ],
    stack: ["WebAuthn", "Flask", "Docker", "Python"],
    repo: "https://github.com/Jeetsatishv/18739-problem-dev1",
    featured: true,
  },
  {
    slug: "adversary-emulation",
    title: "Internal SQL Compromise: DFIR Reconstruction (14-823)",
    date: "Dec 2025",
    tags: ["Security", "Research"] as ProjectTag[],
    summary:
      "Group final for Network Forensics. Staged a fired-sysadmin insider threat: phishing → Meterpreter C2 on port 4444 → SOCKS pivot via proxychains → SQL injection against internal MySQL — then rebuilt the full attack timeline from Zeek, Suricata, and MySQL general query logs in SecurityOnion.",
    highlights: [
      "Designed the attacker/victim lab behind pfSense segmentation",
      "Reconstructed C2 sessions and SQLi payloads from PCAP + Zeek notices",
      "Authored code-level + network-level mitigations from the DFIR findings",
    ],
    stack: [
      "Metasploit",
      "SecurityOnion",
      "pfSense",
      "Zeek",
      "Suricata",
      "MySQL",
    ],
    featured: true,
  },
  {
    slug: "iot-attack-suite",
    title: "Metaspl-IoT: IoT Attack Suite (14-742)",
    date: "May 2025",
    tags: ["Security", "Research"] as ProjectTag[],
    summary:
      "Group final for Security in Networked Systems. Built a Metasploit-style attack suite against consumer IoT — deauth, credential brute force, and traffic manipulation against LIFX / Feit / AiDot smart bulbs, a Shark robot vacuum, and an Amazon Alexa. LIFX went fully exploitable; Alexa's 802.11w PMF held up.",
    highlights: [
      "Drove deauth attacks on 2.4 GHz + 5 GHz bands (aircrack-ng, ESP32, Flipper Zero)",
      "Found LIFX bulb had no rate limiting and leaked credentials in plaintext",
      "Documented which vendors enforce PMF (802.11w) vs. which still ignore it",
    ],
    stack: ["aircrack-ng", "ESP32", "Flipper Zero", "Scapy", "Wireshark"],
    /*repo: "https://github.com/gluejay/metapl-iot",*/
    featured: true,
  },
  {
    slug: "edge-detect-ids",
    title: "Edge-Detect IDS for Raspberry Pi (14-757)",
    date: "May 2025",
    tags: ["AI/ML", "Security"] as ProjectTag[],
    summary:
      "Final project for ML with Adversaries. Lightweight intrusion detection system on Raspberry Pi using PyTorch — aggregates raw PCAP into 25 normalized flow features and infers in real time.",
    highlights: [
      "91.9% accuracy with a 1.2 MB model",
      "LIME-based interpretability + alert digests",
      "Reproducible training scripts included",
    ],
    stack: ["PyTorch", "Raspberry Pi", "LIME", "PCAP"],
    featured: true,
  },
  {
    slug: "player-value-prediction",
    title: "Football Player Value Prediction on GCP (14-763)",
    date: "May 2025",
    tags: ["AI/ML"] as ProjectTag[],
    summary:
      "Final project for Systems Tool Chain for AI. Built a PySpark + PostgreSQL pipeline on Google Cloud that ingests football stats, engineers features with window functions (dense_rank over season/position), and trains GLR-Gamma, Random Forest, and PyTorch NNs on GPU to predict player market value.",
    highlights: [
      "PySpark on Dataproc joined multi-season stats into a single training table",
      "Compared Generalized Linear Regression (Gamma), Random Forest, and shallow + deep PyTorch NNs",
      "GPU training on Vertex AI; results visualized against actual transfer values",
    ],
    stack: [
      "Google Cloud",
      "PySpark",
      "PostgreSQL",
      "PyTorch",
      "Vertex AI",
    ],
  },
  {
    slug: "fridge-ai",
    title: "Fridge AI: Agentic Meal Planning (14-789)",
    date: "May 2025",
    tags: ["AI/ML", "Full-stack"] as ProjectTag[],
    summary:
      "Final project for AI Business Modeling. Proof-of-concept agent that watches what's in your fridge, respects dietary constraints, and proposes meals you can actually cook tonight — built on LangFlow orchestrating Gemini with Exa Search and AstraDB for recipe memory.",
    highlights: [
      "LangFlow pipeline: vision input → dietary filter → Gemini planner → Exa recipe retrieval",
      "AstraDB stores household preferences + past meals as long-term context",
      "Market sizing + unit economics modeled as part of the business case",
    ],
    stack: ["LangFlow", "Gemini", "Exa Search", "AstraDB"],
    featured: true,
  },
  {
    slug: "network-security",
    title: "Network Security Labs (14-742)",
    date: "May 2025",
    tags: ["Security"] as ProjectTag[],
    summary:
      "Five-lab sequence across the network stack: raw-socket packet crafting in C, OpenSSL PKI + OpenVPN deployment, and an OpenFlow firewall on Open vSwitch with a Ryu controller.",
    highlights: [
      "Lab 1 — raw ICMP / TCP SYN flood crafting; validated SYN-cookie DDoS mitigation",
      "Lab 2 — TCP/IP & routing-layer exploitation on a Mininet topology",
      "Lab 3 — routed OpenVPN with OpenSSH bastion, subnet routing, CRLs",
      "Lab 4 — switch-stats-driven flood detection + rate limiting via Ryu/OpenFlow",
    ],
    stack: ["C", "OpenSSL", "OpenVPN", "Ryu", "OpenFlow", "Mininet"],
  },
  {
    slug: "cyber-kill-chain",
    title: "Cyber Kill ChAIAn (14-761)",
    date: "Dec 2024",
    tags: ["Security", "Research"] as ProjectTag[],
    summary:
      "Final for Applied Information Assurance. Walked an Apache Tomcat target (CVE-2025-24813 — path traversal + insecure deserialization) through the full Lockheed kill chain, from reconnaissance to actions-on-objectives, and mapped defensive controls at each stage.",
    highlights: [
      "Recon → weaponization → delivery → exploitation workflow, each with tooling (Nmap, CewL, John, Hashcat)",
      "Mapped kill-chain stages to MITRE ATT&CK and concrete blue-team controls",
      "Weaponized CVE-2025-24813 to land a deserialization-triggered shell",
    ],
    stack: ["Nmap", "CewL", "John", "Hashcat", "Tomcat", "MITRE ATT&CK"],
  },
  {
    slug: "product-registration-bot",
    title: "Automated Product Registration Bot",
    date: "2024",
    tags: ["Full-stack", "AI/ML"] as ProjectTag[],
    summary:
      "Telegram bot that tracks pharmaceutical product certifications for pharma operation — registers products, monitors expiry windows, and pings stakeholders across Telegram with multi-stage reminder thresholds.",
    highlights: [
      "Multi-user conversation state machine (register / edit / delete / list) with 9-user allowlist",
      "Expiry scheduler fires at 365/180/90/60/30/15/7/1/0-day deltas",
      "AWS S3 for certificate storage, Heroku worker deploy via Procfile",
    ],
    stack: ["Python", "python-telegram-bot", "Flask", "AWS S3", "Heroku"],
    featured: true,
  },
  {
    slug: "bucrib",
    title: "BUCrib",
    date: "2024",
    tags: ["Full-stack"] as ProjectTag[],
    summary:
      "Modern social app for BU students — native mobile UI built with React, Appwrite, and TypeScript.",
    highlights: [
      "Real-time social feed",
      "Appwrite backend + authentication",
    ],
    stack: ["React", "TypeScript", "Appwrite"],
    repo: "https://github.com/jeetsatishv/BUCrib",
  },
  {
    slug: "chess-ai",
    title: "ChessAI",
    date: "2023",
    tags: ["AI/ML"] as ProjectTag[],
    summary:
      "AI agent that uses classical heuristics (minimax with α-β pruning) to compute the next best move in chess.",
    highlights: [
      "Heuristic evaluation function",
      "α-β pruning for search efficiency",
    ],
    stack: ["Java"],
    repo: "https://github.com/jeetsatishv/ChessAI",
  },
  {
    slug: "neural-network",
    title: "Neural Network from Scratch",
    date: "2023",
    tags: ["AI/ML"] as ProjectTag[],
    summary:
      "Neural network built from scratch in Java, training AI agents to fight in a field — tunable activation functions and depth.",
    highlights: [
      "Custom activation functions",
      "Configurable network depth",
    ],
    stack: ["Java"],
    repo: "https://github.com/jeetsatishv/Neural-Network",
  },
] as const;

export const skills = [
  {
    group: "Security",
    items: [
      "Cortex XDR",
      "Splunk",
      "Wireshark",
      "Burp Suite",
      "Metasploit",
      "SecurityOnion",
      "Palo Alto",
      "MITRE ATT&CK",
      "NIST",
      "OWASP Top 10",
    ],
  },
  {
    group: "AI & Data",
    items: [
      "PyTorch",
      "TensorFlow",
      "LangChain",
      "NLP",
      "Deep Learning",
      "LIME",
    ],
  },
  {
    group: "Languages",
    items: ["Python", "Java", "C", "TypeScript", "Bash"],
  },
  {
    group: "Cloud & DevOps",
    items: ["AWS", "Google Cloud", "Docker", "Linux / Unix", "Automation"],
  },
  {
    group: "Databases",
    items: ["PostgreSQL", "Neo4j", "Firebase", "MySQL", "SQL"],
  },
  {
    group: "Concepts",
    items: [
      "Incident Response",
      "Zero Trust",
      "Threat Modeling",
      "NSM",
      "DFIR",
      "Log Analysis",
    ],
  },
] as const;

export const achievements = [
  {
    title: "TEDx Speaker",
    description:
      "Selected from 50+ applicants to deliver a talk on mathematical concepts. Viewed 1.5k+ times on the TEDx YouTube channel.",
    tag: "Speaker",
  },
  {
    title: "Dean's List",
    description:
      "Boston University — 7 out of 8 semesters, reflecting consistent academic excellence through undergrad.",
    tag: "Academic",
  },
  {
    title: "CMU AI Engineering",
    description:
      "Master's with a 3.94/4.0 GPA at Carnegie Mellon, focusing on AI × Information Security.",
    tag: "Academic",
  },
] as const;

export const talk = {
  title: "What if infinity was more than you thought?",
  event: "TEDxYouth@TashkentIntlSchool",
  videoId: "BKqRhEFKHsI",
  description:
    "A student's take on infinity — from the math that defines it to the way it shows up in the choices we make. Delivered at TEDxYouth and viewed 1.5k+ times on the official TEDx channel.",
  tedUrl:
    "https://www.ted.com/talks/jeet_satish_vijaywargi_what_if_infinity_was_more_than_you_thought",
  youtubeUrl: "https://www.youtube.com/watch?v=BKqRhEFKHsI",
} as const;

export const writing = [
  {
    title: "John Stuart Mill's Utilitarianism: Maximizing Happiness and Its Limits",
    href: "https://medium.com/p/22f72ff9f61e",
    date: "Dec 2024",
    summary:
      "Explores Mill's Principle of Utility and argues that actions should maximize happiness while critiquing the claim that all desired things are inherently desirable.",
    tag: "Ethics",
  },
  {
    title: "Socrates and the Inconsistent Triad: Virtue, Knowledge, and Teachability",
    href: "https://medium.com/p/6b7db573c4d1",
    date: "Dec 2024",
    summary:
      "Examines Socrates' view that virtue is knowledge but not teachable, contrasting this with the theory of recollection and questioning whether virtue can be instructed.",
    tag: "Ancient",
  },
  {
    title: "Camus and the Absurd: The Clash Between Human Desires and Reality",
    href: "https://medium.com/p/1ad8c171f47c",
    date: "Dec 2024",
    summary:
      "Analyzes Camus's concept that human existence is absurd due to the confrontation between our longing for clarity and reality's limits.",
    tag: "Existentialism",
  },
  {
    title: "Schopenhauer on Suffering: A Critique of Life's Worth and the Role of Desire",
    href: "https://medium.com/p/d28895b5f55d",
    date: "Dec 2024",
    summary:
      "Examines Schopenhauer's pessimism that suffering stems from insatiable desires, countering that happiness can occur during activities rather than merely through desire fulfillment.",
    tag: "Metaphysics",
  },
  {
    title: "Virtue, Happiness, and the Human Function: Examining Aristotle's Argument and Its Limits",
    href: "https://medium.com/p/20fcf4b2186b",
    date: "Dec 2024",
    summary:
      "Analyzes Aristotle's function argument linking virtue to happiness, questioning whether human function is truly unique and whether virtue is absolutely necessary for living well.",
    tag: "Ancient",
  },
] as const;

/**
 * Top navigation. Kept tight — each tab groups related sections on the
 * single-page home layout. Deeper sections (Projects, Coursework, Stack,
 * Wins, Philosophy, Contact) are still reachable via the 1–9 keyboard
 * shortcuts and the command palette.
 */
export const navItems = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Beyond", href: "#talk" },
  { label: "Writing", href: "#writing" },
  { label: "Contact", href: "#contact" },
] as const;

/**
 * 1–9 keyboard shortcuts. The number matches the "// 0N —" section label
 * inside each section component. Press 2 → Experience, 7 → Talk, etc.
 */
export const sectionShortcuts: { key: string; href: string; label: string }[] = [
  { key: "1", href: "#about", label: "About" },
  { key: "2", href: "#experience", label: "Experience" },
  { key: "3", href: "#projects", label: "Projects" },
  { key: "4", href: "#coursework", label: "Coursework" },
  { key: "5", href: "#skills", label: "Stack" },
  { key: "6", href: "#achievements", label: "Wins" },
  { key: "7", href: "#talk", label: "Talk" },
  { key: "8", href: "#writing", label: "Philosophy" },
  { key: "9", href: "#contact", label: "Contact" },
];

export const coursework = [
  {
    code: "14-741",
    title: "Introduction to Information Security",
    group: "Security",
    semester: "Fall 2024",
    topics: [
      "Cryptographic primitives",
      "Access control & authentication",
      "Buffer overflows & memory safety",
      "Tor & anonymity networks",
      "Protocol analysis",
    ],
  },
  {
    code: "14-742",
    title: "Security in Networked Systems",
    group: "Security",
    semester: "Spring 2025",
    topics: [
      "Socket programming",
      "Link-layer & routing security",
      "TCP/IP vulnerabilities",
      "Software-defined networking",
      "NIDS & DoS mitigation",
    ],
  },
  {
    code: "14-757",
    title: "Intro to ML with Adversaries",
    group: "AI/ML",
    topics: [
      "Adversarial examples (FGSM, PGD)",
      "Evasion & poisoning attacks",
      "Robust training defenses",
      "Evaluating models under attack",
    ],
  },
  {
    code: "14-761",
    title: "Applied Information Assurance",
    group: "Security",
    topics: [
      "Security operations playbooks",
      "Incident response workflows",
      "Defense-in-depth",
      "Vulnerability management",
    ],
  },
  {
    code: "14-763",
    title: "Systems Tool Chain for AI",
    group: "AI/ML",
    topics: [
      "ML pipelines & MLOps",
      "Distributed training",
      "Data versioning",
      "Model serving & monitoring",
    ],
  },
  {
    code: "14-789",
    title: "AI Business Modeling",
    group: "Business",
    topics: [
      "AI product strategy",
      "Cost modeling for ML",
      "Go-to-market for AI",
    ],
  },
  {
    code: "14-795",
    title: "AI Applications in Info Security",
    group: "AI/ML",
    topics: [
      "ML for threat detection",
      "Anomaly detection on telemetry",
      "LLMs for security analysis",
    ],
  },
  {
    code: "14-823",
    title: "Network Forensics",
    group: "Security",
    semester: "Fall 2025",
    topics: [
      "PCAP & flow analysis",
      "Wireless & tunneling forensics",
      "HTTP / web artifacts",
      "Host-based evidence",
      "Blockchain forensics",
    ],
  },
  {
    code: "14-740",
    title: "Fundamentals of Telecom Networks",
    group: "Systems",
    topics: [
      "Routing protocols",
      "Cellular & wireless networks",
      "SDN & traffic engineering",
      "Performance modeling",
    ],
  },
  {
    code: "18-780",
    title: "Intro to Deep Learning (Pt. 1)",
    group: "AI/ML",
    topics: [
      "Backpropagation & optimization",
      "CNNs & RNNs",
      "Regularization",
      "Practical PyTorch",
    ],
  },
  {
    code: "18-739",
    title: "Hacking & Offensive Security",
    group: "Security",
    topics: [
      "Exploit development",
      "Binary reverse engineering",
      "Web app pentesting",
      "Privilege escalation",
    ],
  },
  {
    code: "24-784",
    title: "Trustworthy AI",
    group: "AI/ML",
    semester: "Spring 2025",
    topics: [
      "Adversarial robustness (FGSM, poisoning)",
      "Safe reinforcement learning (CMDP, CPO)",
      "Reachability & control barriers",
      "Fairness, privacy, causal reasoning",
    ],
  },
] as const;
