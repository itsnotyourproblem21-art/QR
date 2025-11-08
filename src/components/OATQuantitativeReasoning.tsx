import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Calculator from './Calculator';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const STORAGE_KEY = 'oat_qr_exam_user_state_v1';

interface Question {
  id: string;
  question_number: number;
  stem: string;
  question_type: 'multiple_choice' | 'numeric_entry';
  choices?: string[];
  correct_answer: string;
  topic: string;
  exhibit_id?: string;
}

interface Exhibit {
  id: string;
  title: string;
  type: string;
  image_url?: string;
  data?: any;
}

const SAMPLE_QUESTIONS: Omit<Question, 'id'>[] = [
  {
    question_number: 1,
    stem: 'A survey of 200 college students found that 120 students own a laptop, 90 own a tablet, and 50 own both. How many students own neither a laptop nor a tablet?',
    question_type: 'multiple_choice',
    choices: ['30', '40', '50', '60', '70'],
    correct_answer: '1',
    topic: 'data_interpretation'
  },
  {
    question_number: 2,
    stem: 'If 3x + 7 = 25, what is the value of x?',
    question_type: 'numeric_entry',
    correct_answer: '6',
    topic: 'algebra'
  },
  {
    question_number: 3,
    stem: 'A store sells apples for $1.50 per pound. If apples go on sale for 20% off, what is the new price per pound?',
    question_type: 'multiple_choice',
    choices: ['$1.00', '$1.20', '$1.30', '$1.40', '$1.50'],
    correct_answer: '1',
    topic: 'percentages'
  },
  {
    question_number: 4,
    stem: 'The mean of five numbers is 18. If four of the numbers are 15, 17, 20, and 22, what is the fifth number?',
    question_type: 'numeric_entry',
    correct_answer: '16',
    topic: 'statistics'
  },
  {
    question_number: 5,
    stem: 'A rectangle has a length of 12 cm and a width of 5 cm. What is the area in square centimeters?',
    question_type: 'multiple_choice',
    choices: ['17', '34', '50', '60', '70'],
    correct_answer: '3',
    topic: 'geometry'
  },
  {
    question_number: 6,
    stem: 'If the ratio of boys to girls in a class is 3:5 and there are 24 boys, how many girls are there?',
    question_type: 'numeric_entry',
    correct_answer: '40',
    topic: 'ratios'
  },
  {
    question_number: 7,
    stem: 'What is 35% of 80?',
    question_type: 'multiple_choice',
    choices: ['24', '26', '28', '30', '32'],
    correct_answer: '2',
    topic: 'percentages'
  },
  {
    question_number: 8,
    stem: 'A circle has a radius of 7 meters. What is its circumference? (Use π ≈ 3.14)',
    question_type: 'multiple_choice',
    choices: ['21.98 m', '43.96 m', '49.00 m', '153.86 m', '154.00 m'],
    correct_answer: '1',
    topic: 'geometry'
  },
  {
    question_number: 9,
    stem: 'If a car travels 180 miles in 3 hours, what is its average speed in miles per hour?',
    question_type: 'numeric_entry',
    correct_answer: '60',
    topic: 'word_problems'
  },
  {
    question_number: 10,
    stem: 'The median of the dataset {5, 12, 8, 15, 20} is:',
    question_type: 'multiple_choice',
    choices: ['8', '10', '12', '15', '20'],
    correct_answer: '2',
    topic: 'statistics'
  },
  {
    question_number: 11,
    stem: 'A right triangle has legs of length 6 cm and 8 cm. What is the length of the hypotenuse?',
    question_type: 'numeric_entry',
    correct_answer: '10',
    topic: 'geometry'
  },
  {
    question_number: 12,
    stem: 'If x² = 144, what are the possible values of x?',
    question_type: 'multiple_choice',
    choices: ['12 only', '-12 only', '±12', '±72', '±144'],
    correct_answer: '2',
    topic: 'algebra'
  },
  {
    question_number: 13,
    stem: 'A store marks up the cost of an item by 40%. If the cost is $50, what is the selling price?',
    question_type: 'multiple_choice',
    choices: ['$60', '$65', '$70', '$75', '$80'],
    correct_answer: '2',
    topic: 'percentages'
  },
  {
    question_number: 14,
    stem: 'What is the mode of the dataset {3, 7, 3, 9, 3, 5, 7}?',
    question_type: 'numeric_entry',
    correct_answer: '3',
    topic: 'statistics'
  },
  {
    question_number: 15,
    stem: 'If 2x - 5 = 13, what is x?',
    question_type: 'multiple_choice',
    choices: ['4', '6', '8', '9', '10'],
    correct_answer: '3',
    topic: 'algebra'
  },
  {
    question_number: 16,
    stem: 'A cube has a volume of 64 cubic centimeters. What is the length of one edge?',
    question_type: 'numeric_entry',
    correct_answer: '4',
    topic: 'geometry'
  },
  {
    question_number: 17,
    stem: 'If 15 is 30% of a number, what is that number?',
    question_type: 'multiple_choice',
    choices: ['30', '40', '45', '50', '60'],
    correct_answer: '3',
    topic: 'percentages'
  },
  {
    question_number: 18,
    stem: 'The perimeter of a square is 36 cm. What is the area in square centimeters?',
    question_type: 'multiple_choice',
    choices: ['36', '64', '72', '81', '144'],
    correct_answer: '3',
    topic: 'geometry'
  },
  {
    question_number: 19,
    stem: 'If y = 3x + 2 and x = 4, what is y?',
    question_type: 'numeric_entry',
    correct_answer: '14',
    topic: 'algebra'
  },
  {
    question_number: 20,
    stem: 'A bag contains 5 red marbles and 8 blue marbles. What is the probability of randomly selecting a red marble?',
    question_type: 'multiple_choice',
    choices: ['5/13', '5/8', '8/13', '8/5', '1/2'],
    correct_answer: '0',
    topic: 'probability'
  },
  {
    question_number: 21,
    stem: 'What is 150% of 60?',
    question_type: 'numeric_entry',
    correct_answer: '90',
    topic: 'percentages'
  },
  {
    question_number: 22,
    stem: 'The range of the dataset {12, 8, 15, 20, 9} is:',
    question_type: 'multiple_choice',
    choices: ['8', '10', '12', '15', '20'],
    correct_answer: '2',
    topic: 'statistics'
  },
  {
    question_number: 23,
    stem: 'If a triangle has angles measuring 45° and 60°, what is the measure of the third angle?',
    question_type: 'numeric_entry',
    correct_answer: '75',
    topic: 'geometry'
  },
  {
    question_number: 24,
    stem: 'Solve for x: 4x + 8 = 32',
    question_type: 'multiple_choice',
    choices: ['4', '5', '6', '7', '8'],
    correct_answer: '2',
    topic: 'algebra'
  },
  {
    question_number: 25,
    stem: 'A recipe calls for 2 cups of flour for every 3 cups of sugar. If you use 8 cups of flour, how many cups of sugar do you need?',
    question_type: 'numeric_entry',
    correct_answer: '12',
    topic: 'ratios'
  },
  {
    question_number: 26,
    stem: 'What is the area of a triangle with base 10 cm and height 6 cm?',
    question_type: 'multiple_choice',
    choices: ['16 cm²', '30 cm²', '40 cm²', '60 cm²', '120 cm²'],
    correct_answer: '1',
    topic: 'geometry'
  },
  {
    question_number: 27,
    stem: 'If a shirt costs $40 and is on sale for 25% off, what is the sale price?',
    question_type: 'multiple_choice',
    choices: ['$10', '$20', '$25', '$30', '$35'],
    correct_answer: '3',
    topic: 'percentages'
  },
  {
    question_number: 28,
    stem: 'What is the value of 5² + 3²?',
    question_type: 'numeric_entry',
    correct_answer: '34',
    topic: 'algebra'
  },
  {
    question_number: 29,
    stem: 'A cylinder has a radius of 3 cm and a height of 10 cm. What is the volume? (Use π ≈ 3.14, V = πr²h)',
    question_type: 'multiple_choice',
    choices: ['94.2 cm³', '188.4 cm³', '282.6 cm³', '376.8 cm³', '942.0 cm³'],
    correct_answer: '2',
    topic: 'geometry'
  },
  {
    question_number: 30,
    stem: 'If 5x = 75, what is x?',
    question_type: 'numeric_entry',
    correct_answer: '15',
    topic: 'algebra'
  },
  {
    question_number: 31,
    stem: 'The average of 6 numbers is 15. What is their sum?',
    question_type: 'multiple_choice',
    choices: ['60', '75', '80', '90', '100'],
    correct_answer: '3',
    topic: 'statistics'
  },
  {
    question_number: 32,
    stem: 'A rectangular garden is 15 feet long and 8 feet wide. What is the perimeter in feet?',
    question_type: 'numeric_entry',
    correct_answer: '46',
    topic: 'geometry'
  },
  {
    question_number: 33,
    stem: 'If a product increases in price from $80 to $100, what is the percent increase?',
    question_type: 'multiple_choice',
    choices: ['15%', '20%', '25%', '30%', '40%'],
    correct_answer: '2',
    topic: 'percentages'
  },
  {
    question_number: 34,
    stem: 'Solve for x: x/4 = 12',
    question_type: 'numeric_entry',
    correct_answer: '48',
    topic: 'algebra'
  },
  {
    question_number: 35,
    stem: 'What is the diagonal of a rectangle with length 12 cm and width 5 cm?',
    question_type: 'multiple_choice',
    choices: ['13 cm', '14 cm', '15 cm', '16 cm', '17 cm'],
    correct_answer: '0',
    topic: 'geometry'
  },
  {
    question_number: 36,
    stem: 'If 3/4 of a number is 60, what is the number?',
    question_type: 'numeric_entry',
    correct_answer: '80',
    topic: 'algebra'
  },
  {
    question_number: 37,
    stem: 'A box contains 12 red balls, 8 blue balls, and 4 green balls. What fraction of the balls are blue?',
    question_type: 'multiple_choice',
    choices: ['1/3', '1/4', '2/3', '1/2', '3/4'],
    correct_answer: '0',
    topic: 'probability'
  },
  {
    question_number: 38,
    stem: 'What is 40% of 150?',
    question_type: 'numeric_entry',
    correct_answer: '60',
    topic: 'percentages'
  },
  {
    question_number: 39,
    stem: 'The sum of three consecutive integers is 30. What is the smallest of these integers?',
    question_type: 'multiple_choice',
    choices: ['8', '9', '10', '11', '12'],
    correct_answer: '1',
    topic: 'algebra'
  },
  {
    question_number: 40,
    stem: 'A train travels 240 miles in 4 hours. At this rate, how far will it travel in 7 hours?',
    question_type: 'numeric_entry',
    correct_answer: '420',
    topic: 'word_problems'
  }
];

const pad = (n: number) => String(n).padStart(2, '0');
const fmtMMSS = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

export default function OATQuantitativeReasoning() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [marked, setMarked] = useState<Record<number, boolean>>({});
  const [view, setView] = useState<'intro' | 'test' | 'review' | 'results'>('intro');
  const [delayOn, setDelayOn] = useState(true);
  const [accom, setAccom] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showExhibit, setShowExhibit] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('qr_questions')
        .select('*')
        .order('question_number');

      if (error) throw error;

      if (data && data.length > 0) {
        setQuestions(data as Question[]);
      } else {
        const questionsWithIds = SAMPLE_QUESTIONS.map((q, idx) => ({
          ...q,
          id: `sample-${idx}`
        }));
        setQuestions(questionsWithIds);
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      const questionsWithIds = SAMPLE_QUESTIONS.map((q, idx) => ({
        ...q,
        id: `sample-${idx}`
      }));
      setQuestions(questionsWithIds);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, marked }));
    } catch {}
  }, [answers, marked]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const v = JSON.parse(raw);
      if (v.answers) setAnswers(v.answers);
      if (v.marked) setMarked(v.marked);
    } catch {}
  }, []);

  useEffect(() => {
    if (view !== 'test' || timeLeft === null) return;
    if (timeLeft <= 0) {
      endTest();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [view, timeLeft]);

  const startExam = async () => {
    const base = 60 * 45;
    const timeLimit = accom ? Math.floor(base * 1.5) : base;
    setTimeLeft(timeLimit);
    setCurrent(0);
    setView('test');

    try {
      const { data, error } = await supabase
        .from('qr_test_attempts')
        .insert({
          time_limit_seconds: timeLimit,
          has_accommodation: accom,
          has_prometric_delay: delayOn,
          total_questions: questions.length,
          status: 'in_progress'
        })
        .select()
        .single();

      if (!error && data) {
        setAttemptId(data.id);
      }
    } catch (err) {
      console.error('Error creating test attempt:', err);
    }
  };

  const endTest = async () => {
    setView('results');
    const score = calculateScore();

    if (attemptId) {
      try {
        const timeUsed = (accom ? 4050 : 2700) - (timeLeft ?? 0);

        await supabase
          .from('qr_test_attempts')
          .update({
            completed_at: new Date().toISOString(),
            time_used_seconds: timeUsed,
            score: score.correct,
            status: 'completed'
          })
          .eq('id', attemptId);

        for (const [qNum, userAnswer] of Object.entries(answers)) {
          const questionNumber = parseInt(qNum);
          const question = questions[questionNumber];
          if (!question) continue;

          const isCorrect = checkAnswer(question, userAnswer);

          await supabase.from('qr_user_answers').upsert({
            attempt_id: attemptId,
            question_id: question.id,
            question_number: questionNumber + 1,
            user_answer: userAnswer,
            is_correct: isCorrect,
            is_marked: marked[questionNumber] || false
          });
        }
      } catch (err) {
        console.error('Error saving test results:', err);
      }
    }
  };

  const go = (d: number) => {
    const act = () =>
      setCurrent((i) => Math.min(Math.max(i + d, 0), questions.length - 1));
    if (delayOn) setTimeout(act, 2000);
    else act();
  };

  const jumpToReview = (idx: number) => {
    setCurrent(idx);
    const act = () => setView('test');
    if (delayOn) setTimeout(act, 2000);
    else act();
  };

  const checkAnswer = (question: Question, userAnswer: string): boolean => {
    if (question.question_type === 'multiple_choice') {
      return userAnswer === question.correct_answer;
    } else {
      const userNum = parseFloat(userAnswer);
      const correctNum = parseFloat(question.correct_answer);
      return !isNaN(userNum) && Math.abs(userNum - correctNum) < 0.01;
    }
  };

  const calculateScore = () => {
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] !== undefined && checkAnswer(questions[i], answers[i])) {
        correct++;
      }
    }
    return { correct, total: questions.length };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-lg">Loading test...</p>
      </div>
    );
  }

  const Intro = () => (
    <div className="flex flex-col h-screen bg-[#f5f5f0]">
      <div className="flex items-center justify-between bg-[#0e5c84] text-white px-4 h-[54px]">
        <button
          aria-label="Close"
          className="w-8 h-8 rounded-full bg-[#2d6f93] flex items-center justify-center text-xl leading-none hover:bg-[#366b8f]"
        >
          ×
        </button>
        <div className="text-center leading-tight">
          <div className="text-sm font-medium">Bootcamp.com | OAT</div>
          <div className="text-xs opacity-90">
            Quantitative Reasoning Test #5
          </div>
        </div>
        <div className="w-8">&nbsp;</div>
      </div>

      <div className="flex-1 flex justify-center items-start pt-16 pb-6 overflow-auto">
        <div className="w-[980px] max-w-[95%]">
          <div className="border-[3px] border-black bg-white p-10 mb-8 shadow-sm">
            <h2 className="font-bold text-[15px] mb-5">
              This is Quantitative Reasoning Test #5. Please read the following before starting:
            </h2>

            <ol className="space-y-2 text-[14px] leading-relaxed mb-6 ml-6 list-decimal">
              <li>You will have 45 minutes to finish 40 questions.</li>
              <li>You will have a chance to review the exam before completing it.</li>
              <li>Your score analysis will appear after finishing the exam.</li>
            </ol>

            <p className="font-bold text-[14px]">Click on the 'Next' button to continue.</p>
          </div>

          <h3 className="font-bold text-[15px] mb-4">Test Settings</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-white border border-gray-300 rounded-md p-4 shadow-sm">
              <button
                onClick={() => setDelayOn((v) => !v)}
                className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
                  delayOn ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 block h-6 w-6 bg-white rounded-full shadow-md transition-transform ${
                    delayOn ? 'translate-x-7' : 'translate-x-0'
                  }`}
                ></span>
              </button>
              <div className="text-[13px] leading-relaxed">
                <span className="font-bold">Prometric Delay:</span> Add a ~2 second delay between questions and when clicking review, similar to the real exam at the Prometric Center.
              </div>
            </div>
            <div className="flex items-start gap-4 bg-white border border-gray-300 rounded-md p-4 shadow-sm">
              <button
                onClick={() => setAccom((v) => !v)}
                className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
                  accom ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 block h-6 w-6 bg-white rounded-full shadow-md transition-transform ${
                    accom ? 'translate-x-7' : 'translate-x-0'
                  }`}
                ></span>
              </button>
              <div className="text-[13px] leading-relaxed">
                <span className="font-bold">Time Accommodations:</span> Get an additional 1.5x time for students who have special accommodations approved by the ADA. (If you need more time, right-click the test timer during the test to set a custom time limit).
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[#0e5c84] h-[68px] px-6">
        <button
          className="px-16 py-2.5 text-sm font-bold tracking-wide text-white border-2 border-white/40 shadow-lg rounded bg-gradient-to-b from-[#4a8cb3] to-[#1e5577] hover:from-[#5599c2] hover:to-[#256488] active:from-[#1e5577] active:to-[#144054] uppercase"
          onClick={startExam}
        >
          Next
        </button>
      </div>
    </div>
  );

  const Review = () => {
    const rows = questions.map((_, i) => ({
      i,
      name: `Question ${i + 1}`,
      isMarked: !!marked[i],
      isDone: answers[i] !== undefined,
      isSkipped: answers[i] === undefined
    }));

    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex items-center justify-between bg-[#0e5c84] text-white px-4 h-[54px]">
          <button
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-[#2d6f93] flex items-center justify-center text-xl leading-none"
          >
            ×
          </button>
          <div className="text-center leading-tight">
            <div className="text-sm">Bootcamp.com | OAT</div>
            <div className="text-[11px] opacity-90">Review Questions</div>
          </div>
          <div className="text-sm whitespace-nowrap">
            Time remaining: {fmtMMSS(timeLeft ?? 0)}
          </div>
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
                  <button
                    key={r.i}
                    className="grid grid-cols-4 w-full text-left text-sm hover:bg-[#eef6ff] focus:bg-[#eef6ff]"
                    onClick={() => jumpToReview(r.i)}
                  >
                    <div className="px-3 py-2 border-t border-[#9eb1bf] border-r flex items-center gap-2">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        aria-hidden
                        className="text-emerald-600"
                      >
                        <path
                          fill="currentColor"
                          d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1v5h5"
                        />
                      </svg>
                      {r.name}
                    </div>
                    <div className="px-3 py-2 border-t border-[#9eb1bf] border-r">
                      {r.isMarked ? 'Yes' : ''}
                    </div>
                    <div className="px-3 py-2 border-t border-[#9eb1bf] border-r">
                      {r.isDone ? 'Yes' : ''}
                    </div>
                    <div className="px-3 py-2 border-t border-[#9eb1bf]">
                      {r.isSkipped ? 'Yes' : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-[#0e5c84] h-[64px] px-6">
          <div className="flex gap-4">
            <button
              onClick={() => jumpToReview(rows.findIndex((r) => r.isMarked))}
              className="px-5 py-2 text-[13px] font-semibold text-white border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] rounded-none bg-gradient-to-b from-[#396f96] to-[#1d4e72] active:to-[#153c56]"
            >
              REVIEW MARKED
            </button>
            <button
              onClick={() => jumpToReview(0)}
              className="px-5 py-2 text-[13px] font-semibold text-white border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] rounded-none bg-gradient-to-b from-[#396f96] to-[#1d4e72] active:to-[#153c56]"
            >
              REVIEW ALL
            </button>
            <button
              onClick={() => jumpToReview(rows.findIndex((r) => !r.isDone))}
              className="px-5 py-2 text-[13px] font-semibold text-white border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] rounded-none bg-gradient-to-b from-[#396f96] to-[#1d4e72] active:to-[#153c56]"
            >
              REVIEW INCOMPLETE
            </button>
          </div>
          <button
            onClick={endTest}
            className="px-8 py-2 text-[13px] font-semibold text-white border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] rounded-none bg-gradient-to-b from-[#396f96] to-[#1d4e72] active:to-[#153c56]"
          >
            END
          </button>
        </div>
      </div>
    );
  };

  const Test = () => {
    const q = questions[current];

    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex items-center justify-between bg-[#0a6ea0] text-white px-6 py-2 h-[46px]">
          <div className="text-sm font-semibold">
            Question {current + 1} of {questions.length}
          </div>
          <div className="text-[11px] opacity-90">Quantitative Reasoning — Full Exam</div>
          <div className="text-sm">
            Time remaining: {timeLeft !== null ? fmtMMSS(timeLeft) : '--:--'}
          </div>
        </div>

        <div className="flex-1 flex justify-center items-start pt-8 pb-6 overflow-auto bg-white">
          <div className="w-[62%] min-w-[740px] bg-white border border-black/80 p-8 relative">
            {marked[current] && (
              <span className="absolute -top-6 right-0 bg-yellow-300 text-black text-xs font-semibold px-3 py-1 rounded-t-md shadow">
                MARKED
              </span>
            )}

            <div className="mb-5">
              <p className="mb-4 leading-relaxed">{q.stem}</p>

              {q.question_type === 'multiple_choice' && q.choices && (
                <div className="flex flex-col gap-3 text-sm">
                  {q.choices.map((choice, i) => (
                    <label key={i} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        className="mt-1"
                        checked={answers[current] === String(i)}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [current]: String(i) }))
                        }
                      />
                      <span>
                        {String.fromCharCode(65 + i)}. {choice}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {q.question_type === 'numeric_entry' && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2">
                    Enter your answer:
                  </label>
                  <input
                    type="text"
                    className="border-2 border-gray-400 px-3 py-2 w-48 text-lg"
                    value={answers[current] || ''}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [current]: e.target.value }))
                    }
                    placeholder="0"
                  />
                </div>
              )}
            </div>

            <p className="mt-6 text-xs">Click NEXT to continue.</p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-[#0a6ea0] h-[50px] px-6">
          <div className="flex gap-2">
            <button
              className={`${
                current === 0
                  ? 'bg-slate-500 text-white opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-b from-[#396f96] to-[#1d4e72] text-white'
              } px-8 py-1.5 text-sm font-semibold rounded-none border border-white/40 shadow-sm`}
              disabled={current === 0}
              onClick={() => go(-1)}
            >
              PREVIOUS
            </button>
          </div>

          <div className="flex justify-center flex-1">
            <button
              className="px-10 py-1.5 text-sm font-semibold rounded-none border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] bg-gradient-to-b from-[#396f96] to-[#1d4e72] active:to-[#153c56] text-white"
              onClick={() => {
                const act = () => {
                  if (current < questions.length - 1) setCurrent((n) => n + 1);
                  else endTest();
                };
                if (delayOn) setTimeout(act, 2000);
                else act();
              }}
            >
              {current < questions.length - 1 ? 'NEXT' : 'END SECTION'}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              className={`${
                marked[current]
                  ? 'bg-yellow-300 text-[#0a6ea0] border-yellow-600'
                  : 'bg-gradient-to-b from-[#396f96] to-[#1d4e72] text-white'
              } px-5 py-1.5 text-sm font-semibold rounded-none border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]`}
              onClick={() =>
                setMarked((prev) => ({ ...prev, [current]: !prev[current] }))
              }
            >
              MARK
            </button>
            <button
              className="px-5 py-1.5 text-sm font-semibold rounded-none border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] bg-gradient-to-b from-[#396f96] to-[#1d4e72] text-white active:to-[#153c56]"
              onClick={() => setShowCalculator(true)}
            >
              CALCULATOR
            </button>
            <button
              className="px-5 py-1.5 text-sm font-semibold rounded-none border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] bg-gradient-to-b from-[#396f96] to-[#1d4e72] text-white active:to-[#153c56]"
              onClick={() => {
                const act = () => setView('review');
                if (delayOn) setTimeout(act, 2000);
                else act();
              }}
            >
              REVIEW
            </button>
          </div>
        </div>

        {showCalculator && (
          <Calculator
            onClose={() => setShowCalculator(false)}
            testAttemptId={attemptId}
          />
        )}
      </div>
    );
  };

  const Results = () => {
    const { correct, total } = calculateScore();
    const percentage = Math.round((correct / total) * 100);

    return (
      <div className="p-4 flex flex-col gap-3 max-w-4xl mx-auto min-h-screen bg-white">
        <h1 className="text-2xl font-bold mt-4">Quantitative Reasoning Results</h1>
        <div className="bg-slate-100 border-2 border-slate-300 rounded p-4 mb-2">
          <p className="text-lg">
            <span className="font-semibold">Score:</span> {correct} / {total} ({percentage}%)
          </p>
        </div>

        <h2 className="text-xl font-semibold mt-4 mb-2">Question Review</h2>
        <div className="grid grid-cols-1 gap-3">
          {questions.map((q, i) => {
            const userAnswer = answers[i];
            const isCorrect = userAnswer !== undefined && checkAnswer(q, userAnswer);

            return (
              <div
                key={i}
                className={`${
                  isCorrect
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-rose-300 bg-rose-50'
                } border rounded p-3`}
              >
                <div className="font-medium mb-2">
                  {i + 1}. {q.stem}
                </div>

                {q.question_type === 'multiple_choice' && q.choices && (
                  <ul className="ml-4 text-sm mb-1 list-disc">
                    {q.choices.map((choice, j) => (
                      <li
                        key={j}
                        className={
                          String(j) === q.correct_answer ? 'font-semibold text-green-700' : ''
                        }
                      >
                        {String.fromCharCode(65 + j)}. {choice}
                        {String(j) === q.correct_answer && ' ✓ (correct)'}
                        {userAnswer === String(j) && String(j) !== q.correct_answer && ' ✗ (your answer)'}
                      </li>
                    ))}
                  </ul>
                )}

                {q.question_type === 'numeric_entry' && (
                  <div className="ml-4 text-sm">
                    <p>
                      <span className="font-semibold text-green-700">Correct answer:</span>{' '}
                      {q.correct_answer}
                    </p>
                    {userAnswer !== undefined && (
                      <p>
                        <span
                          className={isCorrect ? 'text-green-700' : 'text-red-700'}
                        >
                          Your answer:
                        </span>{' '}
                        {userAnswer} {isCorrect ? '✓' : '✗'}
                      </p>
                    )}
                    {userAnswer === undefined && (
                      <p className="text-gray-600">No answer provided</p>
                    )}
                  </div>
                )}

                {marked[i] && (
                  <div className="text-[11px] inline-block bg-yellow-200 px-2 py-[2px] rounded mt-2">
                    MARKED
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 mt-4 mb-8">
          <button
            className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-700 transition"
            onClick={() => {
              setView('intro');
              setAnswers({});
              setMarked({});
              setCurrent(0);
              setAttemptId(null);
            }}
          >
            Back to Start
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {view === 'intro' && <Intro />}
      {view === 'test' && <Test />}
      {view === 'review' && <Review />}
      {view === 'results' && <Results />}
    </div>
  );
}
