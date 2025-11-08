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

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
    return () => {
      // Close session on unmount
      if (sessionId) {
        closeSession();
      }
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
    if (!sessionId) return;

    try {
      await supabase
        .from('calculator_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);

      console.log('Calculator session ended');
    } catch (err) {
      console.error('Error closing calculator session:', err);
    }
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
    if (!sessionId) return;

    const sequence = sequenceRef.current++;
    const historyEntry: InputHistory = {
      inputType,
      inputValue,
      displayValue,
      sequenceNumber: sequence
    };

    // Update local history immediately for UI
    setHistory(prev => [...prev, historyEntry]);

    // Save to database asynchronously
    try {
      await supabase
        .from('calculator_inputs')
        .insert({
          session_id: sessionId,
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
    logInput('clear', 'CA', '0');
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

  const hasMemory = memory !== 0;

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
            <Button label="MC" onClick={memoryClear} orange />
            <Button label="Backspace" onClick={backspace} red />
            <Button label="CE" onClick={clearDisplay} red />
            <Button label="CA" onClick={clearAll} red />
            <Button label="sqrt" onClick={performSquareRoot} />

            <Button label="MR" onClick={memoryRecall} orange />
            <Button label="7" onClick={() => inputDigit("7")} blue />
            <Button label="8" onClick={() => inputDigit("8")} blue />
            <Button label="9" onClick={() => inputDigit("9")} blue />
            <Button label="/" onClick={() => performOperation("/")} />
            <Button label="%" onClick={performPercentage} />

            <Button label="MS" onClick={memoryStore} orange />
            <Button label="4" onClick={() => inputDigit("4")} blue />
            <Button label="5" onClick={() => inputDigit("5")} blue />
            <Button label="6" onClick={() => inputDigit("6")} blue />
            <Button label="*" onClick={() => performOperation("*")} />
            <Button label="1/x" onClick={performReciprocal} />

            <Button label="M+" onClick={memoryAdd} orange />
            <Button label="1" onClick={() => inputDigit("1")} blue />
            <Button label="2" onClick={() => inputDigit("2")} blue />
            <Button label="3" onClick={() => inputDigit("3")} blue />
            <Button label="-" onClick={() => performOperation("-")} />
            <Button label="=" onClick={performEquals} red />

            <div></div>
            <Button label="0" onClick={() => inputDigit("0")} blue />
            <Button label="+/-" onClick={toggleSign} />
            <Button label="." onClick={inputDot} />
            <Button label="+" onClick={() => performOperation("+")} />
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

function Button({ label, onClick, red, blue, orange }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.btn,
        ...(red ? styles.btnRed : {}),
        ...(blue ? styles.btnBlue : {}),
        ...(orange ? styles.btnOrange : {}),
      }}
    >
      {label}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  shell: {
    width: 330,
    border: "2px solid #2a2a2a",
    borderRadius: 4,
    background: "#ececec",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    fontFamily: "Segoe UI, Tahoma, Arial, sans-serif",
    overflow: "hidden",
  },
  titleBar: {
    background: "linear-gradient(#0b3fa6, #072c74)",
    color: "#fff",
    height: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 8px",
  },
  title: { fontWeight: 700, fontSize: 13 },
  titleButtons: {
    display: "flex",
    gap: 6,
  },
  historyBtn: {
    background: "#4a8dd6",
    color: "#fff",
    border: "1px solid #fff",
    borderRadius: 2,
    width: 18,
    height: 18,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 11,
  },
  closeBtn: {
    background: "#ff3c2e",
    color: "#fff",
    border: "2px solid #fff",
    borderRadius: 2,
    width: 18,
    height: 18,
    fontWeight: 700,
    cursor: "pointer",
  },
  displayRow: {
    display: "grid",
    gridTemplateColumns: "60px 1fr",
    gap: 6,
    padding: 6,
  },
  memCell: {
    background: "#d8d8d8",
    border: "1px solid #bfbfbf",
    borderRadius: 3,
    height: 28,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#444",
  },
  display: {
    height: 30,
    padding: "0 8px",
    border: "1px solid #bfbfbf",
    borderRadius: 3,
    background: "#f7f7f7",
    textAlign: "right" as const,
    fontSize: 18,
    fontWeight: 600,
    color: "#222",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: 6,
    padding: 8,
  },
  btn: {
    height: 34,
    borderRadius: 6,
    border: "1px solid #bdbdbd",
    background: "linear-gradient(#f3f3f3, #d8d8d8)",
    boxShadow: "inset 0 1px 0 #fff, 0 1px 2px rgba(0,0,0,0.2)",
    cursor: "pointer",
    fontSize: 14,
    color: "#1a1a1a",
  },
  btnRed: { color: "#b80000", fontWeight: 700 },
  btnBlue: { color: "#0047ff", fontWeight: 600 },
  btnOrange: { color: "#d46b00", fontWeight: 700 },
  historyPanel: {
    width: 350,
    maxHeight: 440,
    border: "2px solid #2a2a2a",
    borderRadius: 4,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    fontFamily: "Segoe UI, Tahoma, Arial, sans-serif",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
  },
  historyHeader: {
    background: "#f5f5f5",
    borderBottom: "1px solid #ddd",
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyCount: {
    fontSize: 11,
    color: "#666",
    fontWeight: 400,
  },
  historyList: {
    flex: 1,
    overflowY: "auto" as const,
    padding: 8,
  },
  historyEmpty: {
    padding: 20,
    textAlign: "center" as const,
    color: "#999",
    fontSize: 13,
  },
  historyItem: {
    padding: "6px 8px",
    fontSize: 11,
    borderBottom: "1px solid #f0f0f0",
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontFamily: "Consolas, Monaco, monospace",
  },
  historySeq: {
    color: "#999",
    fontSize: 10,
    minWidth: 30,
  },
  historyType: {
    color: "#0066cc",
    fontWeight: 600,
    minWidth: 60,
  },
  historyValue: {
    color: "#cc6600",
    fontWeight: 600,
  },
  historyDisplay: {
    color: "#333",
    marginLeft: "auto",
  },
};
