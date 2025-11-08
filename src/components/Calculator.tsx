import React, { useState, useEffect, useRef } from "react";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface CalculatorProps {
  onClose: () => void;
  testAttemptId?: string | null;
}

interface InputHistory {
  inputType: string;
  inputValue: string;
  displayValue: string;
  sequenceNumber: number;
}

export default function Calculator({ onClose, testAttemptId }: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [memory, setMemory] = useState(0);

  // Memory logging state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<InputHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const sequenceRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
    return () => {
      // Close session on unmount
      closeSession();
    };
  }, []);

  /**
   * Initialize a new calculator session in the database
   * Creates a session record that will store all calculator interactions
   */
  const initializeSession = async () => {
    try {
      const { data, error } = await supabase
        .from('calculator_sessions')
        .insert({
          test_attempt_id: testAttemptId || null,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setSessionId(data.id);
        sessionIdRef.current = data.id;
        console.log('Calculator session started:', data.id);
      }
    } catch (err) {
      console.error('Error initializing calculator session:', err);
    }
  };

  /**
   * Close the calculator session when user closes calculator
   * Updates the ended_at timestamp
   */
  const closeSession = async () => {
    const id = sessionIdRef.current;
    if (!id) return;

    try {
      await supabase
        .from('calculator_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', id);

      console.log('Calculator session ended');
    } catch (err) {
      console.error('Error closing calculator session:', err);
    }

    sessionIdRef.current = null;
  };

  /**
   * Log an input action to the database
   * Captures every button press with context
   *
   * @param inputType - Type of input: 'digit', 'operator', 'function', 'equals', 'clear', 'memory'
   * @param inputValue - The actual button value (e.g., '7', '+', 'sqrt')
   * @param displayValue - Current calculator display after this input
   */
  const logInput = async (inputType: string, inputValue: string, displayValue: string) => {
    const sequence = sequenceRef.current++;
    const historyEntry: InputHistory = {
      inputType,
      inputValue,
      displayValue,
      sequenceNumber: sequence
    };

    // Update local history immediately for UI
    setHistory(prev => [...prev, historyEntry]);

    const id = sessionIdRef.current;
    if (!id) return;

    // Save to database asynchronously
    try {
      await supabase
        .from('calculator_inputs')
        .insert({
          session_id: id,
          input_type: inputType,
          input_value: inputValue,
          display_value: displayValue,
          sequence_number: sequence
        });
    } catch (err) {
      console.error('Error logging calculator input:', err);
    }
  };

  const inputDigit = (digit: string) => {
    let newDisplay: string;

    if (waitingForOperand) {
      newDisplay = digit;
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      newDisplay = display === "0" ? digit : display + digit;
      setDisplay(newDisplay);
    }

    // Log the digit input
    logInput('digit', digit, newDisplay);
  };

  const inputDot = () => {
    let newDisplay: string;

    if (waitingForOperand) {
      newDisplay = "0.";
      setDisplay(newDisplay);
      setWaitingForOperand(false);
    } else if (display.indexOf(".") === -1) {
      newDisplay = display + ".";
      setDisplay(newDisplay);
    } else {
      return; // Don't log if nothing changed
    }

    logInput('digit', '.', newDisplay);
  };

  const clearDisplay = () => {
    setDisplay("0");
    logInput('clear', 'CE', '0');
  };

  const clearAll = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    logInput('clear', 'C', '0');
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);
    let newDisplay = display;

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);
      newDisplay = String(newValue);
      setDisplay(newDisplay);
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
    logInput('operator', nextOperation, newDisplay);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "*":
        return firstValue * secondValue;
      case "/":
        return firstValue / secondValue;
      case "=":
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performEquals = () => {
    const inputValue = parseFloat(display);
    let newDisplay = display;

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      newDisplay = String(newValue);
      setDisplay(newDisplay);
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }

    logInput('equals', '=', newDisplay);
  };

  const performSquareRoot = () => {
    const value = parseFloat(display);
    let newDisplay: string;

    if (value < 0) {
      newDisplay = "Error";
    } else {
      newDisplay = String(Math.sqrt(value));
    }

    setDisplay(newDisplay);
    setWaitingForOperand(true);
    logInput('function', 'sqrt', newDisplay);
  };

  const performReciprocal = () => {
    const value = parseFloat(display);
    let newDisplay: string;

    if (value === 0) {
      newDisplay = "Error";
    } else {
      newDisplay = String(1 / value);
    }

    setDisplay(newDisplay);
    setWaitingForOperand(true);
    logInput('function', '1/x', newDisplay);
  };

  const performPercentage = () => {
    const value = parseFloat(display);
    let newDisplay: string;

    if (previousValue !== null) {
      newDisplay = String((previousValue * value) / 100);
    } else {
      newDisplay = String(value / 100);
    }

    setDisplay(newDisplay);
    setWaitingForOperand(true);
    logInput('function', '%', newDisplay);
  };

  const toggleSign = () => {
    const value = parseFloat(display);
    const newDisplay = String(value * -1);
    setDisplay(newDisplay);
    logInput('function', '+/-', newDisplay);
  };

  const backspace = () => {
    const newDisplay = display.slice(0, -1);
    const finalDisplay = newDisplay === "" || newDisplay === "-" ? "0" : newDisplay;
    setDisplay(finalDisplay);
    logInput('function', 'Backspace', finalDisplay);
  };

  const memoryClear = () => {
    setMemory(0);
    logInput('memory', 'MC', display);
  };

  const memoryRecall = () => {
    const newDisplay = String(memory);
    setDisplay(newDisplay);
    setWaitingForOperand(true);
    logInput('memory', 'MR', newDisplay);
  };

  const memoryStore = () => {
    setMemory(parseFloat(display));
    logInput('memory', 'MS', display);
  };

  const memoryAdd = () => {
    setMemory(memory + parseFloat(display));
    logInput('memory', 'M+', display);
  };

  const memorySubtract = () => {
    setMemory(memory - parseFloat(display));
    logInput('memory', 'M-', display);
  };

  const hasMemory = memory !== 0;

  const buttonConfigs: CalculatorButtonProps[] = [
    { label: 'MC', row: 1, col: 1, variant: 'memory', onClick: memoryClear },
    { label: 'MR', row: 1, col: 2, variant: 'memory', onClick: memoryRecall },
    { label: 'MS', row: 1, col: 3, variant: 'memory', onClick: memoryStore },
    { label: 'M+', row: 1, col: 4, variant: 'memory', onClick: memoryAdd },
    { label: 'M-', row: 1, col: 5, variant: 'memory', onClick: memorySubtract },
    { label: '⌫', row: 2, col: 1, variant: 'control', onClick: backspace, ariaLabel: 'Backspace' },
    { label: 'CE', row: 2, col: 2, variant: 'control', onClick: clearDisplay },
    { label: 'C', row: 2, col: 3, variant: 'control', onClick: clearAll },
    { label: '±', row: 2, col: 4, variant: 'control', onClick: toggleSign, ariaLabel: 'Toggle sign' },
    { label: '√', row: 2, col: 5, variant: 'control', onClick: performSquareRoot, ariaLabel: 'Square root' },
    { label: '7', row: 3, col: 1, variant: 'number', onClick: () => inputDigit("7") },
    { label: '8', row: 3, col: 2, variant: 'number', onClick: () => inputDigit("8") },
    { label: '9', row: 3, col: 3, variant: 'number', onClick: () => inputDigit("9") },
    { label: '/', row: 3, col: 4, variant: 'operator', onClick: () => performOperation("/") },
    { label: '%', row: 3, col: 5, variant: 'control', onClick: performPercentage },
    { label: '4', row: 4, col: 1, variant: 'number', onClick: () => inputDigit("4") },
    { label: '5', row: 4, col: 2, variant: 'number', onClick: () => inputDigit("5") },
    { label: '6', row: 4, col: 3, variant: 'number', onClick: () => inputDigit("6") },
    { label: '*', row: 4, col: 4, variant: 'operator', onClick: () => performOperation("*") },
    { label: '1/x', row: 4, col: 5, variant: 'control', onClick: performReciprocal },
    { label: '1', row: 5, col: 1, variant: 'number', onClick: () => inputDigit("1") },
    { label: '2', row: 5, col: 2, variant: 'number', onClick: () => inputDigit("2") },
    { label: '3', row: 5, col: 3, variant: 'number', onClick: () => inputDigit("3") },
    { label: '-', row: 5, col: 4, variant: 'operator', onClick: () => performOperation("-") },
    { label: '=', row: 5, col: 5, variant: 'equals', onClick: performEquals, rowSpan: 2 },
    { label: '0', row: 6, col: 1, variant: 'number', onClick: () => inputDigit("0"), colSpan: 2 },
    { label: '.', row: 6, col: 3, variant: 'number', onClick: inputDot },
    { label: '+', row: 6, col: 4, variant: 'operator', onClick: () => performOperation("+") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div style={styles.container}>
        <div style={styles.shell}>
          <div style={styles.titleBar}>
            <div style={styles.title}>Calculator</div>
            <div style={styles.titleButtons}>
              <button
                style={styles.historyBtn}
                onClick={() => setShowHistory(!showHistory)}
                title="Show history"
              >
                H
              </button>
              <button
                aria-label="Close"
                style={styles.closeBtn}
                onClick={onClose}
              >
                ✕
              </button>
            </div>
          </div>

          <div style={styles.displayRow}>
            <div style={styles.memCell}>{hasMemory ? "M" : ""}</div>
            <input style={styles.display} value={display} readOnly />
          </div>

          <div style={styles.grid}>
            {buttonConfigs.map((btn) => (
              <Button
                key={`${btn.label}-${btn.row}-${btn.col}`}
                label={btn.label}
                onClick={btn.onClick}
                variant={btn.variant}
                colSpan={btn.colSpan}
                rowSpan={btn.rowSpan}
                row={btn.row}
                col={btn.col}
                ariaLabel={btn.ariaLabel}
              />
            ))}
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div style={styles.historyPanel}>
            <div style={styles.historyHeader}>
              <strong>Input History</strong>
              <span style={styles.historyCount}>({history.length} inputs)</span>
            </div>
            <div style={styles.historyList}>
              {history.length === 0 ? (
                <div style={styles.historyEmpty}>No inputs yet</div>
              ) : (
                history.map((entry, idx) => (
                  <div key={idx} style={styles.historyItem}>
                    <span style={styles.historySeq}>#{entry.sequenceNumber + 1}</span>
                    <span style={styles.historyType}>{entry.inputType}</span>
                    <span style={styles.historyValue}>"{entry.inputValue}"</span>
                    <span style={styles.historyDisplay}>→ {entry.displayValue}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type ButtonVariant = 'number' | 'operator' | 'control' | 'memory' | 'equals';

interface CalculatorButtonProps {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  colSpan?: number;
  rowSpan?: number;
  row: number;
  col: number;
  ariaLabel?: string;
}

function Button({
  label,
  onClick,
  variant = 'number',
  colSpan,
  rowSpan,
  row,
  col,
  ariaLabel,
}: CalculatorButtonProps) {
  const buttonStyle: React.CSSProperties = {
    ...styles.btn,
    ...(variant === 'number' ? styles.btnNumber : {}),
    ...(variant === 'operator' ? styles.btnOperator : {}),
    ...(variant === 'control' ? styles.btnControl : {}),
    ...(variant === 'memory' ? styles.btnMemory : {}),
    ...(variant === 'equals' ? styles.btnEquals : {}),
    gridColumn: `${col} / span ${colSpan ?? 1}`,
    gridRow: `${row} / span ${rowSpan ?? 1}`,
  };
  const baseShadow = typeof buttonStyle.boxShadow === 'string' ? buttonStyle.boxShadow : undefined;
  const applyPressIn = (btn: HTMLButtonElement) => {
    btn.style.transform = 'translateY(1px)';
    btn.style.boxShadow = '0 1px 0 rgba(40,66,100,0.4)';
  };

  const applyPressOut = (btn: HTMLButtonElement) => {
    btn.style.transform = 'translateY(0)';
    if (baseShadow) {
      btn.style.boxShadow = baseShadow;
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    applyPressIn(event.currentTarget);
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLButtonElement>) => {
    applyPressOut(event.currentTarget);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLButtonElement>) => {
    applyPressOut(event.currentTarget);
  };

  const handleBlur = (event: React.FocusEvent<HTMLButtonElement>) => {
    applyPressOut(event.currentTarget);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Space' || event.key === 'Enter') {
      applyPressIn(event.currentTarget);
    }
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Space' || event.key === 'Enter') {
      applyPressOut(event.currentTarget);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || label}
      style={buttonStyle}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      {label}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
    userSelect: "none",
  },
  shell: {
    width: 360,
    border: "1px solid #1f497d",
    borderRadius: 6,
    background: "#f1f5fb",
    boxShadow: "0 10px 40px rgba(12, 46, 89, 0.28)",
    fontFamily: "Segoe UI, Tahoma, Arial, sans-serif",
    overflow: "hidden",
  },
  titleBar: {
    background: "linear-gradient(90deg,#0f60a3,#0b3b6f)",
    color: "#fff",
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px",
    boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.25)",
  },
  title: { fontWeight: 600, fontSize: 14, letterSpacing: 0.3 },
  titleButtons: {
    display: "flex",
    gap: 8,
  },
  historyBtn: {
    background: "linear-gradient(#5ea4e7,#3d7cc1)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.8)",
    borderRadius: 3,
    width: 22,
    height: 22,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    background: "linear-gradient(#ff6e67,#d93d34)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.85)",
    borderRadius: 3,
    width: 22,
    height: 22,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  displayRow: {
    display: "grid",
    gridTemplateColumns: "64px 1fr",
    gap: 8,
    padding: "14px 16px 12px",
  },
  memCell: {
    background: "linear-gradient(#dfe7f3,#c6d3e5)",
    border: "1px solid #aabbd4",
    borderRadius: 4,
    height: 38,
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#345171",
    fontWeight: 600,
  },
  display: {
    height: 38,
    padding: "0 12px",
    border: "1px solid #a2b6d2",
    borderRadius: 4,
    background: "#fdfefe",
    textAlign: "right" as const,
    fontSize: 20,
    fontWeight: 600,
    color: "#112942",
    boxShadow: "inset 0 1px 4px rgba(15,53,102,0.25)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gridTemplateRows: "repeat(6, 1fr)",
    gap: 8,
    padding: "0 16px 18px",
    position: "relative",
    gridAutoRows: 52,
  },
  btn: {
    height: "100%",
    borderRadius: 6,
    border: "1px solid #b9c8df",
    background: "linear-gradient(#fdfefe,#e3ecf7)",
    boxShadow: "0 3px 0 #c3d2e8, inset 0 1px 0 rgba(255,255,255,0.9)",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
    color: "#1d2f44",
    transition: "transform 0.05s ease, box-shadow 0.05s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  btnNumber: {
    background: "linear-gradient(#ffffff,#e9f1fb)",
  },
  btnOperator: {
    background: "linear-gradient(#f4f8ff,#d7e4f7)",
    color: "#0c4170",
  },
  btnControl: {
    background: "linear-gradient(#fff6f5,#f1dedd)",
    color: "#92322d",
  },
  btnMemory: {
    background: "linear-gradient(#fff9f0,#f5e1c7)",
    color: "#7b4c15",
  },
  btnEquals: {
    background: "linear-gradient(#ffb067,#f97a34)",
    color: "#fff",
    borderColor: "#e86b25",
    boxShadow: "0 3px 0 #dc6a32, inset 0 1px 0 rgba(255,255,255,0.65)",
    fontSize: 18,
  },
  historyPanel: {
    width: 320,
    maxHeight: 440,
    border: "1px solid #1f497d",
    borderRadius: 6,
    background: "#ffffff",
    boxShadow: "0 10px 40px rgba(12, 46, 89, 0.22)",
    fontFamily: "Segoe UI, Tahoma, Arial, sans-serif",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
  },
  historyHeader: {
    background: "linear-gradient(90deg,#e9f0fb,#d3e0f7)",
    borderBottom: "1px solid #bfd0ec",
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#143458",
  },
  historyCount: {
    fontSize: 11,
    color: "#4c6a92",
    fontWeight: 500,
  },
  historyList: {
    flex: 1,
    overflowY: "auto" as const,
    padding: 10,
    background: "#f6f9ff",
  },
  historyEmpty: {
    padding: 24,
    textAlign: "center" as const,
    color: "#8196b5",
    fontSize: 13,
  },
  historyItem: {
    padding: "8px 10px",
    fontSize: 11,
    borderBottom: "1px solid #dde6f4",
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontFamily: "Consolas, Monaco, monospace",
    color: "#10253d",
  },
  historySeq: {
    color: "#7d93b5",
    fontSize: 10,
    minWidth: 32,
  },
  historyType: {
    color: "#0f4e8a",
    fontWeight: 600,
    minWidth: 64,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  historyValue: {
    color: "#c06418",
    fontWeight: 600,
  },
  historyDisplay: {
    color: "#1b3a5c",
    marginLeft: "auto",
  },
};
