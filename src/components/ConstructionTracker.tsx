import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  HardHat,
  Truck,
  Wrench,
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  Shield,
  Activity,
} from 'lucide-react';
import { ConstructionPhase, MachineryResource } from '../types/warehouse';
import { PROJECT_DETAILS } from '../data/initialMasterplan';

interface ConstructionTrackerProps {
  phases: ConstructionPhase[];
  machinery: MachineryResource[];
  onToggleTask: (phaseNum: number, milestoneIdx: number, taskId: string) => void;
  language?: 'en' | 'hi';
}

export const ConstructionTracker: React.FC<ConstructionTrackerProps> = ({
  phases,
  machinery,
  onToggleTask,
  language = 'en',
}) => {
  const isHi = language === 'hi';
  const [selectedPhase, setSelectedPhase] = useState<number>(3); // currently on Phase 3/4
  const [activeDay, setActiveDay] = useState<number>(24);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>('p3-m3');

  // Overall calculations
  const totalTasks = phases.reduce(
    (acc, p) => acc + p.milestones.reduce((mAcc, m) => mAcc + m.tasks.length, 0),
    0
  );
  const completedTasks = phases.reduce(
    (acc, p) => acc + p.milestones.reduce((mAcc, m) => mAcc + m.tasks.filter((t) => t.completed).length, 0),
    0
  );
  const overallPercentage = Math.round((completedTasks / (totalTasks || 1)) * 100);

  const currentPhaseData = phases.find((p) => p.phaseNumber === selectedPhase) || phases[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Masterplan Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5">
                <HardHat className="w-3.5 h-3.5" />
                {isHi ? '30-दिवसीय निर्माण मास्टरप्लान' : '30-Day PEB Masterplan'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {PROJECT_DETAILS.docRevision}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {isHi ? PROJECT_DETAILS.titleHi : PROJECT_DETAILS.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              {isHi
                ? `${PROJECT_DETAILS.locationHi} | कुल क्षेत्रफल: ${PROJECT_DETAILS.totalPlotArea} m² | निर्मित क्षेत्र: ${PROJECT_DETAILS.groundCoverage} m² (56% Ground Coverage)`
                : `${PROJECT_DETAILS.location} | Plot Area: ${PROJECT_DETAILS.totalPlotArea.toLocaleString()} m² | Built-up Coverage: ${PROJECT_DETAILS.groundCoverage.toLocaleString()} m²`}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-center min-w-[110px]">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                {isHi ? 'निर्माण प्रगति' : 'Build Progress'}
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {overallPercentage}%
              </span>
            </div>
            <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-center min-w-[110px]">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                {isHi ? 'सक्रिय दिवस' : 'Active Day'}
              </span>
              <span className="text-2xl font-black text-sky-400 font-mono">
                Day {activeDay} <span className="text-xs font-normal text-slate-400">/ 30</span>
              </span>
            </div>
          </div>
        </div>

        {/* 30-Day Linear Stepper Bar */}
        <div className="mt-6 pt-5 border-t border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              {isHi ? '30-दिवसीय समय-सारणी प्रगति (Timeline Tracker)' : '30-Day Master Timeline'}
            </span>
            <span className="font-mono text-slate-400">
              {completedTasks} of {totalTasks} Tasks Verified
            </span>
          </div>

          <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-30 gap-1">
            {Array.from({ length: 30 }).map((_, idx) => {
              const day = idx + 1;
              const isPast = day < activeDay;
              const isCurrent = day === activeDay;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`h-7 rounded flex items-center justify-center font-mono text-[10px] font-bold transition-all ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 scale-105 z-10'
                      : isPast
                      ? 'bg-emerald-600/80 hover:bg-emerald-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                  }`}
                  title={`Day ${day}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 Phases Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {phases.map((phase) => {
          const isSelected = selectedPhase === phase.phaseNumber;
          const isComplete = phase.progress >= 100;
          return (
            <button
              key={phase.phaseNumber}
              onClick={() => setSelectedPhase(phase.phaseNumber)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-slate-800 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Phase 0{phase.phaseNumber} ({phase.days})
                </span>
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Clock className="w-4 h-4 text-sky-400" />
                )}
              </div>
              <h4 className="text-xs font-bold text-white line-clamp-1 mb-2">
                {isHi ? phase.titleHi : phase.title}
              </h4>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Phase Progress</span>
                <span className="font-mono font-bold text-white">{phase.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${phase.progress}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Phase Detail & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Milestone Task Cards */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                  Phase {currentPhaseData.phaseNumber} Detailed Engineering Schedule
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {isHi ? currentPhaseData.titleHi : currentPhaseData.title}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">
                {currentPhaseData.days}
              </span>
            </div>

            {/* Milestones list */}
            <div className="space-y-4">
              {currentPhaseData.milestones.map((milestone, mIdx) => {
                const milestoneKey = `p${currentPhaseData.phaseNumber}-m${mIdx}`;
                const isExpanded = expandedMilestone === milestoneKey;
                return (
                  <div
                    key={mIdx}
                    className="border border-slate-800 rounded-xl bg-slate-800/40 overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedMilestone(isExpanded ? null : milestoneKey)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-950 text-sky-400 font-mono text-xs font-bold border border-sky-800">
                          {milestone.dayRange}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            {isHi ? milestone.titleHi : milestone.title}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {isHi ? milestone.descriptionHi : milestone.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {milestone.status === 'completed' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            COMPLETED
                          </span>
                        ) : milestone.status === 'in_progress' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            IN PROGRESS
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            SCHEDULED
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Tasks & Machinery */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-900/40 space-y-3">
                        <div className="space-y-2">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Milestone Action Checklist:
                          </span>
                          {milestone.tasks.map((task) => (
                            <label
                              key={task.id}
                              className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-200 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() =>
                                  onToggleTask(currentPhaseData.phaseNumber, mIdx, task.id)
                                }
                                className="mt-0.5 rounded accent-amber-500 w-4 h-4"
                              />
                              <span className={task.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                                {isHi ? task.textHi : task.text}
                              </span>
                            </label>
                          ))}
                        </div>

                        {/* Machinery used for milestone */}
                        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                            <Truck className="w-3.5 h-3.5 text-amber-400" />
                            Deployed Equipment:
                          </span>
                          {milestone.machineryUsed.map((m, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px] border border-slate-700"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quality Control & Safety Advisory (from Masterplan PDF Page 3) */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block mb-0.5">
                {isHi
                  ? 'गुणवत्ता एवं सुरक्षा चेतावनी (Quality Control & Safety Warning):'
                  : 'Quality Control & Site Safety Mandate:'}
              </span>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                {isHi
                  ? 'फास्ट-ट्रैक निर्माण के दौरान कंक्रीट में Accelerating Admixtures का सही अनुपात सुनिश्चित करें। उच्च ऊंचाई पर PEB इरेक्शन के दौरान सेफ्टी नेट्स और लाइफलाइन हार्नेस का प्रयोग अनिवार्य है।'
                  : 'Maintain strict proportioning of Rapid-Hardening Accelerating Admixtures for M35 pedestals and M25 VDF Trimix flooring. Safety nets and dual-carabiner lifeline harnesses are strictly mandatory during 50-Ton crane tandem high-altitude erection.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Machinery & Heavy Resources Table */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                {isHi ? 'आवश्यक संसाधन एवं मशीनरी' : 'Heavy Resources & Machinery'}
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            <div className="space-y-3">
              {machinery.map((mach) => (
                <div
                  key={mach.id}
                  className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        {isHi ? mach.categoryHi : mach.category}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-0.5">
                        {isHi ? mach.equipmentHi : mach.equipment}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono font-bold text-xs border border-amber-500/20">
                      {mach.quantity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {isHi ? mach.purposeHi : mach.purpose}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Signatures & Certification Box (from Masterplan PDF Page 3) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-xs">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              {isHi ? 'प्रमाणीकरण एवं स्वीकृति (Approval & Sign-off)' : 'Executive Sign-Off & Verification'}
            </h4>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="text-slate-400 text-[10px] block">
                  {isHi ? 'परियोजना प्रमुख (Project Head):' : 'Project Head / Chief Engineer:'}
                </span>
                <span className="text-white font-semibold text-xs block mt-0.5">
                  {PROJECT_DETAILS.chiefEngineer}
                </span>
                <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> Signed & Approved (PEB Division)
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="text-slate-400 text-[10px] block">
                  {isHi ? 'क्लाइंट स्वीकृति (Client Approval):' : 'Client Approval / Site Office:'}
                </span>
                <span className="text-white font-semibold text-xs block mt-0.5">
                  {PROJECT_DETAILS.clientRep}
                </span>
                <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" /> Commissioning In-Progress
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
