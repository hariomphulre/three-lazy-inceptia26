"use client";
import { Brain, BookOpen, Shield, Users, CheckCircle, ArrowRight, Sparkles, Lock, Heart, Star, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSwitcher } from './ui/LanguageSwitcher';
import { MarioHero } from './MarioHero';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import AdventurePoint, { Tree, Coin, Pipe, Mushroom, QuestionBlock, Waterfall, Cloud, RockTower, CaveEntrance } from './AdventurePoint';

export default function LandingPage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-10 h-10 bg-primary border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:translate-y-[-2px] transition-transform">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-black text-foreground tracking-tight">{t("landing_brand")}</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#how" className="text-foreground font-bold hover:text-primary transition-colors">{t("landing_nav_how")}</a>
            <a href="#why" className="text-foreground font-bold hover:text-primary transition-colors">{t("landing_nav_why")}</a>
            <a href="#who" className="text-foreground font-bold hover:text-primary transition-colors">{t("landing_nav_who")}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button 
              variant="ghost"
              onClick={() => router.push("/login")}
              className="hidden sm:flex"
            >
              {t("landing_btn_signin")}
            </Button>
            <Button 
              onClick={() => router.push("/signup")}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {t("landing_btn_getstarted")}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent border-2 border-black text-accent-foreground rounded-full mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-bold uppercase tracking-wider">{t("landing_hero_badge")}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-[1.1] drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
              {t("landing_hero_title").split('\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h1>
            
            <p className="text-xl text-foreground/80 mb-10 max-w-xl leading-relaxed font-medium">
              {t("landing_hero_subtitle")}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button 
                size="lg"
                onClick={() => router.push("/signup")}
                className="w-full sm:w-auto text-xl py-8 px-10 h-auto"
              >
                {t("landing_hero_btn_start")}
                <ArrowRight className="w-6 h-6" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-xl py-8 px-10 h-auto"
              >
                {t("landing_hero_btn_learn")}
                <BookOpen className="w-6 h-6" />
              </Button>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl group-hover:bg-primary/30 transition-colors" />
            <MarioHero />
          </div>
        </div>
      </section>


      {/* ═══ HOW IT WORKS — SUPER MARIO WORLD MAP ═══ */}
      <section id="how" className="px-0 border-y-8 border-black relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #1565C0 0%, #1E88E5 8%, #42A5F5 18%, #64B5F6 30%, #90CAF9 42%, #BBDEFB 54%, #C8E6C9 66%, #81C784 76%, #66BB6A 84%, #4CAF50 92%, #43A047 100%)" }}>

        {/* ──── LAYER 1: SKY CLOUDS (parallax floating) ──── */}
        <div className="absolute inset-0 pointer-events-none z-[1]">
          <motion.div animate={{ x: [0, 50, 0] }} transition={{ duration: 32, repeat: Infinity, ease: "linear" }}>
            <Cloud w={210} className="absolute top-[2%] left-[-2%] opacity-80" />
          </motion.div>
          <motion.div animate={{ x: [0, -35, 0] }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }}>
            <Cloud w={195} className="absolute top-[0%] right-[3%] opacity-75" />
          </motion.div>
          <motion.div animate={{ x: [0, 28, 0] }} transition={{ duration: 38, repeat: Infinity, ease: "linear" }}>
            <Cloud w={140} className="absolute top-[7%] left-[22%] opacity-90" />
          </motion.div>
          <motion.div animate={{ x: [0, -22, 0] }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }}>
            <Cloud w={160} className="absolute top-[4%] right-[25%] opacity-88" />
          </motion.div>
          <motion.div animate={{ x: [0, 20, 0] }} transition={{ duration: 44, repeat: Infinity, ease: "linear" }}>
            <Cloud w={100} className="absolute top-[13%] left-[52%] opacity-75" />
          </motion.div>
          <motion.div animate={{ x: [0, -18, 0] }} transition={{ duration: 36, repeat: Infinity, ease: "linear" }}>
            <Cloud w={120} className="absolute top-[16%] left-[8%] opacity-70" />
          </motion.div>
          <motion.div animate={{ x: [0, 16, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
            <Cloud w={80} className="absolute top-[20%] right-[10%] opacity-65" />
          </motion.div>
        </div>

        {/* ──── LAYER 2: DISTANT MOUNTAINS (atmospheric haze) ──── */}
        <div className="absolute top-[5%] left-0 right-0 pointer-events-none z-[2]">
          <svg viewBox="0 0 1440 340" className="w-full" preserveAspectRatio="none">
            {/* Farthest row — pale blue haze */}
            <path d="M0,340 L0,250 Q80,155 170,200 Q260,145 355,185 Q450,125 545,165 Q640,108 735,150 Q830,100 925,142 Q1020,92 1115,136 Q1210,100 1305,145 Q1370,118 1440,158 L1440,340 Z" fill="rgba(173,214,255,0.28)" />
            {/* Mid row — soft green-grey */}
            <path d="M0,340 L0,275 Q110,185 220,228 Q330,165 440,208 Q550,152 660,192 Q770,158 880,195 Q990,162 1100,198 Q1210,168 1320,204 Q1380,178 1440,210 L1440,340 Z" fill="rgba(144,200,130,0.22)" />
          </svg>
        </div>

        {/* ──── LAYER 3: ROCK CLIFF TOWERS (left & right) ──── */}
        <div className="absolute inset-0 pointer-events-none z-[3] overflow-hidden">
          {/* LEFT SIDE TOWERS */}
          <div className="absolute left-[-14px] top-[10%]">  <RockTower height={285} width={95} /></div>
          <div className="absolute left-[3%]  top-[30%]">  <RockTower height={215} width={72} /></div>
          <div className="absolute left-[-8px] top-[54%]"> <RockTower height={265} width={88} /></div>
          <div className="absolute left-[2%]  top-[75%]"> <RockTower height={190} width={66} /></div>
          {/* RIGHT SIDE TOWERS */}
          <div className="absolute right-[-14px] top-[7%]">  <RockTower height={305} width={100} /></div>
          <div className="absolute right-[2%]   top-[24%]"> <RockTower height={235} width={80} /></div>
          <div className="absolute right-[-10px] top-[46%]"><RockTower height={275} width={92} /></div>
          <div className="absolute right-[3%]   top-[68%]"><RockTower height={210} width={74} /></div>
        </div>

        {/* ──── TITLE ──── */}
        <div className="relative z-[20] pt-25 pb-4">
          <motion.div initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-5xl md:text-7xl font-[1000] text-white drop-shadow-[5px_5px_0px_#000] uppercase tracking-tighter italic">
              ADVENTURE MAP
            </h2>
            <div className="inline-flex items-center gap-2 mt-3 px-6 py-2 bg-[#FBD000] border-4 border-black shadow-[4px_4px_0px_#000] -rotate-1">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><polygon points="9,0 11.5,6.3 18,6.9 13.2,11.1 14.6,18 9,14.4 3.4,18 4.8,11.1 0,6.9 6.5,6.3" fill="#E65100" /></svg>
              <span className="text-black font-black text-lg md:text-xl">YOUR JOURNEY BEGINS!</span>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><polygon points="9,0 11.5,6.3 18,6.9 13.2,11.1 14.6,18 9,14.4 3.4,18 4.8,11.1 0,6.9 6.5,6.3" fill="#E65100" /></svg>
            </div>
          </motion.div>
        </div>

        {/* ──── GOLDEN BRICK ROAD + CHECKPOINTS ──── */}
        <div className="relative z-[10] max-w-6xl mx-auto px-4 md:px-6">

          {/* Golden Brick Road SVG — layered strokes for 3D realism */}
          <svg
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[88%] h-full pointer-events-none z-0"
            viewBox="0 0 800 1700"
            preserveAspectRatio="none"
            fill="none"
          >
            {/* Ground shadow under road */}
            <path d="M 400,20 C 620,180 180,350 400,500 C 620,650 180,800 400,950 C 620,1100 180,1250 400,1400 C 500,1500 400,1680 400,1680"
              stroke="rgba(0,0,0,0.3)" strokeWidth="50" strokeLinecap="round" />
            {/* Dark gold outer edge */}
            <path d="M 400,20 C 620,180 180,350 400,500 C 620,650 180,800 400,950 C 620,1100 180,1250 400,1400 C 500,1500 400,1680 400,1680"
              stroke="#8B6914" strokeWidth="44" strokeLinecap="round" />
            {/* Main golden fill */}
            <path d="M 400,20 C 620,180 180,350 400,500 C 620,650 180,800 400,950 C 620,1100 180,1250 400,1400 C 500,1500 400,1680 400,1680"
              stroke="#FBC02D" strokeWidth="38" strokeLinecap="round" />
            {/* Bright centre highlight */}
            <path d="M 400,20 C 620,180 180,350 400,500 C 620,650 180,800 400,950 C 620,1100 180,1250 400,1400 C 500,1500 400,1680 400,1680"
              stroke="#FDD835" strokeWidth="22" strokeLinecap="round" opacity="0.75" />
            {/* Brick mortar lines (dash segments) */}
            <path d="M 400,20 C 620,180 180,350 400,500 C 620,650 180,800 400,950 C 620,1100 180,1250 400,1400 C 500,1500 400,1680 400,1680"
              stroke="#C68A00" strokeWidth="40" strokeLinecap="round" strokeDasharray="30 10" opacity="0.38" />
            {/* Top gloss sheen */}
            <path d="M 400,20 C 620,180 180,350 400,500 C 620,650 180,800 400,950 C 620,1100 180,1250 400,1400 C 500,1500 400,1680 400,1680"
              stroke="rgba(255,255,255,0.28)" strokeWidth="7" strokeLinecap="round" />
          </svg>

          {/* ── CHECKPOINT 1 ── */}
          <div className="relative flex items-start gap-4 md:gap-8">
            <div className="hidden md:flex flex-col items-center gap-2 pt-4">
              <Tree variant="oak" size="lg" />
              <Mushroom color="red" />
              <Mushroom color="green" />
            </div>
            <div className="flex-1">
              <AdventurePoint
                point={{ label: "LEVEL 1", title: "landing_how_step1_title", desc: "landing_how_step1_desc", icon: "🎮", color: "#E52521" }}
                index={0}
                side="left"
              />
            </div>
            <div className="hidden md:flex flex-col items-center gap-3 pt-8">
              <QuestionBlock />
              <QuestionBlock />
              <Coin delay={0} />
              <Coin delay={0.3} />
              <Coin delay={0.6} />
            </div>
          </div>

          {/* Scenery strip 1 */}
          <div className="relative flex items-end justify-around py-1 pointer-events-none select-none">
            <Tree variant="bush" size="sm" />
            <Coin className="mb-5" delay={0.5} />
            <Tree variant="pine" size="md" />
            <Mushroom color="red" />
            <Pipe color="green" />
            <Tree variant="bush" size="md" />
            <Coin className="mb-7" delay={0.2} />
            <QuestionBlock />
            <Mushroom color="green" />
          </div>

          {/* ── CHECKPOINT 2 ── */}
          <div className="relative flex items-start gap-4 md:gap-8 flex-row-reverse">
            <div className="hidden md:flex flex-col items-center gap-2 pt-4">
              <Tree variant="pine" size="lg" />
              <Tree variant="bush" size="sm" className="mt-1" />
              <Mushroom color="green" />
            </div>
            <div className="flex-1">
              <AdventurePoint
                point={{ label: "LEVEL 2", title: "landing_how_step2_title", desc: "landing_how_step2_desc", icon: "🌟", color: "#FF9800" }}
                index={1}
                side="right"
              />
            </div>
            <div className="hidden md:flex flex-col items-center gap-3 pt-6">
              <Waterfall height={85} />
              <Coin delay={0.1} />
              <Coin delay={0.4} />
            </div>
          </div>

          {/* Scenery strip 2 */}
          <div className="relative flex items-end justify-around py-1 pointer-events-none select-none">
            <Tree variant="palm" size="sm" />
            <QuestionBlock />
            <Mushroom color="red" />
            <Tree variant="oak" size="sm" />
            <Coin className="mb-9" delay={0.1} />
            <Pipe color="red" />
            <Mushroom color="green" />
            <Tree variant="pine" size="sm" />
            <Coin className="mb-4" delay={0.7} />
          </div>

          {/* ── CHECKPOINT 3 ── */}
          <div className="relative flex items-start gap-4 md:gap-8">
            <div className="hidden md:flex flex-col items-center gap-2 pt-6">
              <Pipe color="green" />
              <Coin delay={0.4} />
              <Coin delay={0.7} />
              <Mushroom color="red" />
            </div>
            <div className="flex-1">
              <AdventurePoint
                point={{ label: "LEVEL 3", title: "landing_how_step3_title", desc: "landing_how_step3_desc", icon: "🧠", color: "#43B047" }}
                index={2}
                side="left"
              />
            </div>
            <div className="hidden md:flex flex-col items-center gap-3 pt-4">
              <Tree variant="oak" size="lg" />
              <Tree variant="bush" size="sm" className="-mt-1" />
              <Mushroom color="green" />
            </div>
          </div>

          {/* Scenery strip 3 */}
          <div className="relative flex items-end justify-around py-1 pointer-events-none select-none">
            <Tree variant="bush" size="md" />
            <Waterfall height={65} />
            <Mushroom color="green" />
            <Coin className="mb-6" delay={0.6} />
            <Tree variant="pine" size="md" />
            <QuestionBlock />
            <Coin className="mb-3" delay={0.9} />
            <Mushroom color="red" />
            <Tree variant="oak" size="sm" />
          </div>

          {/* ── CHECKPOINT 4 ── */}
          <div className="relative flex items-start gap-4 md:gap-8 flex-row-reverse">
            <div className="hidden md:flex flex-col items-center gap-2 pt-4">
              <Tree variant="pine" size="lg" />
              <Coin delay={0.2} />
              <Mushroom color="green" />
            </div>
            <div className="flex-1">
              <AdventurePoint
                point={{ label: "LEVEL 4", title: "Power Ups", desc: "Unlock personalized strategies and AI insights.", icon: "⚡", color: "#2196F3" }}
                index={3}
                side="right"
              />
            </div>
            <div className="hidden md:flex flex-col items-center gap-3 pt-8">
              <Pipe color="red" />
              <Mushroom color="red" />
              <QuestionBlock />
              <Coin delay={0.5} />
            </div>
          </div>

          {/* Scenery strip 4 */}
          <div className="relative flex items-end justify-around py-1 pointer-events-none select-none">
            <Coin className="mb-4" delay={0.8} />
            <Tree variant="palm" size="md" />
            <Mushroom color="red" />
            <Tree variant="bush" size="sm" />
            <Pipe color="green" />
            <Tree variant="oak" size="md" />
            <Coin className="mb-9" delay={0.3} />
            <Mushroom color="green" />
            <QuestionBlock />
          </div>

          {/* ── CHECKPOINT 5: GOAL (Cave Entrance nearby) ── */}
          <div className="relative flex items-start gap-4 md:gap-8 pb-6">
            <div className="hidden md:flex flex-col items-center gap-2 pt-4">
              <Tree variant="oak" size="lg" />
              <Mushroom color="red" />
              <Coin delay={0} />
              <Coin delay={0.35} />
            </div>
            <div className="flex-1">
              <AdventurePoint
                point={{ label: "GOAL", title: "Victory", desc: "Master your path — celebrate every win along the way!", icon: "★", color: "#FBD000" }}
                index={4}
                side="center"
              />
            </div>
            <div className="hidden md:flex flex-col items-center gap-2 pt-4">
              <CaveEntrance />
              <Tree variant="bush" size="sm" />
            </div>
          </div>
        </div>

        {/* ──── FOREGROUND ROLLING HILLS (layered) ──── */}
        <div className="relative z-[8] -mt-8">
          <svg viewBox="0 0 1440 180" className="w-full block" preserveAspectRatio="none">
            {/* Far hill layer */}
            <path d="M0,180 Q90,68 180,108 Q270,52 360,95 Q450,42 540,83 Q630,36 720,76 Q810,48 900,84 Q990,38 1080,78 Q1170,44 1260,82 Q1350,52 1440,88 L1440,180 Z" fill="#52A825" opacity="0.65" />
            {/* Near hill layer */}
            <path d="M0,180 Q130,48 260,96 Q390,25 520,78 Q650,18 780,72 Q910,28 1040,76 Q1170,20 1300,75 Q1380,42 1440,80 L1440,180 Z" fill="#5DB830" />
          </svg>
        </div>

        {/* ──── GROUND ──── */}
        <div className="relative z-[9] -mt-1">
          {/* Grass stripe */}
          <div className="relative h-7" style={{ background: "#71BC2B", borderTop: "5px solid #4A7D1C" }}>
            <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(80,150,30,0.25) 10px, rgba(80,150,30,0.25) 12px)" }} />
          </div>
          {/* Dirt body */}
          <div className="h-20 relative" style={{ background: "linear-gradient(180deg, #7B3811 0%, #8B4513 30%, #883F10 100%)", borderTop: "5px solid #5D2E0A" }}>
            {/* Horizontal strata */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(0,0,0,0.25) 15px, rgba(0,0,0,0.25) 16px)" }} />
            {/* Vertical brick seams */}
            <div className="absolute inset-0 opacity-12" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 32px, rgba(0,0,0,0.2) 32px, rgba(0,0,0,0.2) 33px)" }} />
            {/* Embedded stones */}
            <div className="flex justify-around items-center h-10 px-8 pt-2">
              {[5, 9, 4, 7, 6, 8, 4, 7, 5, 8].map((w, i) => (
                <div key={i} className="rounded-sm opacity-30" style={{
                  width: `${w * 6}px`, height: `${(i % 3 + 1) * 5 + 3}px`,
                  background: `hsl(${20 + (i * 8) % 18}, 32%, ${26 + i % 12}%)`,
                  marginTop: i % 2 === 0 ? 3 : 10,
                }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why NeuroBloom */}
      <section id="why" className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 uppercase tracking-tight">{t("landing_why_title")}</h2>
            <div className="w-24 h-2 bg-secondary mx-auto mb-6" />
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto font-medium">
              {t("landing_why_subtitle")}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: CheckCircle, title: "landing_why_feature1_title", desc: "landing_why_feature1_desc" },
              { icon: Shield, title: "landing_why_feature2_title", desc: "landing_why_feature2_desc" },
              { icon: Lock, title: "landing_why_feature3_title", desc: "landing_why_feature3_desc" },
              { icon: Users, title: "landing_why_feature4_title", desc: "landing_why_feature4_desc" }
            ].map((feature, i) => (
              <div key={i} className="bg-card p-6 rounded-xl border-2 border-black shadow-sm flex gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-accent/20 border-2 border-black rounded-lg flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <feature.icon className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground mb-2 uppercase">{t(feature.title)}</h3>
                  <p className="text-foreground/70 font-medium">{t(feature.desc)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section id="who" className="py-24 px-6 bg-accent/10 border-y-4 border-black">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-16 uppercase tracking-tight">{t("landing_who_title")}</h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Heart, title: "landing_who_parents_title", desc: "landing_who_parents_desc", color: "bg-primary" },
              { icon: BookOpen, title: "landing_who_educators_title", desc: "landing_who_educators_desc", color: "bg-secondary" },
              { icon: Brain, title: "landing_who_researchers_title", desc: "landing_who_researchers_desc", color: "bg-accent" }
            ].map((item, i) => (
              <div key={i} className="group">
                <div className={`w-20 h-20 ${item.color} border-4 border-black rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-4 uppercase">{t(item.title)}</h3>
                <p className="text-foreground/70 font-medium leading-relaxed">
                  {t(item.desc)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ethics & Trust */}
      <section id="ethics" className="py-24 px-6 bg-foreground text-background relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block p-4 bg-primary border-4 border-black mb-8 rotate-[-2deg] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-3xl md:text-4xl font-black uppercase text-white tracking-widest">{t("landing_ethics_title")}</h2>
          </div>
          <p className="text-xl text-background/80 mb-12 leading-relaxed font-bold italic">
            "{t("landing_ethics_subtitle")}"
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 text-left">
            {[
              { icon: Shield, title: "landing_ethics_item1_title", desc: "landing_ethics_item1_desc" },
              { icon: Lock, title: "landing_ethics_item2_title", desc: "landing_ethics_item2_desc" }
            ].map((item, i) => (
              <div key={i} className="bg-background/10 backdrop-blur-sm p-8 rounded-xl border-2 border-background/20 hover:border-background/40 transition-colors">
                <div className="flex items-start gap-4">
                  <item.icon className="w-8 h-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-black mb-2 uppercase tracking-tight">{t(item.title)}</h3>
                    <p className="text-background/70 font-medium leading-relaxed">
                      {t(item.desc)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6 bg-accent border-b-4 border-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black text-foreground mb-8 uppercase tracking-tighter leading-none">
            {t("landing_cta_title")}
          </h2>
          <p className="text-xl text-foreground/80 mb-12 font-bold">
            {t("landing_cta_subtitle")}
          </p>
          <Button 
            size="lg"
            onClick={() => router.push("/signup")}
            className="text-2xl py-10 px-16 h-auto bg-primary hover:bg-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-4px]"
          >
            {t("landing_cta_btn")}
            <ArrowRight className="w-8 h-8" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16 px-6 relative">
        {/* Pipe decorations */}
        <div className="absolute top-0 left-10 w-16 h-8 bg-green-500 border-x-4 border-b-4 border-black rounded-b-lg" />
        <div className="absolute top-0 right-20 w-20 h-12 bg-green-500 border-x-4 border-b-4 border-black rounded-b-lg" />

        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-primary border-2 border-black rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tight">{t("landing_footer_brand")}</span>
              </div>
              <p className="text-background/60 font-medium leading-relaxed">
                {t("landing_footer_tagline")}
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-black uppercase mb-6 tracking-widest text-sm">{t("landing_footer_product")}</h4>
              <ul className="space-y-4 font-bold text-background/60">
                <li><a href="#how" className="hover:text-primary transition-colors">{t("landing_footer_link_how")}</a></li>
                <li><a href="#why" className="hover:text-primary transition-colors">{t("landing_footer_link_why")}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t("landing_footer_link_pricing")}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-black uppercase mb-6 tracking-widest text-sm">{t("landing_footer_company")}</h4>
              <ul className="space-y-4 font-bold text-background/60">
                <li><a href="#" className="hover:text-primary transition-colors">{t("landing_footer_link_about")}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t("landing_footer_link_research")}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t("landing_footer_link_contact")}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-black uppercase mb-6 tracking-widest text-sm">{t("landing_footer_legal")}</h4>
              <ul className="space-y-4 font-bold text-background/60">
                <li><a href="#" className="hover:text-primary transition-colors">{t("landing_footer_link_privacy")}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t("landing_footer_link_terms")}</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">{t("landing_footer_link_ethics")}</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t-2 border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-background/40 font-bold text-sm">
            <p>{t("landing_footer_copyright")}</p>
            <div className="flex gap-6">
              <Trophy className="w-5 h-5 hover:text-accent cursor-pointer" />
              <Star className="w-5 h-5 hover:text-accent cursor-pointer" />
              <Sparkles className="w-5 h-5 hover:text-accent cursor-pointer" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}