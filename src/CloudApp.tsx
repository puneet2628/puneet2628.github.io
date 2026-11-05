import React, { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity, ArrowLeft, ArrowRight, ArrowUpRight, Award,
  BookOpen, Boxes, Briefcase, Check, CheckCircle2,
  ChevronDown, ChevronRight, Circle, Clock, Cloud, Code2,
  Database, ExternalLink, Gauge, GitBranch, Goal, GraduationCap,
  Layers3, LayoutDashboard, ListChecks, Menu, Search,
  ShieldCheck, Sparkles, Target, Terminal, X, Zap
} from 'lucide-react';
import roadmapData from './data/roadmaps.json';

type RoadmapModule = {
  title: string;
  description: string;
  topics: string[];
  lab: string;
  gate: string;
};

type RoadmapStage = {
  title: string;
  focus: string;
  modules: RoadmapModule[];
};

type RoadmapPath = {
  id: string;
  title: string;
  short: string;
  area: string;
  level: string;
  time: string;
  description: string;
  outcome: string;
  stages: RoadmapStage[];
};

type ProgressState = Record<string, boolean>;
type ExpandedState = Record<string, boolean>;
type ProgressTotals = { total: number; done: number; percent: number };
type PathProgress = ProgressTotals;
type ViewId = 'overview' | 'paths' | 'projects' | 'career' | 'resources' | 'path-detail';
type NavigationId = Exclude<ViewId, 'path-detail'>;
type AreaMeta = { color: string; icon: LucideIcon; number: string };
type NextModule = {
  path: RoadmapPath;
  stageIndex: number;
  moduleIndex: number;
  module: RoadmapModule;
  done: number;
  total: number;
};

type Project = {
  id: string;
  name: string;
  level: 'Foundation' | 'Intermediate' | 'Advanced' | 'Enterprise' | 'Principal';
  role: string;
  stack: string[];
  summary: string;
  proof: string[];
};

const roadmap: RoadmapPath[] = roadmapData;



const STORAGE_KEY = 'cloudpath-academy-progress-v1';
const PROJECT_KEY = 'cloudpath-academy-projects-v1';

const CURRICULUM_TOTALS = roadmap.reduce((acc, path) => {
  acc.tracks += 1;
  acc.stages += path.stages.length;
  path.stages.forEach(stage => {
    acc.modules += stage.modules.length;
    stage.modules.forEach(module => { acc.topics += module.topics.length; });
  });
  return acc;
}, { tracks: 0, stages: 0, modules: 0, topics: 0 });

const NAV: Array<{ id: NavigationId; label: string; icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'paths', label: 'Learning paths', icon: GitBranch },
  { id: 'projects', label: 'Portfolio projects', icon: Briefcase },
  { id: 'career', label: 'Career map', icon:  Goal},
  { id: 'resources', label: 'Resources', icon: BookOpen },
];

function MilestoneIcon(props: React.ComponentProps<typeof Target>) { return <Target {...props} />; }

const AREA_META: Record<string, AreaMeta> = {
  'Engineering foundations': { color: 'violet', icon: Code2, number: '01' },
  'Systems foundations': { color: 'cyan', icon: Terminal, number: '02' },
  'Data foundations': { color: 'amber', icon: Database, number: '03' },
  'Platform engineering': { color: 'blue', icon: Boxes, number: '04' },
  'Cloud platform': { color: 'orange', icon: Cloud, number: '05' },
  'Reliability': { color: 'green', icon: Activity, number: '06' },
  'Security & governance': { color: 'rose', icon: ShieldCheck, number: '07' },
  'Architecture': { color: 'violet', icon: Layers3, number: '08' },
  'Career execution': { color: 'amber', icon: GraduationCap, number: '09' },
};

const PROJECTS: Project[] = [
  { id: 'linux-cli', name: 'Linux system intelligence CLI', level: 'Foundation', role: 'Systems Engineer', stack: ['Python', 'Linux', 'psutil', 'JSON'], summary: 'Inspect CPU, memory, disk, processes and network health. Export machine-readable reports and make the tool safe to run repeatedly.', proof: ['Typed CLI with clear exit codes', 'JSON and CSV reports', 'Structured logs and unit tests', 'Documented troubleshooting scenarios'] },
  { id: 'cloud-inventory', name: 'Multi-cloud resource inventory', level: 'Intermediate', role: 'Cloud Engineer', stack: ['Python', 'Boto3', 'GCP SDK', 'Azure SDK'], summary: 'Discover resources across AWS, GCP and Azure, normalize the results and produce ownership, exposure and cost reports.', proof: ['Provider adapters behind one interface', 'Pagination, retries and rate limits', 'Workload identity / short-lived credentials', 'Inventory diff and audit trail'] },
  { id: 'three-tier', name: 'Production three-tier application', level: 'Intermediate', role: 'Cloud Engineer', stack: ['AWS', 'VPC', 'ALB', 'EC2', 'RDS'], summary: 'Build a private-by-default application topology with an edge layer, application tier, database tier, backups and monitoring.', proof: ['Architecture and threat diagrams', 'Multi-AZ network and security groups', 'Infrastructure as Code', 'Backup restore test and SLO dashboard'] },
  { id: 'iac-platform', name: 'Reusable infrastructure platform', level: 'Advanced', role: 'Infrastructure Engineer', stack: ['Terraform', 'OpenTofu', 'GitHub Actions', 'OPA'], summary: 'Create versioned modules and a pull-request workflow that plans, scans, validates and applies infrastructure with ephemeral identity.', proof: ['Remote state and locking', 'Reusable modules with tests', 'OIDC cloud federation', 'Policy-as-code gates and drift reporting'] },
  { id: 'k8s-platform', name: 'Production Kubernetes platform', level: 'Advanced', role: 'Platform Engineer', stack: ['EKS / GKE / AKS', 'Helm', 'Argo CD', 'Cilium'], summary: 'Build a secure cluster platform with workload standards, autoscaling, progressive delivery, secrets and fleet operations.', proof: ['Cluster architecture and upgrade plan', 'RBAC and default-deny policies', 'Autoscaling and disruption controls', 'GitOps and canary rollback'] },
  { id: 'observability', name: 'Enterprise observability platform', level: 'Advanced', role: 'SRE', stack: ['OpenTelemetry', 'Prometheus', 'Grafana', 'Loki', 'Tempo'], summary: 'Instrument a distributed service and correlate metrics, logs and traces. Define meaningful SLIs and error-budget alerts.', proof: ['Golden-signal dashboards', 'Trace context across service boundaries', 'SLO and burn-rate alerts', 'Incident runbooks and postmortem'] },
  { id: 'security', name: 'Cloud security & compliance control plane', level: 'Advanced', role: 'Cloud Security Engineer', stack: ['IAM', 'KMS', 'OPA', 'Trivy', 'CloudTrail'], summary: 'Aggregate findings, enforce identity and network guardrails, scan artifacts and produce auditable security evidence.', proof: ['Threat model and trust boundaries', 'Least-privilege identity model', 'Policy checks in CI', 'Centralized audit and remediation workflow'] },
  { id: 'finops', name: 'Multi-cloud FinOps engine', level: 'Advanced', role: 'Cloud Optimization Engineer', stack: ['Python', 'AWS Cost Explorer', 'BigQuery', 'Azure Cost Management'], summary: 'Normalize billing and usage data, map spend to teams and services, detect anomalies and recommend engineering optimizations.', proof: ['Cost allocation and tagging model', 'Forecast and anomaly report', 'Unit economics dashboard', 'Recommendations with measurable before/after'] },
  { id: 'landing-zone', name: 'Enterprise cloud landing zone', level: 'Enterprise', role: 'Cloud Architect', stack: ['Organizations', 'IAM', 'VPC', 'Policy as Code'], summary: 'Design account, project or subscription hierarchy, centralized identity, network foundations, logging and governance guardrails.', proof: ['HLD, LLD and ADRs', 'Organization hierarchy and account vending', 'Shared network and security services', 'Exception and audit process'] },
  { id: 'dr-platform', name: 'Multi-region disaster recovery platform', level: 'Enterprise', role: 'Senior Cloud Architect', stack: ['Terraform', 'DNS', 'Replication', 'k6'], summary: 'Build a recovery architecture with explicit RTO/RPO, validated backups, health-based routing and repeatable failover drills.', proof: ['RTO/RPO objectives and assumptions', 'Recovery and failback runbooks', 'Measured recovery exercise', 'Data integrity and cost analysis'] },
  { id: 'hybrid-cloud', name: 'Hybrid enterprise connectivity', level: 'Enterprise', role: 'Infrastructure Architect', stack: ['BGP', 'VPN', 'PrivateLink', 'DNS'], summary: 'Connect on-premises and cloud networks with routing, segmentation, identity federation and resilient name resolution.', proof: ['CIDR plan and route design', 'Connectivity and trust diagrams', 'Packet-level troubleshooting evidence', 'Failure and route-convergence test'] },
  { id: 'migration', name: 'Enterprise application migration', level: 'Enterprise', role: 'Cloud Migration Architect', stack: ['Discovery', 'CDC', 'DMS', 'Terraform'], summary: 'Assess a legacy application, map dependencies, design migration waves, move data safely and execute a reversible cutover.', proof: ['Application inventory and dependency map', 'Migration strategy and wave plan', 'CDC validation and reconciliation', 'Cutover, rollback and business sign-off'] },
  { id: 'idp', name: 'Internal developer platform', level: 'Enterprise', role: 'Principal Platform Engineer', stack: ['Kubernetes', 'Terraform', 'Argo CD', 'Developer portal'], summary: 'Create a self-service paved road for teams to provision, deploy and operate services with guardrails built in.', proof: ['Golden-path templates', 'Reusable IaC and CI workflows', 'Policy and security defaults', 'Platform adoption and SLO metrics'] },
  { id: 'failover', name: 'Multi-cloud active-active / failover', level: 'Principal', role: 'Enterprise Cloud Architect', stack: ['AWS EKS', 'Azure AKS', 'BGP', 'Argo CD', 'CockroachDB'], summary: 'Extend the two-cloud capstone from the advanced blueprint: private connectivity, GitOps synchronization, data resilience and global routing.', proof: ['Cross-cloud network and identity model', 'Data consistency and quorum analysis', 'Health-checked global routing', 'Measured RTO/RPO, failure and failback'] },
  { id: 'telemetry', name: 'Real-time financial telemetry engine', level: 'Principal', role: 'Distributed Systems Engineer', stack: ['gRPC', 'Kafka / Kinesis', 'Redis', 'Flink', 'OpenTelemetry'], summary: 'Build an event-driven ingestion and stream-processing pipeline with idempotency, partition ordering, ledger persistence and anomaly windows.', proof: ['Protobuf contracts and load generator', 'Idempotent ingestion and DLQ', 'Consumer lag and P95/P99 dashboards', 'Failure-mode and data-integrity tests'] },
];

const CAREER = [
  { id: 'foundation', name: 'Engineering foundation', window: '0–3 months', roles: 'Systems / Backend foundations', desc: 'Linux, networking, Git, programming fundamentals and SQL.', checks: ['Navigate Linux and diagnose common host issues', 'Write small Python tools and tested scripts', 'Explain TCP, DNS, CIDR and subnetting', 'Use Git, shell and SQL confidently'] },
  { id: 'junior', name: 'Junior cloud / DevOps engineer', window: '3–8 months', roles: 'Junior Cloud · Cloud Support · Junior DevOps', desc: 'AWS fundamentals, compute, storage, networking, IAM, databases and automation.', checks: ['Build a secure VPC and deploy a small workload', 'Use IAM roles and short-lived credentials', 'Automate a cloud task with Python', 'Publish two deployed, documented projects'] },
  { id: 'engineer', name: 'Cloud / DevOps engineer', window: '8–15 months', roles: 'Cloud Engineer · DevOps Engineer', desc: 'Docker, Kubernetes, Terraform, CI/CD and production-style AWS architecture.', checks: ['Provision a complete environment from code', 'Build secure images and automated pipelines', 'Deploy and troubleshoot Kubernetes workloads', 'Operate logs, metrics, alerts and backups'] },
  { id: 'multi', name: 'Multi-cloud engineer / SRE', window: '15–24 months', roles: 'Platform Engineer · SRE · Multi-cloud Engineer', desc: 'GCP, Azure, advanced Kubernetes, reliability, automation and security.', checks: ['Build and compare AWS, GCP and Azure foundations', 'Define service SLOs and error budgets', 'Run an incident and recovery exercise', 'Instrument services with metrics, logs and traces'] },
  { id: 'senior', name: 'Senior cloud engineer / architect', window: '2–4 years', roles: 'Senior Cloud Engineer · Cloud Architect', desc: 'Distributed systems, enterprise networking, HA/DR, cost engineering and architecture ownership.', checks: ['Own production services and measurable outcomes', 'Lead a design or migration across teams', 'Defend architecture trade-offs and cost decisions', 'Create runbooks, ADRs and recovery evidence'] },
  { id: 'principal', name: 'Enterprise / principal architect', window: '4–7+ years', roles: 'Staff / Principal · Enterprise Cloud Architect', desc: 'Organization strategy, governance, landing zones, multi-region design and technical leadership.', checks: ['Set platform and security standards', 'Lead architecture reviews and strategic decisions', 'Mentor engineers and resolve cross-team trade-offs', 'Connect business outcomes to technical architecture'] },
];

const STUDY_PLAN = [
  ['Months 1–3', 'Engineering foundation', 'Linux, networking, Git, Python fundamentals and SQL basics.'],
  ['Months 4–6', 'Programming & systems', 'Advanced Python, JavaScript fundamentals, PostgreSQL, DSA and Linux administration.'],
  ['Months 7–9', 'AWS fundamentals', 'IAM, EC2, S3, VPC, RDS, load balancing, Route 53 and monitoring.'],
  ['Months 10–12', 'AWS engineering', 'Terraform, Docker, CI/CD, Lambda, security and first production-style projects.'],
  ['Months 13–15', 'Kubernetes & DevOps', 'Kubernetes, Helm, GitOps, CI/CD platforms and Ansible.'],
  ['Months 16–18', 'Google Cloud', 'GCP networking, compute, IAM, GKE, Cloud Run and BigQuery.'],
  ['Months 19–21', 'Microsoft Azure', 'Entra ID, VNet, AKS, Azure DevOps, Bicep and governance.'],
  ['Months 22–24', 'SRE & reliability', 'Observability, SLOs, incident management, chaos engineering and DR.'],
  ['Months 25–27', 'Advanced architecture', 'Distributed systems, security architecture, HA and multi-region design.'],
  ['Months 28–30', 'Enterprise cloud', 'Landing zones, hybrid networking, governance, migration and FinOps.'],
  ['Months 31–33', 'Multi-cloud architecture', 'Cross-cloud design, portability, identity, observability and strategy.'],
  ['Months 34–36', 'Senior-level portfolio', 'Capstone systems, technical documentation, interviews and architecture presentations.'],
];

const ACCEL_PLAN = [
  ['Months 1–3', 'The iron base', 'Python async CLI tools, Node/TypeScript services, Linux namespaces and systemd, networking, PostgreSQL query plans and database pooling.', 'Ship the drift-detection CLI and multi-tenant migration engine with CI and meaningful test coverage.', 'Junior systems / backend / cloud support'],
  ['Months 4–6', 'Primary cloud & IaC', 'AWS multi-AZ networking, IAM, KMS, S3 controls, modular Terraform/OpenTofu, remote state, OIDC pipelines and hardened container images.', 'Provision a production-style AWS environment from code with no manual console steps.', 'Cloud Engineer'],
  ['Months 7–9', 'Kubernetes, GitOps & SRE', 'EKS, Karpenter, Cilium, Argo CD, Istio/Gateway API, external secrets, progressive delivery and OpenTelemetry-based observability.', 'Run a controlled failure exercise and verify health, rollback and SLO behavior.', 'DevOps / SRE'],
  ['Months 10–12', 'GCP & Azure expansion', 'GCP resource hierarchy, global VPC, GKE, Cloud Run and BigQuery; Azure Entra ID, VNet, AKS, Cosmos DB and governance.', 'Load-test the real-time telemetry capstone and publish measured latency and throughput evidence.', 'Platform / multi-cloud engineer'],
  ['Months 13–15', 'Enterprise architecture', 'Cross-cloud connectivity, active-active or failover design, distributed data, global routing, FinOps and staff-level system design.', 'Record an architecture walkthrough and a tested failover exercise with measured RTO/RPO.', 'Advanced architecture stretch goal'],
];

const RESOURCES = [
  { group: 'Programming & computer science', links: [
    ['Python documentation', 'https://docs.python.org/3/'], ['Node.js documentation', 'https://nodejs.org/en/learn'], ['TypeScript handbook', 'https://www.typescriptlang.org/docs/'], ['MDN JavaScript guide', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide']
  ]},
  { group: 'Cloud platforms', links: [
    ['AWS Training', 'https://aws.amazon.com/training/'], ['AWS documentation', 'https://docs.aws.amazon.com/'], ['Google Cloud Learning', 'https://cloud.google.com/learn'], ['Google Cloud documentation', 'https://cloud.google.com/docs'], ['Microsoft Learn for Azure', 'https://learn.microsoft.com/en-us/training/azure/'], ['Azure documentation', 'https://learn.microsoft.com/en-us/azure/']
  ]},
  { group: 'Architecture, reliability & cost', links: [
    ['AWS Well-Architected Framework', 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html'], ['Google Cloud Architecture Framework', 'https://cloud.google.com/architecture/framework'], ['Azure Well-Architected Framework', 'https://learn.microsoft.com/en-us/azure/well-architected/'], ['Google SRE books', 'https://sre.google/books/'], ['FinOps Framework', 'https://www.finops.org/framework/']
  ]},
  { group: 'Platform engineering', links: [
    ['Kubernetes documentation', 'https://kubernetes.io/docs/'], ['Terraform documentation', 'https://developer.hashicorp.com/terraform/docs'], ['OpenTofu documentation', 'https://opentofu.org/docs/'], ['Docker documentation', 'https://docs.docker.com/'], ['Argo CD documentation', 'https://argo-cd.readthedocs.io/en/stable/'], ['OpenTelemetry documentation', 'https://opentelemetry.io/docs/']
  ]},
];

function countPath(path: RoadmapPath): number {
  return path.stages.reduce((sum, stage) => sum + stage.modules.reduce((n, mod) => n + mod.topics.length, 0), 0);
}
function slugTask(pathId: string, stageIndex: number, moduleIndex: number, topicIndex: number): string {
  return `${pathId}:${stageIndex}:${moduleIndex}:${topicIndex}`;
}
function getStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}
function percent(done: number, total: number): number { return total ? Math.round((done / total) * 100) : 0; }
function pathDone(path: RoadmapPath, progress: ProgressState): PathProgress {
  let total = 0, done = 0;
  path.stages.forEach((stage, si) => stage.modules.forEach((mod, mi) => mod.topics.forEach((_, ti) => {
    total += 1; if (progress[slugTask(path.id, si, mi, ti)]) done += 1;
  })));
  return { total, done, percent: percent(done, total) };
}
function allTotals(progress: ProgressState): ProgressTotals {
  let total = 0, done = 0;
  roadmap.forEach(path => path.stages.forEach((stage, si) => stage.modules.forEach((mod, mi) => mod.topics.forEach((_, ti) => {
    total += 1; if (progress[slugTask(path.id, si, mi, ti)]) done += 1;
  }))));
  return { total, done, percent: percent(done, total) };
}
function getNextModule(progress: ProgressState): NextModule | null {
  for (const path of roadmap) {
    for (let si = 0; si < path.stages.length; si++) {
      for (let mi = 0; mi < path.stages[si].modules.length; mi++) {
        const mod = path.stages[si].modules[mi];
        const done = mod.topics.filter((_, ti) => progress[slugTask(path.id, si, mi, ti)]).length;
        if (done < mod.topics.length) return { path, stageIndex: si, moduleIndex: mi, module: mod, done, total: mod.topics.length };
      }
    }
  }
  return null;
}
function IconForPath({ path, size = 20 }: { path: RoadmapPath; size?: number }) {
  const Icon = (AREA_META[path.area] || AREA_META['Engineering foundations']).icon;
  return <Icon size={size} strokeWidth={1.8} />;
}
function ProgressBar({ value, color = 'violet', height = '6px' }: { value: number; color?: string; height?: string }) {
  return <div className={`progress-track ${height === '9px' ? 'progress-track-lg' : ''}`}><span className={`progress-fill ${color}`} style={{ width: `${value}%` }} /></div>;
}
function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: string }) { return <span className={`badge badge-${tone}`}>{children}</span>; }

export default function CloudApp() {
  const [progress, setProgress] = useState<ProgressState>(() => getStored<ProgressState>(STORAGE_KEY, {}));
  const [projectProgress, setProjectProgress] = useState<ProgressState>(() => getStored<ProgressState>(PROJECT_KEY, {}));
  const [view, setView] = useState<ViewId>('overview');
  const [selectedPathId, setSelectedPathId] = useState('python');
  const [search, setSearch] = useState('');
  const [pathArea, setPathArea] = useState('All paths');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [moduleSearch, setModuleSearch] = useState('');
  const [showAllStages, setShowAllStages] = useState(false);
  const [projectFilter, setProjectFilter] = useState('All');

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }, [progress]);
  useEffect(() => { localStorage.setItem(PROJECT_KEY, JSON.stringify(projectProgress)); }, [projectProgress]);

  const totals = useMemo(() => allTotals(progress), [progress]);
  const selectedPath = roadmap.find(p => p.id === selectedPathId) || roadmap[0];
  const next = useMemo(() => getNextModule(progress), [progress]);
  const selectedStats = useMemo(() => pathDone(selectedPath, progress), [selectedPath, progress]);

  const navigate = (id: NavigationId) => { setView(id); setMobileOpen(false); setSearch(''); };
  const openPath = (id: string) => { setSelectedPathId(id); setView('path-detail'); setModuleSearch(''); setShowAllStages(false); setExpanded({ [`${id}:stage:0`]: true, [`${id}:module:0:0`]: true }); setMobileOpen(false); };
  const toggleTopic = (taskId: string) => setProgress(old => ({ ...old, [taskId]: !old[taskId] }));
  const setModuleDone = (path: RoadmapPath, si: number, mi: number, value: boolean) => {
    setProgress(old => {
      const nextState = { ...old };
      path.stages[si].modules[mi].topics.forEach((_, ti) => { const k = slugTask(path.id, si, mi, ti); if (value) nextState[k] = true; else delete nextState[k]; });
      return nextState;
    });
  };
  const toggleExpanded = (key: string) => setExpanded(old => ({ ...old, [key]: !old[key] }));
  const markAllPath = (path: RoadmapPath, value: boolean) => {
    setProgress(old => {
      const nextState = { ...old };
      path.stages.forEach((stage, si) => stage.modules.forEach((mod, mi) => mod.topics.forEach((_, ti) => {
        const k = slugTask(path.id, si, mi, ti); if (value) nextState[k] = true; else delete nextState[k];
      })));
      return nextState;
    });
  };

  const filteredPaths = useMemo(() => roadmap.filter(path => {
    const inArea = pathArea === 'All paths' || path.area === pathArea;
    const query = search.trim().toLowerCase();
    if (!query) return inArea;
    const content = [path.title, path.description, path.area, path.outcome, ...path.stages.flatMap(s => [s.title, s.focus, ...s.modules.flatMap(m => [m.title, ...m.topics])])].join(' ').toLowerCase();
    return inArea && content.includes(query);
  }), [search, pathArea]);

  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { setView('paths'); setPathArea('All paths'); setMobileOpen(false); } };

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><Cloud size={19} strokeWidth={2.2} /><span /></div>
          <div className="brand-copy"><strong>cloudpath<span>.</span></strong><small>ENGINEERING ACADEMY</small></div>
          <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="workspace-switch"><div className="workspace-avatar">CP</div><div><strong>Cloud Engineering</strong><small>Learning workspace</small></div><ChevronDown size={14} /></div>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="side-nav">
          {NAV.map(item => {
            const Icon = item.icon; const active = view === item.id || (view === 'path-detail' && item.id === 'paths');
            return <button key={item.id} className={`nav-item ${active ? 'active' : ''}`} onClick={() => navigate(item.id)}><Icon size={17} /><span>{item.label}</span>{item.id === 'paths' && <small>{roadmap.length}</small>}</button>;
          })}
        </nav>
        <div className="sidebar-divider" />
        <div className="nav-caption">YOUR PROGRESS</div>
        <div className="sidebar-progress">
          <div className="side-progress-top"><span>Curriculum mastery</span><strong>{totals.percent}%</strong></div>
          <ProgressBar value={totals.percent} color="teal" />
          <div className="side-progress-bottom"><span>{totals.done.toLocaleString()} topics complete</span><span>{totals.total.toLocaleString()}</span></div>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-note-icon"><Sparkles size={15} /></div>
          <div><strong>Built for depth.</strong><p>Learn the why. Build the how. Prove the result.</p></div>
        </div>
        <div className="sidebar-footer"><span className="status-dot" /> <span>Progress stored on this device</span></div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
            <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={13} /><strong>{view === 'path-detail' ? selectedPath.title : NAV.find(n => n.id === view)?.label || 'Overview'}</strong></div>
          </div>
          <div className="topbar-actions">
            <div className="global-search"><Search size={15} /><input aria-label="Search the curriculum" value={search} onChange={e => { setSearch(e.target.value); if (e.target.value) setView('paths'); }} onKeyDown={handleSearchEnter} placeholder="Search 1,500+ topics..." /><kbd>↵</kbd></div>
            <div className="topbar-edition"><span className="edition-dot" /> 2026 EDITION</div>
            <div className="user-avatar" title="Learning workspace">C</div>
          </div>
        </header>

        <div className="page-content">
          {view === 'overview' && <Overview totals={totals} progress={progress} next={next} onOpenPath={openPath} onNavigate={navigate} onOpenProjects={() => navigate('projects')} />}
          {view === 'paths' && <PathsView paths={filteredPaths} progress={progress} search={search} setSearch={setSearch} area={pathArea} setArea={setPathArea} onOpenPath={openPath} />}
          {view === 'path-detail' && <PathDetail path={selectedPath} progress={progress} stats={selectedStats} onBack={() => navigate('paths')} onToggleTopic={toggleTopic} onSetModuleDone={setModuleDone} onMarkAll={markAllPath} expanded={expanded} toggleExpanded={toggleExpanded} moduleSearch={moduleSearch} setModuleSearch={setModuleSearch} showAllStages={showAllStages} setShowAllStages={setShowAllStages} />}
          {view === 'projects' && <ProjectsView projectProgress={projectProgress} setProjectProgress={setProjectProgress} filter={projectFilter} setFilter={setProjectFilter} />}
          {view === 'career' && <CareerView />}
          {view === 'resources' && <ResourcesView />}
        </div>
        <footer className="app-footer"><span>CloudPath Academy <i>·</i> A practical path from foundations to enterprise engineering</span><span>LEARN DEEPLY <b>·</b> BUILD RELIABLY <b>·</b> OPERATE RESPONSIBLY</span></footer>
      </main>
    </div>
  );
}

function Overview({ totals, progress, next, onOpenPath, onNavigate, onOpenProjects }: {
  totals: ProgressTotals;
  progress: ProgressState;
  next: NextModule | null;
  onOpenPath: (id: string) => void;
  onNavigate: (id: NavigationId) => void;
  onOpenProjects: () => void;
}) {
  const areaStats = Object.entries(AREA_META).map(([area, meta]) => ({ area, ...meta, count: roadmap.filter(p => p.area === area).length }));
  const featured = ['python', 'linux', 'networking', 'devops', 'aws', 'sre'].flatMap(id => {
    const path = roadmap.find(item => item.id === id);
    return path ? [path] : [];
  });
  return <>
    <section className="hero-panel">
      <div className="hero-grid" />
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> THE CLOUD ENGINEERING BLUEPRINT <span className="eyebrow-year">2026</span></div>
        <h1>Engineer your way<br /><em>to the cloud.</em></h1>
        <p className="hero-description">A complete learning system for building, securing, scaling and operating production infrastructure — from your first Linux command to enterprise architecture.</p>
        <div className="hero-actions"><button className="btn-primary" onClick={() => onOpenPath(next?.path.id || 'python')}>Continue learning <ArrowRight size={16} /></button><button className="btn-quiet" onClick={() => onNavigate('paths')}>Explore all paths <ArrowUpRight size={15} /></button></div>
        <div className="hero-proof"><span><CheckCircle2 size={14} /> 15 learning tracks</span><span><CheckCircle2 size={14} /> 1,500+ subtopics</span><span><CheckCircle2 size={14} /> 15 portfolio builds</span></div>
      </div>
      <div className="hero-visual">
        <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
        <div className="orbit-center"><div className="orbit-cloud"><Cloud size={43} strokeWidth={1.3} /></div><span>ENGINEER</span><strong>∞</strong></div>
        <div className="orbit-node node-aws"><span className="node-symbol">a</span><small>AWS</small></div>
        <div className="orbit-node node-k8s"><span className="node-symbol">K</span><small>K8S</small></div>
        <div className="orbit-node node-python"><span className="node-symbol">Py</span><small>PYTHON</small></div>
        <div className="orbit-node node-azure"><span className="node-symbol">A</span><small>AZURE</small></div>
        <div className="orbit-node node-gcp"><span className="node-symbol">G</span><small>GCP</small></div>
        <div className="visual-caption"><span className="pulse-point" /> SYSTEMS THINKING / PRODUCTION FIRST</div>
      </div>
      <div className="hero-bottom-line"><span>FOUNDATIONS</span><i /><span>PLATFORM</span><i /><span>RELIABILITY</span><i /><span>ARCHITECTURE</span></div>
    </section>

    <section className="stats-grid">
      <Stat icon={BookOpen} label="Learning tracks" value={CURRICULUM_TOTALS.tracks} meta="End-to-end disciplines" tone="violet" />
      <Stat icon={Layers3} label="Learning stages" value={CURRICULUM_TOTALS.stages} meta="Progressive milestones" tone="cyan" />
      <Stat icon={ListChecks} label="Topic modules" value={CURRICULUM_TOTALS.modules} meta="Deep-dive study units" tone="amber" />
      <Stat icon={Target} label="Subtopics" value={CURRICULUM_TOTALS.topics.toLocaleString()} meta="Track every competency" tone="green" />
    </section>

    <section className="section-block continue-section">
      <div className="section-heading"><div><div className="section-kicker">PICK UP WHERE YOU LEFT OFF</div><h2>Your next move<span>.</span></h2></div><button className="text-link" onClick={() => onNavigate('paths')}>View full roadmap <ArrowRight size={15} /></button></div>
      <div className="continue-card">
        <div className="continue-icon"><Zap size={21} /></div>
        <div className="continue-main"><div className="continue-label">RECOMMENDED NEXT MODULE <span>·</span> {next ? next.path.short : 'CURRICULUM COMPLETE'}</div><h3>{next ? next.module.title : 'All topics marked complete'}</h3><p>{next ? next.module.description : 'Revisit advanced labs, build new projects and validate your skills in production.'}</p><div className="continue-meta"><span><BookOpen size={13} /> {next?.path.title || 'All tracks'}</span><span><ListChecks size={13} /> {next ? `${next.done} of ${next.total} topics complete` : 'Mastery reached'}</span></div></div>
        <div className="continue-progress"><div className="continue-percent">{totals.percent}<small>%</small></div><ProgressBar value={totals.percent} color="teal" /><span>OVERALL MASTERY</span></div>
        <button className="continue-arrow" aria-label="Continue recommended module" onClick={() => onOpenPath(next?.path.id || 'python')}><ArrowUpRight size={20} /></button>
      </div>
    </section>

    <section className="section-block">
      <div className="section-heading"><div><div className="section-kicker">THE ENGINEERING STACK</div><h2>Learn in layers<span>.</span></h2><p className="section-subtitle">Each discipline builds on the last. Master fundamentals, then connect them into systems.</p></div><button className="text-link" onClick={() => onNavigate('paths')}>All 15 paths <ArrowRight size={15} /></button></div>
      <div className="path-card-grid">
        {featured.map((path, i) => <PathCard key={path.id} path={path} progress={progress} onClick={() => onOpenPath(path.id)} featuredIndex={i} />)}
      </div>
    </section>

    <section className="section-block career-preview">
      <div className="section-heading"><div><div className="section-kicker">THE LONG GAME</div><h2>From engineer to architect<span>.</span></h2><p className="section-subtitle">Build production ownership first. Seniority grows through judgment, impact and leadership.</p></div><button className="text-link" onClick={() => onNavigate('career')}>Explore career map <ArrowRight size={15} /></button></div>
      <div className="career-rail">
        {CAREER.map((step, i) => <div className="career-stop" key={step.id}><div className={`career-dot dot-${i}`}><span>{String(i + 1).padStart(2, '0')}</span></div><div className="career-stop-title">{step.name}</div><div className="career-stop-time">{step.window}</div></div>)}
      </div>
      <div className="career-note"><ShieldCheck size={16} /><span>Timelines are planning estimates, not hiring guarantees. Real senior roles require demonstrated production experience and technical ownership.</span></div>
    </section>

    <section className="section-block project-preview-section">
      <div className="section-heading"><div><div className="section-kicker">PROVE WHAT YOU KNOW</div><h2>Build things that matter<span>.</span></h2><p className="section-subtitle">A strong portfolio shows architecture, implementation, security, operations and measurable verification.</p></div><button className="text-link" onClick={onOpenProjects}>Explore project portfolio <ArrowRight size={15} /></button></div>
      <div className="project-mini-grid">
        {[PROJECTS[2], PROJECTS[4], PROJECTS[8], PROJECTS[13]].map((project, i) => <div className="project-mini" key={project.id}><div className={`project-mini-number num-${i}`}>0{i + 1}</div><div className="project-mini-role">{project.role}</div><h3>{project.name}</h3><p>{project.summary}</p><div className="mini-stack">{project.stack.slice(0, 3).map(t => <span key={t}>{t}</span>)}</div></div>)}
      </div>
    </section>

    <section className="section-block system-callout"><div className="callout-icon"><Gauge size={22} /></div><div><div className="section-kicker">THE MASTERY STANDARD</div><h3>Know it. Build it. Break it. Explain it.</h3><p>Mark a subtopic complete only after you can explain the concept, implement it without following a tutorial, and diagnose a realistic failure. The checklist is a proof system, not a video-watching tracker.</p></div><button className="btn-secondary" onClick={() => onNavigate('resources')}>Study system <ArrowRight size={15} /></button></section>
  </>;
}

function Stat({ icon: Icon, label, value, meta, tone }: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  meta: string;
  tone: string;
}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div className="stat-content"><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-meta">{meta}</div></div><div className={`stat-spark ${tone}`}><span /><span /><span /><span /><span /><span /></div></div>; }

function PathCard({ path, progress, onClick, featuredIndex }: {
  path: RoadmapPath;
  progress: ProgressState;
  onClick: () => void;
  featuredIndex: number;
}) {
  const stats = pathDone(path, progress); const meta = AREA_META[path.area] || AREA_META['Engineering foundations'];
  return <button className="path-card" onClick={onClick}>
    <div className="path-card-top"><div className={`path-card-icon ${meta.color}`}><IconForPath path={path} size={21} /></div><div className="path-card-number">{meta.number}.{String(featuredIndex + 1).padStart(2, '0')}</div><ArrowUpRight size={17} className="path-card-arrow" /></div>
    <div className="path-card-area">{path.area.toUpperCase()}</div><h3>{path.title}</h3><p>{path.short}</p>
    <div className="path-card-bottom"><span>{path.stages.length} stages <i>·</i> {path.stages.reduce((a,s)=>a+s.modules.length,0)} modules</span><strong>{stats.percent}%</strong></div>
    <ProgressBar value={stats.percent} color={meta.color} />
  </button>;
}

function PathsView({ paths, progress, search, setSearch, area, setArea, onOpenPath }: {
  paths: RoadmapPath[];
  progress: ProgressState;
  search: string;
  setSearch: (value: string) => void;
  area: string;
  setArea: (value: string) => void;
  onOpenPath: (id: string) => void;
}) {
  const areas = ['All paths', ...new Set(roadmap.map(p => p.area))];
  const groups = areas.slice(1).map(a => ({ name: a, paths: paths.filter(p => p.area === a) })).filter(g => g.paths.length);
  return <>
    <PageIntro kicker="THE FULL CURRICULUM" title="Learning paths" subtitle="Fifteen connected disciplines. Hundreds of modules. A deliberate path from engineering fundamentals to principal-level architecture." />
    <div className="curriculum-summary"><div><strong>01 — 15</strong><span>LEARNING TRACKS</span></div><div><strong>{CURRICULUM_TOTALS.stages}</strong><span>STAGES</span></div><div><strong>{CURRICULUM_TOTALS.modules}</strong><span>MODULES</span></div><div><strong>{CURRICULUM_TOTALS.topics.toLocaleString()}</strong><span>SUBTOPICS</span></div><div className="curriculum-total-progress"><span>YOUR MASTERY</span><strong>{allTotals(progress).percent}%</strong><ProgressBar value={allTotals(progress).percent} color="teal" /></div></div>
    <div className="path-toolbar"><div className="toolbar-search"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search paths, modules, technologies, topics..." /><kbd>⌘ K</kbd></div><div className="filter-wrap"><span>FILTER BY</span><select value={area} onChange={e => setArea(e.target.value)}>{areas.map(a => <option key={a}>{a}</option>)}</select></div><span className="result-count">{paths.length} {paths.length === 1 ? 'path' : 'paths'}</span></div>
    {groups.length === 0 && <div className="empty-state"><Search size={24} /><h3>No learning paths found</h3><p>Try another keyword or remove your area filter.</p><button className="btn-secondary" onClick={() => { setSearch(''); setArea('All paths'); }}>Clear filters</button></div>}
    <div className="all-path-groups">{groups.map((group, gi) => <section className="path-group" key={group.name}><div className="group-title-row"><div><span className="group-index">{String(gi + 1).padStart(2, '0')}</span><h2>{group.name}</h2></div><span>{group.paths.length} {group.paths.length === 1 ? 'track' : 'tracks'}</span></div><div className="path-card-grid all-path-grid">{group.paths.map((path, i) => <PathCard key={path.id} path={path} progress={progress} onClick={() => onOpenPath(path.id)} featuredIndex={i} />)}</div></section>)}</div>
  </>;
}

function PageIntro({ kicker, title, subtitle, action }: {
  kicker: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) { return <div className="page-intro"><div><div className="section-kicker">{kicker}</div><h1>{title}<span>.</span></h1><p>{subtitle}</p></div>{action}</div>; }

function PathDetail({ path, progress, stats, onBack, onToggleTopic, onSetModuleDone, onMarkAll, expanded, toggleExpanded, moduleSearch, setModuleSearch, showAllStages, setShowAllStages }: {
  path: RoadmapPath;
  progress: ProgressState;
  stats: PathProgress;
  onBack: () => void;
  onToggleTopic: (taskId: string) => void;
  onSetModuleDone: (path: RoadmapPath, stageIndex: number, moduleIndex: number, value: boolean) => void;
  onMarkAll: (path: RoadmapPath, value: boolean) => void;
  expanded: ExpandedState;
  toggleExpanded: (key: string) => void;
  moduleSearch: string;
  setModuleSearch: (value: string) => void;
  showAllStages: boolean;
  setShowAllStages: (value: boolean) => void;
}) {
  const meta = AREA_META[path.area] || AREA_META['Engineering foundations'];
  const matching = moduleSearch.trim().toLowerCase();
  const modulesVisible = path.stages.reduce((n, s) => n + s.modules.filter(m => !matching || `${m.title} ${m.description} ${m.topics.join(' ')}`.toLowerCase().includes(matching)).length, 0);
  return <>
    <button className="back-link" onClick={onBack}><ArrowLeft size={15} /> All learning paths</button>
    <section className={`path-detail-hero ${meta.color}`}>
      <div className="detail-hero-content"><div className="detail-eyebrow"><span className={`detail-icon ${meta.color}`}><IconForPath path={path} size={18} /></span>{path.area.toUpperCase()} <i>/</i> {path.level.toUpperCase()}</div><h1>{path.title}<span>.</span></h1><p>{path.description}</p><div className="detail-outcome"><Target size={15} /><span>{path.outcome}</span></div><div className="detail-meta"><span><Layers3 size={14} /> {path.stages.length} stages</span><span><BookOpen size={14} /> {path.stages.reduce((a,s)=>a+s.modules.length,0)} modules</span><span><Clock size={14} /> {path.time}</span></div></div>
      <div className="detail-progress-card"><div className="detail-progress-label">PATH MASTERY</div><div className="detail-progress-value">{stats.percent}<small>%</small></div><ProgressBar value={stats.percent} color="teal" height="9px" /><div className="detail-progress-count">{stats.done.toLocaleString()} <span>/</span> {stats.total.toLocaleString()} subtopics</div><div className="detail-progress-bottom"><Badge tone={stats.percent === 100 ? 'success' : 'info'}>{stats.percent === 100 ? 'Completed' : 'In progress'}</Badge><button onClick={() => onMarkAll(path, stats.percent !== 100)}>{stats.percent === 100 ? 'Reset path' : 'Mark all done'}</button></div></div>
      <div className="detail-hero-grid" />
    </section>
    <div className="path-detail-toolbar"><div className="toolbar-search module-toolbar-search"><Search size={15} /><input value={moduleSearch} onChange={e => setModuleSearch(e.target.value)} placeholder="Find a module or subtopic in this path..." /></div><div className="stage-toolbar-actions"><span>{modulesVisible} modules visible</span><button className="text-link" onClick={() => setShowAllStages(!showAllStages)}>{showAllStages ? 'Collapse stages' : 'Expand stages'} <ChevronDown size={14} /></button></div></div>
    <div className="stage-list">{path.stages.map((stage, si) => {
      const stageTotal = stage.modules.reduce((n,m)=>n+m.topics.length,0);
      let stageDone = 0; stage.modules.forEach((mod,mi)=>mod.topics.forEach((_,ti)=>{ if(progress[slugTask(path.id,si,mi,ti)]) stageDone += 1; }));
      const stageKey = `${path.id}:stage:${si}`; const stageOpen = showAllStages || expanded[stageKey] || (matching && stage.modules.some(m => `${m.title} ${m.topics.join(' ')}`.toLowerCase().includes(matching)));
      const filteredModules = stage.modules.map((m,mi)=>({m,mi})).filter(({m})=>!matching||`${m.title} ${m.description} ${m.topics.join(' ')}`.toLowerCase().includes(matching));
      return <section className={`stage-card ${stageOpen ? 'stage-open' : ''}`} key={stage.title}>
        <button className="stage-header" onClick={() => toggleExpanded(stageKey)}><div className="stage-header-left"><div className="stage-number">{String(si+1).padStart(2,'0')}</div><div className="stage-name-wrap"><div className="stage-overline">STAGE {String(si+1).padStart(2,'0')} <span>·</span> {percent(stageDone,stageTotal)}% COMPLETE</div><h2>{stage.title}</h2><p>{stage.focus}</p></div></div><div className="stage-right"><div className="stage-count"><strong>{stageDone}</strong><span> / {stageTotal} topics</span></div><ProgressBar value={percent(stageDone,stageTotal)} color={meta.color} /><ChevronDown className={`stage-chevron ${stageOpen ? 'rotated' : ''}`} size={18} /></div></button>
        {stageOpen && <div className="stage-body">{filteredModules.map(({m,mi})=>{
          const moduleKey = `${path.id}:module:${si}:${mi}`; const moduleOpen = expanded[moduleKey] || showAllStages || (matching && `${m.title} ${m.topics.join(' ')}`.toLowerCase().includes(matching));
          const doneCount = m.topics.filter((_,ti)=>progress[slugTask(path.id,si,mi,ti)]).length;
          const modulePct = percent(doneCount,m.topics.length);
          return <article className="module-card" key={m.title}><button className="module-header" onClick={() => toggleExpanded(moduleKey)}><div className="module-header-main"><span className={`module-check ${modulePct===100?'completed':''}`}>{modulePct===100?<Check size={13}/>:<span />}</span><div><h3>{m.title}</h3><p>{m.description}</p></div></div><div className="module-header-right"><span className="module-topic-count">{doneCount}/{m.topics.length}</span><div className="module-mini-track"><span style={{width:`${modulePct}%`}} /></div><ChevronDown size={16} className={moduleOpen?'rotated':''} /></div></button>
            {moduleOpen && <div className="module-content"><div className="topic-list-label">TOPIC CHECKLIST <span>·</span> Tick after you can explain, implement and troubleshoot it</div><div className="topic-grid">{m.topics.map((topic,ti)=>{const id=slugTask(path.id,si,mi,ti); const checked=!!progress[id]; return <label className={`topic-item ${checked?'topic-done':''}`} key={topic}><input type="checkbox" checked={checked} onChange={()=>onToggleTopic(id)} /><span className="custom-check">{checked&&<Check size={11}/>}</span><span>{topic}</span></label>;})}</div>
              <div className="module-proof-grid"><div className="module-proof"><span className="proof-label"><Terminal size={12}/> PRACTICAL LAB</span><p>{m.lab}</p></div><div className="module-proof"><span className="proof-label"><Target size={12}/> MASTERY GATE</span><p>{m.gate}</p></div></div>
              <div className="module-footer"><span>{modulePct===100?'All subtopics checked':`${m.topics.length-doneCount} topics remaining`}</span><button onClick={()=>onSetModuleDone(path,si,mi,modulePct!==100)}>{modulePct===100?'Undo module completion':'Mark module complete'} <CheckCircle2 size={13}/></button></div>
            </div>}
          </article>;
        })}{filteredModules.length===0&&<div className="no-module-results">No modules match “{moduleSearch}” in this stage.</div>}</div>}
      </section>;
    })}</div>
    {modulesVisible === 0 && <div className="empty-state path-empty"><Search size={22}/><h3>No modules match that search</h3><p>Try another keyword or clear the module search.</p><button className="btn-secondary" onClick={() => setModuleSearch('')}>Clear module search</button></div>}
    <div className="path-end-card"><div className="path-end-icon"><Award size={21}/></div><div><h3>What mastery looks like</h3><p>Completion means you have studied the concepts, completed the labs and can explain the trade-offs. Use the portfolio track to turn the learning into evidence a hiring team can review.</p></div><button className="btn-secondary" onClick={onBack}>Back to all paths <ArrowRight size={14}/></button></div>
  </>;
}

function ProjectsView({ projectProgress, setProjectProgress, filter, setFilter }: {
  projectProgress: ProgressState;
  setProjectProgress: React.Dispatch<React.SetStateAction<ProgressState>>;
  filter: string;
  setFilter: (value: string) => void;
}) {
  const filters = ['All','Foundation','Intermediate','Advanced','Enterprise','Principal'];
  const visible = PROJECTS.filter(p=>filter==='All'||p.level===filter);
  const done = PROJECTS.filter(p=>projectProgress[p.id]).length;
  return <>
    <PageIntro kicker="THE PROOF OF YOUR SKILL" title="Portfolio projects" subtitle="Build complete engineering systems. Every project should include architecture, IaC, security, tests, monitoring, cost assumptions and recovery evidence." action={<div className="project-completion"><strong>{done}/{PROJECTS.length}</strong><span>PROJECTS SHIPPED</span></div>} />
    <div className="project-guide"><div className="project-guide-icon"><Briefcase size={20}/></div><div><strong>Portfolio quality bar</strong><p>A GitHub repository is not enough. Make each project independently reviewable: state the problem, draw the architecture, show the implementation, prove the tests and explain what happens when it fails.</p></div><div className="project-guide-stats"><span>15</span><small>CAPSTONE IDEAS</small></div></div>
    <div className="project-filter-row"><div className="filter-pills">{filters.map(f=><button className={filter===f?'selected':''} key={f} onClick={()=>setFilter(f)}>{f}</button>)}</div><span>{visible.length} project ideas</span></div>
    <div className="project-grid">{visible.map((p,i)=>{const complete=!!projectProgress[p.id];return <article className={`project-card ${complete?'project-done':''}`} key={p.id}><div className="project-card-top"><div className={`project-level level-${p.level.toLowerCase()}`}>{p.level.toUpperCase()}</div><button className={`project-mark ${complete?'marked':''}`} onClick={()=>setProjectProgress(old=>({...old,[p.id]:!old[p.id]}))}>{complete?<><Check size={13}/> SHIPPED</>:<><Circle size={13}/> MARK SHIPPED</>}</button></div><div className="project-card-index">PROJECT {String(PROJECTS.findIndex(x=>x.id===p.id)+1).padStart(2,'0')}</div><h3>{p.name}</h3><div className="project-role"><Target size={13}/>{p.role}</div><p className="project-summary">{p.summary}</p><div className="project-stack">{p.stack.map(s=><span key={s}>{s}</span>)}</div><div className="project-proof"><div className="proof-label">ACCEPTANCE CHECKLIST</div>{p.proof.map(item=><div className="project-proof-item" key={item}><CheckCircle2 size={13}/><span>{item}</span></div>)}</div><button className="project-ship-button" onClick={()=>setProjectProgress(old=>({...old,[p.id]:!old[p.id]}))}>{complete?'Reopen project':'Mark project shipped'} <ArrowRight size={14}/></button></article>;})}</div>
    <div className="portfolio-standard"><div className="standard-title"><ShieldCheck size={17}/> Every serious project should contain</div><div className="standard-grid">{['Problem statement & business requirements','Architecture diagrams (HLD / LLD)','Infrastructure as Code','Application source code','Automated CI/CD and tests','Security controls and threat model','Monitoring, logs and traces','Cost estimate and capacity plan','Failure scenarios and recovery','Deployment and troubleshooting guide','Architecture Decision Records','Lessons learned and next steps'].map(s=><span key={s}><Check size={13}/>{s}</span>)}</div></div>
  </>;
}

function CareerView() {
  const [open, setOpen] = useState('foundation');
  return <>
    <PageIntro kicker="CAREER PROGRESSION" title="From first principles to principal." subtitle="A realistic growth map across six stages. Move forward when you can demonstrate ownership and results—not just when a calendar estimate expires." />
    <div className="career-disclaimer"><ShieldCheck size={17}/><p><strong>Important:</strong> These windows are planning estimates from the supplied roadmap. They are not guaranteed promotion timelines or job outcomes. Senior and principal roles require real production experience, judgment, communication and technical leadership.</p></div>
    <div className="career-timeline">{CAREER.map((step,i)=><div className={`career-stage-card ${open===step.id?'career-stage-open':''}`} key={step.id}><button className="career-stage-head" onClick={()=>setOpen(open===step.id?'':step.id)}><div className={`career-stage-number stage-num-${i}`}>{String(i+1).padStart(2,'0')}</div><div className="career-stage-main"><div className="career-stage-kicker">STAGE {i+1} <span>·</span> {step.window}</div><h2>{step.name}</h2><p>{step.roles}</p></div><div className="career-stage-chevron"><ChevronDown size={18}/></div></button><div className="career-stage-summary">{step.desc}</div>{open===step.id&&<div className="career-stage-details"><div className="career-check-title">READINESS EVIDENCE <span>·</span> What you should be able to demonstrate</div><div className="career-check-grid">{step.checks.map(c=><div key={c}><CheckCircle2 size={15}/><span>{c}</span></div>)}</div>{i===4&&<div className="senior-note"><strong>Senior is not a certification level.</strong> Build evidence through production ownership, migration experience, incident leadership, cost and capacity decisions, and designs that other teams successfully operate.</div>}</div>}</div>)}</div>
    <div className="section-block career-plan-section"><div className="section-heading"><div><div className="section-kicker">ILLUSTRATIVE MASTER SCHEDULE</div><h2>A 36-month learning sequence<span>.</span></h2><p className="section-subtitle">The supplied roadmap frames this as an intensive plan at approximately 25–30 focused hours per week. Start applying for junior roles earlier when your evidence is ready.</p></div></div><div className="study-plan-grid">{STUDY_PLAN.map((item,i)=><div className="study-plan-row" key={item[0]}><span className="study-plan-month">{item[0]}</span><div><strong>{item[1]}</strong><p>{item[2]}</p></div><span className="study-plan-index">{String(i+1).padStart(2,'0')}</span></div>)}</div></div>
    <div className="section-block accelerated-plan-section"><div className="section-heading"><div><div className="section-kicker">ADVANCED EXECUTION BLUEPRINT</div><h2>A 15-month intensive track<span>.</span></h2><p className="section-subtitle">This is the compressed technical blueprint from the supplied advanced roadmap. Treat it as a stretch plan, not a shortcut to seniority.</p></div><Badge tone="orange">HIGH INTENSITY</Badge></div><div className="accelerated-plan-list">{ACCEL_PLAN.map((item,i)=><div className="accelerated-row" key={item[0]}><div className="accelerated-month">{item[0]}</div><div className="accelerated-main"><strong>{item[1]}</strong><p>{item[2]}</p><div className="accelerated-proof"><CheckCircle2 size={13}/><span>{item[3]}</span></div></div><div className="accelerated-role">{item[4]}</div></div>)}</div></div>
    <div className="senior-signal-panel"><div><div className="section-kicker">WHAT THE MARKET REWARDS</div><h2>Move beyond tool familiarity<span>.</span></h2><p>High-value engineering comes from taking responsibility for outcomes: diagnosing production failures, choosing appropriate architectures, reducing risk and cost, and explaining decisions to teams and business stakeholders.</p></div><div className="senior-signal-grid">{[['Production troubleshooting','Diagnose distributed failures with evidence.'],['Architecture judgment','Choose a design and defend its trade-offs.'],['Security ownership','Own identity, data protection and threat models.'],['Reliability engineering','Set service objectives and recover safely.'],['Cost engineering','Improve unit economics without harming service.'],['Business communication','Translate business needs into technical decisions.']].map(([title,body])=><div key={title}><CheckCircle2 size={14}/><strong>{title}</strong><span>{body}</span></div>)}</div></div>
    <div className="role-readiness"><div className="section-kicker">ROLE EMPHASIS</div><h2>Different roles, shared foundations<span>.</span></h2><div className="role-table-wrap"><table className="role-table"><thead><tr><th>Capability</th><th>Cloud engineer</th><th>DevOps / platform</th><th>SRE</th><th>Cloud architect</th></tr></thead><tbody>{[['Linux','Advanced','Advanced','Advanced','Strong'],['Networking','Advanced','Strong','Advanced','Expert'],['Python','Strong','Strong','Strong','Strong'],['SQL / data','Intermediate','Intermediate','Intermediate','Strong'],['Cloud platforms','Strong','Strong','Strong','Expert'],['Docker / Kubernetes','Strong','Expert','Expert','Expert'],['Terraform / IaC','Expert','Expert','Strong','Expert'],['CI/CD','Strong','Expert','Strong','Strong'],['Observability','Strong','Expert','Expert','Expert'],['Distributed systems','Strong','Strong','Expert','Expert'],['Security','Strong','Strong','Strong','Expert'],['Business strategy','Basic','Basic','Intermediate','Expert']].map(row=><tr key={row[0]}>{row.map((cell,i)=><td key={i}>{i===0?<strong>{cell}</strong>:<span className={`skill-level skill-${cell.toLowerCase()}`}>{cell}</span>}</td>)}</tr>)}</tbody></table></div></div>
  </>;
}

function ResourcesView() {
  return <>
    <PageIntro kicker="STUDY SYSTEM & REFERENCES" title="Learn with intent." subtitle="Use official documentation to validate what you build. Pair reading with labs, troubleshooting, design notes and weekly review." />
    <div className="study-grid"><div className="study-card study-main-card"><div className="study-card-kicker">A WEEKLY ENGINEERING RHYTHM</div><h2>Study like an engineer,<br/><em>not a content consumer.</em></h2><p>Use a repeatable loop. Study enough to form a model, build something, deliberately test failure and write down what you learned.</p><div className="study-rhythm">{[['01','Concepts','Read docs and take structured notes.'],['02','Implementation','Build a small lab without copying a finished solution.'],['03','Troubleshooting','Inject a failure and collect evidence.'],['04','Reflection','Write a design note, runbook or architecture decision.']].map(x=><div className="rhythm-step" key={x[0]}><span>{x[0]}</span><div><strong>{x[1]}</strong><small>{x[2]}</small></div></div>)}</div></div><div className="study-card study-time-card"><div className="study-card-kicker">SAMPLE STUDY BLOCK</div><div className="time-figure">3–4<small>HRS / DAY</small></div><p>One possible focused routine for a full-time learner. Adapt it to work, family and energy.</p><div className="time-breakdown"><div><span>Concepts & docs</span><strong>60 min</strong></div><div><span>Coding / automation</span><strong>60 min</strong></div><div><span>Project or lab</span><strong>60 min</strong></div><div><span>Review & notes</span><strong>30 min</strong></div></div></div></div>
    <div className="study-note"><Clock size={15}/><span>The full roadmap's 36-month plan assumes roughly 25–30 focused hours per week. A separate 15-month blueprint is an intensive stretch plan. Adjust the pace to your starting point and available time.</span></div>
    <div className="weekly-hours-panel"><div className="weekly-hours-heading"><div><div className="section-kicker">A BALANCED WEEK</div><strong>Suggested 29-hour allocation</strong></div><Badge tone="info">25–30 HRS / WEEK</Badge></div><div className="weekly-hours-grid">{[['Cloud platform learning','7h'],['Linux & networking','4h'],['Programming','4h'],['DevOps & automation','4h'],['SQL & DSA','3h'],['Projects','5h'],['Revision & interviews','2h']].map(([label,hours],i)=><div key={label}><span className={`weekly-bar bar-${i}`}></span><span>{label}</span><strong>{hours}</strong></div>)}</div></div>
    <div className="section-heading resource-heading"><div><div className="section-kicker">OFFICIAL DOCUMENTATION FIRST</div><h2>Reference library<span>.</span></h2><p className="section-subtitle">Courses can organize your learning. Official docs and hands-on labs should verify it.</p></div></div>
    <div className="resource-grid">{RESOURCES.map(group=><div className="resource-card" key={group.group}><h3>{group.group}</h3><div>{group.links.map(([name,url])=><a href={url} target="_blank" rel="noreferrer" key={name}><span>{name}</span><ExternalLink size={14}/></a>)}</div></div>)}</div>
    <div className="certification-panel"><div><div className="section-kicker">CERTIFICATIONS ARE SUPPORTING EVIDENCE</div><h2>Use credentials strategically<span>.</span></h2><p>Start with one relevant associate-level credential after building hands-on fluency. Professional-level credentials are most valuable when backed by real project and production experience. Verify exam names and blueprints with the issuing provider before booking.</p></div><div className="certification-tags"><Badge tone="orange">AWS Solutions Architect</Badge><Badge tone="orange">AWS CloudOps</Badge><Badge tone="blue">Google Associate Cloud Engineer</Badge><Badge tone="blue">Google Professional Cloud Architect</Badge><Badge tone="violet">Azure Administrator AZ-104</Badge><Badge tone="violet">Azure Solutions Architect AZ-305</Badge></div></div>
  </>;
}
