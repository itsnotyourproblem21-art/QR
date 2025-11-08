// OAT General Chemistry — Full-Length Section (30 Q, 30:00)
// Keep the exact look-and-feel. Added EXHIBIT modal with Periodic Table.

import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "oat_genchem_full_exam_user_state_v1";

// -------- Questions (sample GC items). Keep length at 30. Replace/add as needed. --------
// Question object: { stem: string, c: string[4], a: number }
const QUESTIONS = [
  // Stoichiometry
  { stem: "Nitric oxide, NO, rapidly reacts with O₂ to form NO₂. How many grams of NO are required to completely react with 1.75 g of O₂?", c: ["(1/32)(2/1)(30/1)", "1.75(1/32)(30/1)", "1.75(1/16)(2/1)(30/1)", "1.75(1/32)(2/1)(30/1)", "(1/16)(30/1)"], a: 3 },
  // Gas laws
  { stem: "At constant volume, pressure is directly proportional to absolute temperature. Which gas law is this?", c: ["Boyle's Law", "Charles's Law", "Gay-Lussac's Law", "Avogadro's Law"], a: 2 },
  // Acid-base
  { stem: "Which aqueous solution has the lowest pH at 25°C?", c: ["0.10 M NH₃ (Kb = 1.8×10⁻⁵)", "0.10 M HCN (Ka = 6.2×10⁻¹⁰)", "0.10 M HCl", "0.10 M NaOAc (acetic acid Ka = 1.8×10⁻⁵)"], a: 2 },
  // Thermo
  { stem: "For an endothermic reaction with positive ΔS, the reaction is:", c: ["Spontaneous at all T", "Nonspontaneous at all T", "Spontaneous only at low T", "Spontaneous only at high T"], a: 3 },
  // Periodic trends
  { stem: "Which atom has the largest first ionization energy?", c: ["Na", "Cl", "K", "S"], a: 1 },
  // Solutions/colligative
  { stem: "Adding NaCl to water primarily changes which property?", c: ["Vapor pressure (decreases)", "Density (decreases)", "Boiling point (decreases)", "Freezing point (increases)"], a: 0 },
  // Equilibrium
  { stem: "For the reaction N₂O₄(g) ⇌ 2 NO₂(g), which change shifts equilibrium to the right?", c: ["Decrease T (exo forward)", "Increase volume of container", "Add inert gas at constant V", "Remove NO₂"], a: 1 },
  // Kinetics
  { stem: "A plot of ln[A] vs time is linear. The reaction order in A is:", c: ["Zero", "First", "Second", "Third"], a: 1 },
  // Redox
  { stem: "In the acidic half-reaction method, what is the coefficient of H₂O when balancing Cr₂O₇²⁻ → Cr³⁺?", c: ["7 on product side", "7 on reactant side", "14 on product side", "None"], a: 0 },
  // Bonding/VSEPR
  { stem: "What is the molecular geometry of SF₄?", c: ["Tetrahedral", "Trigonal bipyramidal", "Seesaw", "Square planar"], a: 2 },
  // States/IMFs
  { stem: "Which has the highest normal boiling point?", c: ["CH₄", "C₂H₆", "C₃H₈", "C₄H₁₀"], a: 3 },
  // Electrochemistry
  { stem: "For a galvanic cell, which is true?", c: ["Electrons flow anode→cathode; E°cell > 0", "Electrons flow cathode→anode; E°cell < 0", "Oxidation at cathode", "Cations flow to anode through salt bridge"], a: 0 },
  // Gases (real vs ideal)
  { stem: "Compared with ideal behavior, a real gas at high pressure shows:", c: ["Lower P due to attractions", "Higher P due to attractions", "Same P because b cancels a", "No dependence on a or b"], a: 0 },
  // Buffers
  { stem: "A buffer is made by mixing 0.20 mol HA (Ka=1.0×10⁻⁵) and 0.10 mol A⁻ in 1.0 L. pH is roughly:", c: ["4.70", "4.30", "5.00", "9.70"], a: 1 },
  // Nuclear
  { stem: "Which radiation has the greatest penetrating power?", c: ["α", "β", "γ", "Positron"], a: 2 },
  // Orbitals
  { stem: "How many orbitals are in a 4d subshell?", c: ["5", "7", "9", "10"], a: 0 },
  // Titrations
  { stem: "At the equivalence point of a strong acid–strong base titration, the pH is:", c: ["< 7", "= 7", "> 7", "Cannot be determined"], a: 1 },
  // Extra placeholders to keep length == 40
  ...Array.from({ length: 13 }).map((_, i) => ({
    stem: `Placeholder general chemistry question ${i + 1}. Replace with real content.`,
    c: ["A", "B", "C", "D"],
    a: 0,
  })),
];

// Embed the periodic table as a data URI so it always loads in the EXHIBIT modal (no filesystem path needed).
const PERIODIC_TABLE_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA78AAAK4CAYAAAC8b7EwAAABaElEQVR4nO3RAQ0AAAgDIN8/9K3hYwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const pad = (n) => String(n).padStart(2, "0");
const fmtMMSS = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

export default function OATGenChemExam() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [view, setView] = useState("intro");
  const [delayOn, setDelayOn] = useState(true);
  const [accom, setAccom] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showExhibit, setShowExhibit] = useState(false);

  // persist
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, marked })); } catch {} }, [answers, marked]);
  useEffect(() => { try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return; const v = JSON.parse(raw); if (v.answers) setAnswers(v.answers); if (v.marked) setMarked(v.marked);} catch {} }, []);

  // timer
  useEffect(() => { if (view !== "test" || timeLeft === null) return; if (timeLeft <= 0) { setView("results"); return; } const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000); return () => clearTimeout(id); }, [view, timeLeft]);

  const startExam = () => { const base = 60 * 30; setTimeLeft(accom ? Math.floor(base * 1.5) : base); setCurrent(0); setView("test"); };
  const go = (d) => { const act = () => setCurrent((i) => Math.min(Math.max(i + d, 0), QUESTIONS.length - 1)); if (delayOn) setTimeout(act, 2000); else act(); };
  const jumpToReview = (idx) => { setCurrent(idx); const act = () => setView("test"); if (delayOn) setTimeout(act, 2000); else act(); };
  const calcScore = () => { let correct = 0; for (let i = 0; i < QUESTIONS.length; i++) if (answers[i] === QUESTIONS[i].a) correct++; return { correct, total: QUESTIONS.length }; };

  const Intro = () => (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex items-center justify-between bg-[#0e5c84] text-white px-4 h-[54px]">
        <button aria-label="Close" className="w-8 h-8 rounded-full bg-[#2d6f93] flex items-center justify-center text-xl leading-none">×</button>
        <div className="text-center leading-tight">
          <div className="text-sm">Bootcamp.com | OAT</div>
          <div className="text-[11px] opacity-90">General Chemistry Practice Test 1</div>
        </div>
        <div className="text-[11px] opacity-90">&nbsp;</div>
      </div>

      <div className="flex-1 flex justify-center items-start pt-10 pb-6 overflow-auto bg-white">
        <div className="w-[62%] min-w-[740px] bg-white">
          <div className="border-2 border-black p-8 mb-6">
            <h2 className="font-semibold text-lg mb-2">This is General Chemistry Practice Test 1. Read before starting:</h2>
            <ol className="list-decimal ml-6 space-y-1 text-sm">
              <li>You have 30 minutes to finish {QUESTIONS.length} questions.</li>
              <li>You can review questions before ending the section.</li>
              <li>Your score analysis appears after finishing.</li>
            </ol>
            <p className="text-sm mt-4">Click NEXT to continue.</p>
          </div>

          <h3 className="font-semibold mb-2">Test Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-slate-100 border rounded p-3">
              <button onClick={() => setDelayOn(v => !v)} className={`w-12 h-6 rounded-full transition ${delayOn ? 'bg-green-500' : 'bg-slate-300'}`}>
                <span className={`block h-6 w-6 bg-white rounded-full transition ${delayOn ? 'translate-x-6' : ''}`}></span>
              </button>
              <div className="text-sm"><span className="font-semibold">Prometric Delay:</span> Adds ~2s delay on navigation and review.</div>
            </div>
            <div className="flex items-center gap-3 bg-slate-100 border rounded p-3">
              <button onClick={() => setAccom(v => !v)} className={`w-12 h-6 rounded-full transition ${accom ? 'bg-green-500' : 'bg-slate-300'}`}>
                <span className={`block h-6 w-6 bg-white rounded-full transition ${accom ? 'translate-x-6' : ''}`}></span>
              </button>
              <div className="text-sm"><span className="font-semibold">Time Accommodations:</span> 1.5x time if enabled.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[#0e5c84] h-[64px] px-6">
        <button className="px-10 py-2 text-[13px] font-semibold text-white border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] rounded-none bg-gradient-to-b from-[#396f96] to-[#1d4e72] active:to-[#153c56]" onClick={startExam}>NEXT</button>
      </div>
    </div>
  );

  const Review = () => {
    const rows = QUESTIONS.map((_, i) => ({ i, name: `Question ${i + 1}`, isMarked: !!marked[i], isDone: answers[i] !== undefined, isSkipped: answers[i] === undefined }));
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex items-center justify-between bg-[#0e5c84] text-white px-4 h-[54px]">
          <button aria-label="Close" className="w-8 h-8 rounded-full bg-[#2d6f93] flex items-center justify-center text-xl leading-none">×</button>
          <div className="text-center leading-tight">
            <div className="text-sm">Bootcamp.com | OAT</div>
            <div className="text-[11px] opacity-90">Review Questions</div>
          </div>
          <div className="text-sm whitespace-nowrap">Time remaining: {fmtMMSS(timeLeft ?? 0)}</div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-[980px] mx-auto">
            <div className="border border-[#6a89a0] shadow-sm">
              <div className="grid grid-cols-4 bg-[#5f85a0] text-white text-sm font-semibold">
                <div className="px-3 py-2 border-r border-[#4f7288]">Name</div>
                <div className="px-3 py-2 border-r border-[#4f7288]">Marked</div>
                <div className="px-3 py-2 border-r border-[#4f7288]">Completed</div>
                <div className="px-3 py-2">Skipped</div>
              </div>
              <div className="max-h-[480px] overflow-auto bg-white">
                {rows.map((r) => (
                  <button key={r.i} className="grid grid-cols-4 w-full text-left text-sm hover:bg-[#eef6ff] focus:bg-[#eef6ff]" onClick={() => jumpToReview(r.i)}>
                    <div className="px-3 py-2 border-t border-[#9eb1bf] border-r flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="text-emerald-600"><path fill="currentColor" d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1v5h5"/></svg>
                      {r.name}
                    </div>
                    <div className="px-3 py-2 border-t border-[#9eb1bf] border-r">{r.isMarked ? 'Yes' : ''}</div>
                    <div className="px-3 py-2 border-t border-[#9eb1bf] border-r">{r.isDone ? 'Yes' : ''}</div>
                    <div className="px-3 py-2 border-t border-[#9eb1bf]">{r.isSkipped ? 'Yes' : ''}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-[#0e5c84] h-[64px] px-6">
          <div className="flex gap-4">
            <button onClick={() => jumpToReview(rows.findIndex((r) => r.isMarked))} className="px-5 py-2 text-[13px] font-semibold text-white border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] rounded-none bg-gradient-to-b from-[#396f96] to-[#1d4e72] active:to-[#153c56]">REVIEW MARKED</button>
            <button onClick={() => jumpToReview(0)} className="px-5 py-2 text-[13px] font-semibold text-white border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] rounded-none bg-gradient-to-b from-[#396f96] to-[#1d4e72] active:to-[#153c56]">REVIEW ALL</button>
            <button onClick={() => jumpToReview(rows.findIndex((r) => !r.isDone))} className="px-5 py-2 text-[13px] font-semibold text-white border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] rounded-none bg-gradient-to-b from-[#396f96] to-[#1d4e72] active:to-[#153c56]">REVIEW INCOMPLETE</button>
          </div>
          <button onClick={() => setView('results')} className="px-8 py-2 text-[13px] font-semibold text-white border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] rounded-none bg-gradient-to-b from-[#396f96] to-[#1d4e72] active:to-[#153c56]">END</button>
        </div>
      </div>
    );
  };

  const Test = () => {
    const q = QUESTIONS[current];
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex items-center justify-between bg-[#0a6ea0] text-white px-6 py-2 h-[46px]">
          <div className="text-sm font-semibold">Question {current + 1} of {QUESTIONS.length}</div>
          <div className="text-[11px] opacity-90">General Chemistry — Full Exam</div>
          <div className="text-sm">Time remaining: {timeLeft !== null ? fmtMMSS(timeLeft) : "--:--"}</div>
        </div>

        <div className="flex-1 flex justify-center items-start pt-8 pb-6 overflow-auto bg-white">
          <div className="w-[62%] min-w-[740px] bg-white border border-black/80 p-8 relative">
            {marked[current] && <span className="absolute -top-6 right-0 bg-yellow-300 text-black text-xs font-semibold px-3 py-1 rounded-t-md shadow">MARKED</span>}

            <div className="mb-5">
              <p className="mb-4 leading-relaxed">{q.stem}</p>
              <div className="flex flex-col gap-3 text-sm">
                {q.c.map((choice, i) => (
                  <label key={i} className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" className="mt-1" checked={answers[current] === i} onChange={() => setAnswers((prev) => ({ ...prev, [current]: i }))} />
                    <span>{String.fromCharCode(65 + i)}. {choice}</span>
                  </label>
                ))}
              </div>
            </div>

            <p className="mt-6 text-xs">Click NEXT to continue.</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-[#0a6ea0] h-[50px] px-6">
          <div className="flex gap-2">
            <button className={`${current === 0 ? 'bg-slate-500 text-white opacity-50 cursor-not-allowed' : 'bg-gradient-to-b from-[#396f96] to-[#1d4e72] text-white'} px-8 py-1.5 text-sm font-semibold rounded-none border border-white/40 shadow-sm`} disabled={current === 0} onClick={() => go(-1)}>PREVIOUS</button>
          </div>

          <div className="flex justify-center flex-1">
            <button className="px-10 py-1.5 text-sm font-semibold rounded-none border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] bg-gradient-to-b from-[#396f96] to-[#1d4e72] active:to-[#153c56] text-white" onClick={() => { const act = () => { if (current < QUESTIONS.length - 1) setCurrent((n) => n + 1); else setView('results'); }; if (delayOn) setTimeout(act, 2000); else act(); }}>{current < QUESTIONS.length - 1 ? 'NEXT' : 'END SECTION'}</button>
          </div>

          <div className="flex gap-2">
            <button className={`${marked[current] ? 'bg-yellow-300 text-[#0a6ea0] border-yellow-600' : 'bg-gradient-to-b from-[#396f96] to-[#1d4e72] text-white'} px-5 py-1.5 text-sm font-semibold rounded-none border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]`} onClick={() => setMarked((prev) => ({ ...prev, [current]: !prev[current] }))}>MARK</button>
            <button className="px-5 py-1.5 text-sm font-semibold rounded-none border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] bg-gradient-to-b from-[#396f96] to-[#1d4e72] text-white active:to-[#153c56]" onClick={() => setShowExhibit(true)}>EXHIBIT</button>
            <button className="px-5 py-1.5 text-sm font-semibold rounded-none border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] bg-gradient-to-b from-[#396f96] to-[#1d4e72] text-white active:to-[#153c56]" onClick={() => { const act = () => setView('review'); if (delayOn) setTimeout(act, 2000); else act(); }}>REVIEW</button>
          </div>
        </div>

        {showExhibit && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50" onClick={() => setShowExhibit(false)}>
            <div className="bg-white rounded shadow-xl w-[90%] max-w-[1100px]" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b px-4 py-2 bg-[#0a6ea0] text-white">
                <span>Exhibit — Periodic Table</span>
                <button onClick={() => setShowExhibit(false)} className="font-bold">×</button>
              </div>
              <div className="p-3 overflow-auto max-h-[80vh] bg-white">
                <img src={PERIODIC_TABLE_SRC} alt="Periodic Table" className="w-full h-auto" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Results = () => {
    const { correct, total } = calcScore();
    return (
      <div className="p-4 flex flex-col gap-3 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">Results</h1>
        <p className="text-slate-600 text-sm">Score: {correct} / {total} ({Math.round((correct / total) * 100)}%).</p>
        <div className="mt-4 grid grid-cols-1 gap-3">
          {QUESTIONS.map((q, i) => {
            const sel = answers[i];
            const correctAns = q.a;
            return (
              <div key={i} className={`${sel === correctAns ? 'border-emerald-400 bg-emerald-50' : 'border-rose-300 bg-rose-50'} border rounded p-3`}>
                <div className="font-medium mb-2">{i + 1}. {q.stem}</div>
                <ul className="ml-4 text-sm mb-1 list-disc">
                  {q.c.map((choice, j) => (
                    <li key={j} className={j === correctAns ? 'font-semibold' : ''}>
                      {String.fromCharCode(65 + j)}. {choice} {j === correctAns ? '(correct)' : ''} {sel === j && j !== correctAns ? '(your answer)' : ''}
                    </li>
                  ))}
                </ul>
                {marked[i] && <div className="text-[11px] inline-block bg-yellow-200 px-2 py-[2px] rounded">MARKED</div>}
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 mt-4">
          <button className="px-3 py-1 bg-slate-900 text-white rounded" onClick={() => setView('intro')}>Back to Start</button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {view === "intro" && <Intro />}
      {view === "test" && <Test />}
      {view === "review" && <Review />}
      {view === "results" && <Results />}
    </div>
  );
}
