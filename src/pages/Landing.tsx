import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut } from '@insforge/react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Footer from '@/components/layout/Footer';
import PlacifyLogo from '@/components/ui/PlacifyLogo';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase, FileText, Users, MessageSquare, Code2, Sparkles,
  ArrowRight, CheckCircle, Star, Sun, Moon,
  TrendingUp, Trophy, Percent, ChevronDown, HelpCircle,
  AlertCircle, Play, RefreshCw, Award, ShieldAlert, Cpu, Terminal
} from 'lucide-react';

// Recruiting Partners data
const PARTNERS = [
  { name: 'Google', color: 'text-blue-500 hover:text-blue-600', icon: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.357-2.89-6.357-6.457S10.483 5.6 13.99 5.6c1.512 0 2.9.55 3.97 1.587l3.075-3.075C19.18 2.3 16.74 1.1 13.99 1.1 7.9 1.1 3 6 3 12.057s4.9 10.957 10.99 10.957c6.357 0 10.57-4.47 10.57-10.757 0-.728-.08-1.428-.22-1.97H12.24z"/>
    </svg>
  )},
  { name: 'Microsoft', color: 'text-sky-500 hover:text-sky-600', icon: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M0 0h11v11H0zM13 0h11v11H13zM0 13h11v24H0zM13 13h11v24H13z"/>
    </svg>
  )},
  { name: 'Amazon', color: 'text-amber-500 hover:text-amber-600', icon: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M15.22 17.51c-1.95 1.34-4.8 2.02-7.39 2.02-3.66 0-6.91-1.34-8.83-3.6-.22-.27-.03-.55.28-.37 2.14 1.22 5.02 1.95 7.91 1.95 2.22 0 4.79-.52 6.64-1.63.38-.23.63.09.28.43l-.89 1.2zM23.68 18c-.29-.22-.92-.1-1.28.07-1.12.55-2.84 1.34-4.83.67-.34-.11-.53-.43-.37-.8.53-1.18 1.95-3.15 1.44-5.18-.32-1.29-1.57-2.03-2.92-2.14-1.74-.14-3.4.75-4.22 1.91-.25.35-.04.66.27.48.96-.58 2.05-1.07 3.25-.97.8.07 1.63.48 1.83 1.29.35 1.45-1.24 3.73-2.06 4.93-.24.35-.55.45-.85.22-1.77-1.34-2.88-2.3-4.57-4.04-.25-.26-.64-.09-.59.27.34 2.37.95 5.25 2.16 7.42.19.34.5.38.77.1 1.2-1.23 2.51-2.94 4.02-3.41 1.4-.44 2.87.1 3.84.99.36.33.64.38.83.1 1.05-1.52 2.3-2.97 3.51-4.38.25-.29.41-.69.05-.98l-.05-.02z"/>
    </svg>
  )},
  { name: 'Atlassian', color: 'text-blue-600 hover:text-blue-700', icon: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12.067 0C9.697 0 7.842 1.306 6.945 3.328c-.896 2.023-.424 4.298 1.157 5.753l3.52 3.238c.61.56.96 1.342.96 2.167 0 1.638-1.368 2.97-3.048 2.97a3.047 3.047 0 01-2.909-2.115c-.475-1.464-1.89-2.42-3.468-2.29-1.577.13-2.776 1.328-2.906 2.871C.115 17.587 1.094 19.333 2.7 19.897l7.525 2.645A6.082 6.082 0 0012.3 23c2.404 0 4.316-1.348 5.213-3.37.896-2.022.424-4.298-1.157-5.753l-3.52-3.238c-.61-.56-.96-1.342-.96-2.167 0-1.638 1.368-2.97 3.048-2.97a3.047 3.047 0 012.909 2.115c.475 1.464 1.89 2.42 3.468 2.29 1.577-.13 2.776-1.328 2.906-2.871.137-1.666-.842-3.412-2.448-3.976l-7.525-2.645A6.082 6.082 0 0012.067 0z"/>
    </svg>
  )},
  { name: 'Stripe', color: 'text-purple-600 hover:text-purple-700', icon: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M13.962 8.793c0-2.42-1.353-3.64-3.652-3.64-2.222 0-3.674 1.1-3.674 3.02 0 3.07 4.14 2.58 4.14 4.54 0 1.05-.9 1.54-1.996 1.54-1.474 0-2.398-.67-2.398-1.74v-.08H3.594v.13c0 2.72 1.624 3.99 4.372 3.99 2.41 0 3.957-1.16 3.957-3.1 0-3.17-4.14-2.67-4.14-4.63 0-.84.72-1.25 1.76-1.25 1.18 0 1.9.47 1.91 1.39v.08h2.519v-.18zM19.16 3h-2.52v3.08h-1.636V8.12h1.636v8.28c0 1.83.987 2.82 2.777 2.82.72 0 1.258-.08 1.636-.21v-2.09c-.29.07-.638.1-1.006.1-.73 0-1.103-.35-1.103-1.15V8.12h2.109V6.08H19.16V3z"/>
    </svg>
  )}
];

// Testimonials Data
const TESTIMONIALS = [
  {
    quote: "Placify completely overhauled our placement process. The ATS feedback helped me fix critical points in my resume, which ultimately got me an interview and offer at Google.",
    name: "Aditya Verma",
    role: "SDE Intern @ Google",
    rating: 5,
    avatar: "AV",
    gradient: "from-blue-500/10 to-cyan-500/10"
  },
  {
    quote: "As a student coordinator, managing 400+ applications was a nightmare. Placify's Smart Eligibility checker filtered candidates in one click, saving weeks of manual validation.",
    name: "Sneha Patel",
    role: "Placement Advisor @ CSE",
    rating: 5,
    avatar: "SP",
    gradient: "from-purple-500/10 to-pink-500/10"
  },
  {
    quote: "The Code Simulator sandbox lets me test questions directly corresponding to the company's past tests. The progress tracking made me cover sheets methodically.",
    name: "Rohan Das",
    role: "Graduate Analyst @ Atlassian",
    rating: 5,
    avatar: "RD",
    gradient: "from-emerald-500/10 to-teal-500/10"
  }
];

// FAQ items
const FAQS_LIST = [
  {
    q: "How does the AI Resume Grader evaluate my score?",
    a: "Our system parses your resume layout, syntax, and phrasing dynamically using NLP models. It matches your terms against actual job profiles to compute keyword density and formatting layout compliance, then recommends items you should append to stand out."
  },
  {
    q: "What variables govern the eligibility constraints?",
    a: "Placement admins seed structural requirements (minimum CGPA, allowed academic branches, and maximum allowable active backlogs). When a student views the portal, the eligibility rules engine cross-references these schemas with their profile in real time."
  },
  {
    q: "Can recruiters search candidates using natural language?",
    a: "Yes! Recruiters have access to the 'AI Student Explorer' engine, allowing them to search terms like 'React developer with 8+ CGPA and database experience'. Our semantic engine ranks candidates instantly based on scoring metrics."
  },
  {
    q: "Is the Code Simulator executing code securely?",
    a: "Absolutely. Code execution requests are passed securely to sandboxed execution environments, where input test cases run safely. We execute C++, Java, JavaScript, and Python seamlessly, keeping history records in your profile."
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden font-body selection:bg-primary/20">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-scroll {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
        .animate-marquee-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Modern Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Floating Gradient Blobs */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute top-[30%] right-1/4 w-[350px] h-[350px] bg-accent/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Navbar Header */}
      <header className="fixed top-0 inset-x-0 z-50 border-b bg-background/80 backdrop-blur-lg transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlacifyLogo iconClassName="w-8 h-8 text-primary" textClassName="h-5" />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </Button>
            <SignedOut>
              <Link to="/auth">
                <Button variant="ghost" className="rounded-xl font-semibold">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button className="rounded-xl font-semibold shadow-md shadow-primary/20">
                  Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Button onClick={() => navigate('/dashboard')} className="rounded-xl font-semibold shadow-md shadow-primary/20">
                Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Content */}
          <div className="lg:col-span-5 text-center lg:text-left space-y-6">
            <Badge variant="outline" className="px-4 py-1.5 border-primary/30 bg-primary/5 text-primary text-xs font-semibold inline-flex items-center gap-1.5 backdrop-blur-md rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              AI-Powered Career & Placement Suite
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold leading-[1.12] tracking-tight text-foreground">
              Your Bridge to <br />
              <span className="text-gradient">Career Placement</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
              The unified placement ecosystem linking ambitious students, placement cells, alumni networks, and top recruiters. Elevate your portfolio, pass evaluations, and lock career success.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start">
              <SignedOut>
                <Link to="/auth">
                  <Button size="lg" className="w-full sm:w-auto text-base px-8 py-6 rounded-xl shadow-lg shadow-primary/25 font-semibold">
                    Start Preparing Now <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Button size="lg" onClick={() => navigate('/dashboard')} className="w-full sm:w-auto text-base px-8 py-6 rounded-xl shadow-lg shadow-primary/25 font-semibold">
                  Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </SignedIn>
              
              <a href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-6 py-6 rounded-xl font-semibold bg-background/50 backdrop-blur-sm">
                  Explore Features
                </Button>
              </a>
            </div>

            {/* Quick stats tags */}
            <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 border-t border-muted/50">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-xs font-semibold text-muted-foreground">ATS Resumes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-xs font-semibold text-muted-foreground">Live Eligibility Check</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-xs font-semibold text-muted-foreground">Coding Simulator</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Sandbox (ShowcasePlayground) */}
          <div className="lg:col-span-7 w-full">
            <ShowcasePlayground />
          </div>
        </div>
      </section>

      {/* Infinite Logo Marquee */}
      <section className="py-8 border-y bg-muted/20 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
            Leading companies hiring through our placement network
          </p>

          <div className="overflow-hidden">
            <div className="animate-marquee-scroll flex items-center gap-16 select-none">
              {/* First Set */}
              {PARTNERS.map((p, idx) => (
                <div key={`logo-1-${idx}`} className={`flex items-center gap-2.5 font-heading font-bold text-lg grayscale hover:grayscale-0 transition-all duration-300 ${p.color}`}>
                  {p.icon}
                  <span>{p.name}</span>
                </div>
              ))}
              {/* Second Set (Seamless Scroll) */}
              {PARTNERS.map((p, idx) => (
                <div key={`logo-2-${idx}`} className={`flex items-center gap-2.5 font-heading font-bold text-lg grayscale hover:grayscale-0 transition-all duration-300 ${p.color}`}>
                  {p.icon}
                  <span>{p.name}</span>
                </div>
              ))}
              {/* Third Set */}
              {PARTNERS.map((p, idx) => (
                <div key={`logo-3-${idx}`} className={`flex items-center gap-2.5 font-heading font-bold text-lg grayscale hover:grayscale-0 transition-all duration-300 ${p.color}`}>
                  {p.icon}
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border bg-card/40 backdrop-blur-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-heading font-extrabold text-foreground">96.4%</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Placement Rate</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border bg-card/40 backdrop-blur-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-heading font-extrabold text-foreground">₹48.2 LPA</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Highest Package</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border bg-card/40 backdrop-blur-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-heading font-extrabold text-foreground">150+</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Hiring Partners</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border bg-card/40 backdrop-blur-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-heading font-extrabold text-foreground">250k+</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">DSA Submissions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section (Bento Grid) */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 relative z-10 border-y">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 rounded-full font-semibold px-3 py-1">SUITE FEATURES</Badge>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-foreground">Bento Grid Suite Ecosystem</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything required to prep, apply, coordinate, and recruit — structured into cohesive modules.
            </p>
          </div>

          {/* Bento Box Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* 1. Placement Portal (Double size) */}
            <div className="md:col-span-8 rounded-3xl border bg-card p-6 flex flex-col justify-between group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-md shadow-blue-500/10">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-2">Smart Placement Portal</h3>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
                  Check eligibility on live database postings. Filter by GPA requirements, allowed backlogs, and coordinate applications instantly.
                </p>
              </div>

              {/* Mini-UI Widget representation */}
              <div className="border rounded-xl bg-background/50 p-4 space-y-3 font-sans">
                <div className="flex items-center justify-between text-xs border-b pb-2">
                  <span className="font-semibold text-foreground">LIVE OPPORTUNITIES</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-500 bg-emerald-500/5 border-emerald-500/20">7 Active Roles</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-card border text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-[10px]">G</div>
                      <div>
                        <div className="font-bold text-foreground">Google</div>
                        <div className="text-[10px] text-muted-foreground">Software Engineer I</div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500 text-white text-[9px]">Eligible ✅</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-card border text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-purple-600/10 text-purple-600 flex items-center justify-center font-bold text-[10px]">A</div>
                      <div>
                        <div className="font-bold text-foreground">Atlassian</div>
                        <div className="text-[10px] text-muted-foreground">SDE Intern</div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500 text-white text-[9px]">Eligible ✅</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Resume Builder (Single size) */}
            <div className="md:col-span-4 rounded-3xl border bg-card p-6 flex flex-col justify-between group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-md shadow-purple-500/10">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-2">AI Resume Builder</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Generate premium, ATS-compliant resumes. Grades content using AI algorithms and guides keyword revisions.
                </p>
              </div>

              {/* UI representation */}
              <div className="mt-6 border rounded-xl bg-background/50 p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-600">
                  85%
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-foreground">ATS Benchmark Met</span>
                  <p className="text-[10px] text-muted-foreground">2 missing terms injected</p>
                </div>
              </div>
            </div>

            {/* 3. Alumni Network (Single size) */}
            <div className="md:col-span-4 rounded-3xl border bg-card p-6 flex flex-col justify-between group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6 shadow-md shadow-emerald-500/10">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-2">Alumni Network</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bridge communication. Ask alumni working in industry for referrals, technical feedback, and mentorship.
                </p>
              </div>

              {/* UI representation */}
              <div className="mt-6 border rounded-xl bg-background/50 p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 text-[9px] flex items-center justify-center font-bold">AK</div>
                  <div className="text-[11px]">
                    <strong className="text-foreground">Amit Kumar</strong>
                    <span className="text-[9px] text-muted-foreground block">SDE @ Microsoft</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">Mentoring</span>
                  <span className="text-[9px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-semibold">Referrals</span>
                </div>
              </div>
            </div>

            {/* 4. Community Forums (Double size) */}
            <div className="md:col-span-8 rounded-3xl border bg-card p-6 flex flex-col justify-between group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 shadow-md shadow-amber-500/10">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-2">Community Forum</h3>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
                  Engage in company thread discussions. Coordinate mock interviews, exchange coding strategies, and read interview experiences.
                </p>
              </div>

              {/* UI representation */}
              <div className="border rounded-xl bg-background/50 p-4 space-y-3 font-sans">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>TRENDING DISCUSSION THREADS</span>
                  <span>52 Replies</span>
                </div>
                <div className="p-3 bg-card border rounded-lg text-xs space-y-1">
                  <span className="font-bold text-foreground">Google SDE-I Interview Round Structure?</span>
                  <p className="text-[10px] text-muted-foreground">Asked by Rahul • Last active 5m ago</p>
                </div>
              </div>
            </div>

            {/* 5. DSA Sheets (Double size) */}
            <div className="md:col-span-7 rounded-3xl border bg-card p-6 flex flex-col justify-between group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center mb-6 shadow-md shadow-red-500/10">
                  <Code2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-2">DSA Company Sheets</h3>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
                  Methodical sheets for top company targets. Track problem completion status and unlock questions curated by placement cells.
                </p>
              </div>

              {/* UI representation */}
              <div className="border rounded-xl bg-background/50 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <strong className="text-foreground">Amazon DSA Prep Sheet</strong>
                  <span className="text-[10px] text-muted-foreground font-semibold">18 / 25 Done</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-rose-500 h-2 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
            </div>

            {/* 6. Code Simulator (Single size) */}
            <div className="md:col-span-5 rounded-3xl border bg-card p-6 flex flex-col justify-between group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center mb-6 shadow-md shadow-violet-500/10">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-2">Code Simulator</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Run custom solutions inside a secure console sandbox. Compiles multiple programming languages dynamically.
                </p>
              </div>

              {/* UI representation */}
              <div className="mt-6 border rounded-xl bg-[#0c0c0c] p-3 text-[10px] font-mono text-emerald-400">
                <div className="flex items-center gap-1.5 mb-1.5 border-b border-[#2d2d2d] pb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-400 font-bold">compiler.log</span>
                </div>
                <code>$ compilation success</code> <br />
                <code>$ 4 test cases verified in 12ms</code>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-3">
          <Badge variant="outline" className="text-accent border-accent/20 bg-accent/5 px-3 py-1 rounded-full font-semibold">SUCCESS STORIES</Badge>
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-foreground">Hear From Placed Students</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Ambitious graduates landing career roles at top product and consulting organizations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-3xl border bg-card/60 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${t.gradient}`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-0.5">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-foreground leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3.5 mt-8 border-t pt-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-foreground">{t.name}</h4>
                  <span className="text-[11px] text-muted-foreground font-semibold">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20 relative z-10 border-t">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-3 py-1 rounded-full font-semibold">QUESTIONS</Badge>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-foreground">Frequently Asked Questions</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Got questions? We've got answers. Explore details of how our core engine operates.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS_LIST.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border rounded-2xl bg-card transition-all duration-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between font-semibold text-sm sm:text-base hover:bg-muted/10 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-foreground font-heading">
                      <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t pt-3.5 bg-muted/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Bottom Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center relative z-10">
        <div className="p-8 sm:p-16 rounded-3xl border bg-card/60 backdrop-blur-xl relative overflow-hidden shadow-2xl">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-foreground">
              Ready to Accelerate Your <br />
              <span className="text-gradient">Career Bridge?</span>
            </h2>
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              Create an account or connect with placement cell administrators to begin tracking jobs, grading resume profiles, and simulator preparation.
            </p>
            <div className="pt-2">
              <SignedOut>
                <Link to="/auth">
                  <Button size="lg" className="text-base px-8 py-6 rounded-xl font-semibold shadow-lg shadow-primary/20">
                    Create Your Account <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Button size="lg" onClick={() => navigate('/dashboard')} className="text-base px-8 py-6 rounded-xl font-semibold shadow-lg shadow-primary/20">
                  Go to Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// -------------------------------------------------------------
// SHOWCASE PLAYGROUND
// -------------------------------------------------------------
type ActiveTab = 'ats' | 'eligibility' | 'dsa';

function ShowcasePlayground() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ats');

  return (
    <Card className="w-full overflow-hidden border bg-card/60 backdrop-blur-xl shadow-2xl relative">
      {/* Absolute Glow Spot */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Showcase Tabs */}
      <div className="flex border-b bg-muted/40 p-1.5 gap-1 select-none">
        <button
          onClick={() => setActiveTab('ats')}
          className={`flex-1 py-3 px-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'ats' 
              ? 'bg-card text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground hover:bg-card/30'
          }`}
        >
          <FileText className="w-4 h-4 text-primary" />
          <span>ATS Resume Grader</span>
        </button>
        <button
          onClick={() => setActiveTab('eligibility')}
          className={`flex-1 py-3 px-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'eligibility' 
              ? 'bg-card text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground hover:bg-card/30'
          }`}
        >
          <Award className="w-4 h-4 text-accent" />
          <span>Smart Eligibility</span>
        </button>
        <button
          onClick={() => setActiveTab('dsa')}
          className={`flex-1 py-3 px-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'dsa' 
              ? 'bg-card text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground hover:bg-card/30'
          }`}
        >
          <Terminal className="w-4 h-4 text-purple-500" />
          <span>DSA Simulator</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-6 min-h-[460px] flex flex-col justify-between relative bg-card/10">
        {activeTab === 'ats' && <AtsShowcase />}
        {activeTab === 'eligibility' && <EligibilityShowcase />}
        {activeTab === 'dsa' && <DsaShowcase />}
      </div>
    </Card>
  );
}

// -------------------------------------------------------------
// ATS RESUME GRADER
// -------------------------------------------------------------
function AtsShowcase() {
  const [resumeText, setResumeText] = useState(
    "Experienced Developer Intern working on React websites. Implemented landing page designs and connected APIs. Familiar with Javascript, HTML, CSS. Good communicator and team player."
  );
  const [scanStep, setScanStep] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);

  const sampleResumes = [
    {
      title: "Backend Core Resume",
      text: "Software Engineering Intern. Built Node.js microservices. Integrated databases with SQL. Experienced in Docker containerization and AWS API Gateway deployment. Refactored APIs for 20% speedup."
    },
    {
      title: "Basic Web Resume",
      text: "Fresher student. Created basic HTML web page. Can code in Python, C++. Good knowledge of computer science. Looking for SDE intern roles at tech companies."
    }
  ];

  const handleScan = () => {
    setIsScanning(true);
    setScanStep(1);
    
    // Simulate grading steps
    setTimeout(() => setScanStep(2), 700);
    setTimeout(() => setScanStep(3), 1400);
    setTimeout(() => {
      setScanStep(4);
      // Calculate a realistic score based on keywords in the text
      let calculatedScore = 55;
      const lowerText = resumeText.toLowerCase();
      if (lowerText.includes('docker') || lowerText.includes('aws')) calculatedScore += 10;
      if (lowerText.includes('microservices') || lowerText.includes('apis')) calculatedScore += 10;
      if (lowerText.includes('sql') || lowerText.includes('database')) calculatedScore += 10;
      if (lowerText.includes('refactored') || lowerText.includes('speedup')) calculatedScore += 10;
      if (lowerText.length > 180) calculatedScore += 5;
      
      setScore(Math.min(calculatedScore, 98));
      setIsScanning(false);
    }, 2200);
  };

  const handleReset = () => {
    setScanStep(0);
    setScore(0);
  };

  return (
    <div className="space-y-4 animate-scale-in">
      {scanStep === 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-muted-foreground">PASTE A RESUME SNIPPET TO SCAN:</span>
            <div className="flex gap-2">
              {sampleResumes.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => setResumeText(sample.text)}
                  className="text-[10px] text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded-full"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>
          
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="w-full h-40 p-3 text-sm rounded-lg border bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none font-sans"
            placeholder="Paste description or resume skills..."
          />

          <Button onClick={handleScan} className="w-full group" size="lg">
            <Cpu className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
            Analyze with AI Grader
          </Button>

          {/* ATS Tips & Guidelines Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3.5 border-t border-border/40 text-left">
            <div className="p-3 bg-muted/20 hover:bg-muted/30 border rounded-lg transition-all duration-200 space-y-1">
              <div className="flex items-center gap-1.5 text-primary">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold tracking-wider uppercase">Keyword Density</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Optimize skill matching by using standard industry keywords like React, SQL, and Docker.
              </p>
            </div>
            <div className="p-3 bg-muted/20 hover:bg-muted/30 border rounded-lg transition-all duration-200 space-y-1">
              <div className="flex items-center gap-1.5 text-accent">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold tracking-wider uppercase">Metric Focus</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Quantify achievements with clear performance improvements and business metrics.
              </p>
            </div>
            <div className="p-3 bg-muted/20 hover:bg-muted/30 border rounded-lg transition-all duration-200 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-500">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold tracking-wider uppercase">Scan Accuracy</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Ensure clean formatting, single-column layouts, and readable system fonts for parser success.
              </p>
            </div>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="h-64 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <Sparkles className="w-6 h-6 text-accent absolute top-5 left-5 animate-pulse" />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold animate-pulse">
              {scanStep === 1 && "🔍 Analyzing format syntax..."}
              {scanStep === 2 && "⚡ Parsing core engineering keywords..."}
              {scanStep === 3 && "🤖 Fetching ATS matching scoring..."}
            </p>
            <p className="text-xs text-muted-foreground">Scanning database rules and role benchmarks</p>
          </div>
        </div>
      )}

      {scanStep === 4 && !isScanning && (
        <div className="space-y-6 animate-scale-in">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-muted/40 border">
            {/* Score Ring */}
            <div className="relative flex items-center justify-center w-28 h-28 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="46" stroke="currentColor" strokeWidth="6" className="text-muted/30" fill="transparent" />
                <circle
                  cx="56" 
                  cy="56" 
                  r="46" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  className={score >= 80 ? "text-emerald-500" : score >= 70 ? "text-accent" : "text-destructive"}
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - score / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-bold font-heading">{score}%</span>
                <span className="text-[10px] text-muted-foreground font-semibold">ATS SCORE</span>
              </div>
            </div>

            {/* Score message */}
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-base font-bold font-heading">
                  {score >= 80 ? "Highly Competitive!" : score >= 70 ? "Good Potential" : "Needs Optimization"}
                </span>
                <Badge className={score >= 80 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20" : score >= 70 ? "bg-accent/20 text-accent hover:bg-accent/20" : "bg-destructive/20 text-destructive hover:bg-destructive/20"}>
                  {score >= 80 ? "Pass" : score >= 70 ? "Review" : "Critical"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {score >= 80 
                  ? "Your resume has high keyword density for modern engineering roles. It's ready to apply!" 
                  : "We identified missing key technologies and metrics. Implement recommendations below to bump the grade."
                }
              </p>
              <button onClick={handleReset} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mx-auto sm:ml-0 mt-1">
                <RefreshCw className="w-3 h-3" /> Rescan another text
              </button>
            </div>
          </div>

          {/* Details breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-3.5 bg-background/40">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-2">
                <CheckCircle className="w-3.5 h-3.5" /> MATCHED KEYWORDS
              </span>
              <div className="flex flex-wrap gap-1.5">
                {resumeText.toLowerCase().includes('react') && <Badge variant="outline" className="text-emerald-600 bg-emerald-500/5">React</Badge>}
                {resumeText.toLowerCase().includes('javascript') && <Badge variant="outline" className="text-emerald-600 bg-emerald-500/5">JavaScript</Badge>}
                {resumeText.toLowerCase().includes('database') || resumeText.toLowerCase().includes('sql') ? <Badge variant="outline" className="text-emerald-600 bg-emerald-500/5">PostgreSQL/SQL</Badge> : null}
                {resumeText.toLowerCase().includes('docker') && <Badge variant="outline" className="text-emerald-600 bg-emerald-500/5">Docker</Badge>}
                {resumeText.toLowerCase().includes('aws') && <Badge variant="outline" className="text-emerald-600 bg-emerald-500/5">AWS Cloud</Badge>}
                {resumeText.toLowerCase().includes('microservices') && <Badge variant="outline" className="text-emerald-600 bg-emerald-500/5">Microservices</Badge>}
                <Badge variant="outline" className="text-emerald-600 bg-emerald-500/5">HTML/CSS</Badge>
                <Badge variant="outline" className="text-emerald-600 bg-emerald-500/5">REST API</Badge>
              </div>
            </div>

            <div className="border rounded-lg p-3.5 bg-background/40">
              <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1 mb-2">
                <AlertCircle className="w-3.5 h-3.5" /> CRITICAL IMPROVEMENTS
              </span>
              <ul className="text-xs space-y-1.5 text-muted-foreground list-disc pl-4">
                {!resumeText.toLowerCase().includes('docker') && <li>Add cloud deployment experience (Docker, CI/CD)</li>}
                {!resumeText.toLowerCase().includes('refactored') && <li>Quantify impact (e.g. "speedup by 20%", "reduced latency")</li>}
                <li>Separate technical skills section cleanly</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// ELIGIBILITY CALCULATOR
// -------------------------------------------------------------
interface JobCriteria {
  company: string;
  role: string;
  minCgpa: number;
  maxBacklogs: number;
  branches: string[];
  color: string;
}

const MOCK_CRITERIA: JobCriteria[] = [
  {
    company: "Google",
    role: "Software Engineer I",
    minCgpa: 8.5,
    maxBacklogs: 0,
    branches: ["CSE", "ECE"],
    color: "from-blue-500 to-cyan-500"
  },
  {
    company: "Atlassian",
    role: "Associate SDE",
    minCgpa: 8.0,
    maxBacklogs: 1,
    branches: ["CSE", "ECE", "ME"],
    color: "from-purple-600 to-pink-600"
  },
  {
    company: "Infosys",
    role: "Power Programmer",
    minCgpa: 6.5,
    maxBacklogs: 2,
    branches: ["CSE", "ECE", "ME", "Civil"],
    color: "from-green-500 to-emerald-600"
  }
];

function EligibilityShowcase() {
  const [cgpa, setCgpa] = useState<number>(7.8);
  const [backlogs, setBacklogs] = useState<number>(1);
  const [branch, setBranch] = useState<string>("CSE");

  const eligibleCount = MOCK_CRITERIA.filter(job => {
    const isCgpaOk = cgpa >= job.minCgpa;
    const isBacklogsOk = backlogs <= job.maxBacklogs;
    const isBranchOk = job.branches.includes(branch);
    return isCgpaOk && isBacklogsOk && isBranchOk;
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-scale-in text-left">
      {/* Left Input Controls */}
      <div className="md:col-span-5 space-y-5 flex flex-col justify-between">
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-muted-foreground">TEST YOUR ELIGIBILITY LIVE:</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-foreground">CGPA:</span>
              <span className="font-bold text-primary">{cgpa.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="5.0"
              max="10.0"
              step="0.1"
              value={cgpa}
              onChange={(e) => setCgpa(parseFloat(e.target.value))}
              className="w-full accent-primary bg-muted rounded-lg h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-foreground">Active Backlogs:</span>
              <span className="font-bold text-accent">{backlogs}</span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={backlogs}
              onChange={(e) => setBacklogs(parseInt(e.target.value))}
              className="w-full accent-accent bg-muted rounded-lg h-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground block">Academic Branch:</label>
            <div className="grid grid-cols-4 gap-1.5">
              {["CSE", "ECE", "ME", "Civil"].map((b) => (
                <button
                  key={b}
                  onClick={() => setBranch(b)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    branch === b 
                      ? 'bg-primary border-primary text-white shadow-sm' 
                      : 'bg-background hover:bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg text-[11px] text-muted-foreground flex items-start gap-2 border">
            <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
            <span>Real eligibility checking matches student live SQL profiles with job requirement schema constraints.</span>
          </div>
        </div>

        {/* Dynamic Analysis Box to cover down-left leftover space */}
        <div className="p-4 rounded-xl border border-border bg-card/50 space-y-3 shadow-sm mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">ELIGIBILITY SUMMARY</span>
            <Badge variant="outline" className={`text-[10px] font-bold ${
              eligibleCount === 3 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                : eligibleCount > 0 
                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" 
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}>
              {eligibleCount}/3 Approved
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {/* Custom mini chart */}
            <div className="w-12 h-12 relative flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r="19" stroke="currentColor" strokeWidth="3.5" className="text-muted/20" fill="transparent" />
                <circle
                  cx="24" 
                  cy="24" 
                  r="19" 
                  stroke="currentColor" 
                  strokeWidth="3.5" 
                  className={eligibleCount === 3 ? "text-emerald-500" : eligibleCount > 0 ? "text-indigo-500" : "text-destructive"}
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 19}
                  strokeDashoffset={2 * Math.PI * 19 * (1 - eligibleCount / 3)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.3s ease-in-out' }}
                />
              </svg>
              <span className="absolute text-[10px] font-extrabold text-foreground">
                {Math.round((eligibleCount / 3) * 100)}%
              </span>
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">
                {eligibleCount === 3 ? "Highly Qualified" : eligibleCount > 0 ? "Partially Eligible" : "Ineligible Status"}
              </p>
              <p className="text-[10px] text-muted-foreground leading-snug">
                {eligibleCount === 3 
                  ? "You satisfy the strict criteria for all tier-1 recruiters."
                  : eligibleCount > 0
                  ? `You qualify for ${eligibleCount} SDE pool(s). Clear remaining requirements.`
                  : "You do not meet the minimum eligibility benchmarks."
                }
              </p>
            </div>
          </div>

          {/* Advice/Tips */}
          <div className="pt-2.5 border-t border-border text-[9px] text-muted-foreground leading-relaxed flex items-start gap-1">
            <span className="font-bold text-foreground flex-shrink-0">TPO Tip:</span> 
            <span>
              {eligibleCount === 3 
                ? "Excellent! Keep your profile updated for upcoming campus drives."
                : backlogs > 0 
                ? "Clear active backlogs to instantly qualify for top MNC recruiters."
                : cgpa < 8.0
                ? "Aim to bump your CGPA above 8.0 to satisfy standard MNC filters."
                : "Select branch controls to preview company eligibility rules."
              }
            </span>
          </div>
        </div>
      </div>

      {/* Right Company Eligibility Cards */}
      <div className="md:col-span-7 space-y-3">
        {MOCK_CRITERIA.map((job) => {
          // Check eligibility
          const isCgpaOk = cgpa >= job.minCgpa;
          const isBacklogsOk = backlogs <= job.maxBacklogs;
          const isBranchOk = job.branches.includes(branch);
          const isEligible = isCgpaOk && isBacklogsOk && isBranchOk;

          // Find critical block reason
          const reasons: string[] = [];
          if (!isCgpaOk) reasons.push(`Requires ${job.minCgpa}+ CGPA`);
          if (!isBacklogsOk) reasons.push(`Max ${job.maxBacklogs} backlogs`);
          if (!isBranchOk) reasons.push(`${branch} branch ineligible`);

          return (
            <div
              key={job.company}
              className={`p-3.5 border rounded-xl flex items-center justify-between transition-all duration-300 ${
                isEligible 
                  ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/5 shadow-md' 
                  : 'bg-background border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${job.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                  {job.company[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-foreground">{job.company}</span>
                    <span className="text-[10px] text-muted-foreground">• {job.role}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Req: {job.minCgpa} CGPA | {job.maxBacklogs} Backlogs | {job.branches.join('/')}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {isEligible ? (
                  <Badge className="bg-emerald-500 text-white font-semibold flex items-center gap-1 px-2.5 py-0.5 rounded-full hover:bg-emerald-500">
                    <CheckCircle className="w-3 h-3" /> Eligible
                  </Badge>
                ) : (
                  <div className="text-right">
                    <Badge variant="secondary" className="text-destructive bg-destructive/10 font-semibold flex items-center gap-1 px-2.5 py-0.5 rounded-full">
                      <ShieldAlert className="w-3 h-3" /> Locked
                    </Badge>
                    <div className="text-[9px] text-destructive mt-1 font-medium max-w-[120px] leading-tight">
                      {reasons.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// DSA SIMULATOR
// -------------------------------------------------------------
function DsaShowcase() {
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const initialCode = `// Language: JavaScript
function countVowels(str) {
  const vowels = 'aeiouAEIOU';
  let count = 0;
  for (let char of str) {
    if (vowels.includes(char)) count++;
  }
  return count;
}`;

  const runCode = () => {
    setIsRunning(true);
    setHasRun(true);
    setConsoleLogs(["Initializing virtual sandbox...", "$ node solution.js"]);

    setTimeout(() => {
      setConsoleLogs(prev => [...prev, "✔ Test Case 1 Passed: countVowels('hello') => 2"]);
    }, 400);

    setTimeout(() => {
      setConsoleLogs(prev => [...prev, "✔ Test Case 2 Passed: countVowels('Placify') => 2"]);
    }, 800);

    setTimeout(() => {
      setConsoleLogs(prev => [...prev, "✔ Test Case 3 Passed: countVowels('AI Simulator') => 5"]);
    }, 1200);

    setTimeout(() => {
      setConsoleLogs(prev => [...prev, "🎉 All tests passed successfully! Execution time: 14ms."]);
      setIsRunning(false);
    }, 1600);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-scale-in text-left">
      {/* Problem Panel */}
      <div className="space-y-3 flex flex-col justify-between border p-4 rounded-xl bg-background/50">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold px-2 py-0.5 rounded-full">EASY</span>
            <span className="text-xs font-semibold text-muted-foreground">DSA PROBLEM OF THE DAY</span>
          </div>
          <h4 className="font-heading font-bold text-base text-foreground">Count Vowels in String</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Write a function <code className="bg-muted px-1 py-0.5 rounded text-accent font-semibold">countVowels(str)</code> that counts and returns the total number of vowels contained in a string.
          </p>
          <div className="text-[11px] space-y-1 bg-muted/40 p-2.5 rounded-lg border">
            <div><strong>Example Input:</strong> <code>"hello"</code></div>
            <div><strong>Example Output:</strong> <code>2</code></div>
          </div>
        </div>

        <Button 
          onClick={runCode} 
          disabled={isRunning} 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center justify-center gap-2 mt-2"
        >
          {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          {isRunning ? "Running Sandbox..." : "Run Test Cases"}
        </Button>

        {/* Sandbox Constraints & Complexity Card */}
        <div className="p-3 bg-muted/30 border border-border/60 rounded-lg text-[10px] text-muted-foreground mt-2.5 space-y-2">
          <div className="flex items-center justify-between border-b border-border/40 pb-1">
            <span className="font-bold text-foreground text-[10px] tracking-wider uppercase flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-purple-500" />
              SANDBOX CONSTRAINTS
            </span>
            <span className="font-mono text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded">Node v20.x</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-bold text-foreground">Time Complexity:</span>
              <code className="block font-mono bg-muted/60 px-1 py-0.5 rounded mt-0.5">O(N) time complexity</code>
            </div>
            <div>
              <span className="font-bold text-foreground">Space Complexity:</span>
              <code className="block font-mono bg-muted/60 px-1 py-0.5 rounded mt-0.5">O(1) auxiliary space</code>
            </div>
          </div>
        </div>
      </div>

      {/* Code Editor and Console Panel */}
      <div className="flex flex-col h-[320px] rounded-xl overflow-hidden border bg-[#1e1e1e]">
        {/* Editor Tab Bar */}
        <div className="bg-[#2d2d2d] px-4 py-2 border-b border-[#3c3c3c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-slate-400 ml-2 font-mono">solution.js</span>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-400 text-[9px] hover:bg-emerald-500/10 font-mono">JS Engine</Badge>
        </div>

        {/* Code Content */}
        <pre className="p-4 text-xs font-mono text-slate-300 overflow-y-auto leading-relaxed flex-1 select-text">
          <code>{initialCode}</code>
        </pre>

        {/* Console Logs Box */}
        {hasRun && (
          <div className="h-36 bg-[#0c0c0c] border-t border-[#3c3c3c] p-3 font-mono text-[10px] text-slate-300 overflow-y-auto space-y-1">
            {consoleLogs.map((log, idx) => {
              const isPass = log.includes('✔') || log.includes('🎉');
              return (
                <div key={idx} className={isPass ? "text-emerald-400" : log.startsWith('$') ? "text-slate-500" : "text-slate-300"}>
                  {log}
                </div>
              );
            })}
            {isRunning && <div className="text-primary animate-pulse">▋</div>}
          </div>
        )}
      </div>
    </div>
  );
}
