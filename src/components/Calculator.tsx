import React, { useState, useEffect } from "react";

interface CalculatorProps {
  onClose: () => void;
}

export default function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [shouldOverwrite, setShouldOverwrite] = useState(true);
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<"+" | "-" | "*" | "/" | null>(null);
  const [memory, setMemory] = useState<number>(0);

  const toNumber = (s: string) => (Number.isFinite(Number(s)) ? Number(s) : 0);

  const format = (n: number) => {
    if (!Number.isFinite(n)) return "Error";
    let s = n.toString();
    if (Math.abs(n) >= 1e12 || (Math.abs(n) > 0 && Math.abs(n) < 1e-9)) {
      s = n.toExponential(8);
    }
    return s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  };

  const compute = (a: number, b: number, o: string | null) => {
    switch (o) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b === 0 ? Infinity : a / b;
      default: return b;
    }
  };

  const inputDigit = (d: string) => {
    console.log('=== inputDigit START ===');
    console.log('Input digit:', d);
    console.log('Current display:', display);
    console.log('shouldOverwrite:', shouldOverwrite);

    if (shouldOverwrite || display === "Error") {
      console.log('→ Branch 1: Setting display to', d);
      setDisplay(d);
      setShouldOverwrite(false);
    } else if (display === "0") {
      console.log('→ Branch 2: Display is 0, setting to', d);
      setDisplay(d);
    } else {
      console.log('→ Branch 3: Appending', d, 'to', display);
      setDisplay(display + d);
    }
    console.log('=== inputDigit END ===');
  };

  const inputDot = () => {
    if (shouldOverwrite || display === "Error") {
      setDisplay("0.");
      setShouldOverwrite(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const changeSign = () => {
    if (display.startsWith("-")) {
      setDisplay(display.slice(1));
    } else if (display !== "0") {
      setDisplay("-" + display);
    }
  };

  const backspace = () => {
    if (display.length <= 1 || (display.length === 2 && display.startsWith("-"))) {
      setDisplay("0");
      setShouldOverwrite(true);
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const clearEntry = () => {
    setDisplay("0");
    setShouldOverwrite(true);
  };

  const clearAll = () => {
    setDisplay("0");
    setAcc(null);
    setOp(null);
    setShouldOverwrite(true);
  };

  const doUnary = (kind: "sqrt" | "inv" | "percent") => {
    const x = toNumber(display);
    let result: number;

    if (kind === "sqrt") {
      if (x < 0) {
        setDisplay("Error");
        setShouldOverwrite(true);
        return;
      }
      result = Math.sqrt(x);
    } else if (kind === "inv") {
      if (x === 0) {
        setDisplay("Error");
        setShouldOverwrite(true);
        return;
      }
      result = 1 / x;
    } else {
      if (acc !== null && op) {
        result = acc * (x / 100);
      } else {
        result = x / 100;
      }
    }

    setDisplay(format(result));
    setShouldOverwrite(true);
  };

  const chooseOperator = (nextOp: "+" | "-" | "*" | "/") => {
    const x = toNumber(display);

    if (acc === null) {
      setAcc(x);
    } else if (!shouldOverwrite && op) {
      const result = compute(acc, x, op);
      setDisplay(format(result));
      setAcc(result);
    }

    setOp(nextOp);
    setShouldOverwrite(true);
  };

  const equals = () => {
    const x = toNumber(display);
    if (op && acc !== null) {
      const result = compute(acc, x, op);
      setDisplay(format(result));
      setAcc(null);
      setOp(null);
      setShouldOverwrite(true);
    }
  };

  const memoryClear = () => setMemory(0);

  const memoryRecall = () => {
    setDisplay(format(memory));
    setShouldOverwrite(true);
  };

  const memoryStore = () => setMemory(toNumber(display));

  const memoryAdd = () => setMemory(memory + toNumber(display));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { key } = e;
      if (/^[0-9]$/.test(key)) {
        inputDigit(key);
      } else if (key === ".") {
        inputDot();
      } else if (["+", "-", "*", "/"].includes(key)) {
        chooseOperator(key as "+" | "-" | "*" | "/");
      } else if (["Enter", "="].includes(key)) {
        equals();
      } else if (key === "Backspace") {
        backspace();
      } else if (key.toLowerCase() === "c") {
        clearEntry();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [display, shouldOverwrite, acc, op, memory]);

  const hasMemory = memory !== 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div style={styles.shell}>
        <div style={styles.titleBar}>
          <div style={styles.title}>Calculator</div>
          <button aria-label="Close" style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.displayRow}>
          <div style={styles.memCell}>{hasMemory ? "M" : ""}</div>
          <input style={styles.display} value={display} readOnly />
        </div>

        <div style={styles.grid}>
          <Button label="MC" onClick={memoryClear} orange />
          <Button label="Backspace" onClick={backspace} red />
          <Button label="CE" onClick={clearEntry} red />
          <Button label="CA" onClick={clearAll} red />
          <Button label="sqrt" onClick={() => doUnary("sqrt")} />

          <Button label="MR" onClick={memoryRecall} orange />
          <Button label="7" onClick={() => inputDigit("7")} blue />
          <Button label="8" onClick={() => inputDigit("8")} blue />
          <Button label="9" onClick={() => inputDigit("9")} blue />
          <Button label="/" onClick={() => chooseOperator("/")} />
          <Button label="%" onClick={() => doUnary("percent")} />

          <Button label="MS" onClick={memoryStore} orange />
          <Button label="4" onClick={() => inputDigit("4")} blue />
          <Button label="5" onClick={() => inputDigit("5")} blue />
          <Button label="6" onClick={() => inputDigit("6")} blue />
          <Button label="*" onClick={() => chooseOperator("*")} />
          <Button label="1/x" onClick={() => doUnary("inv")} />

          <Button label="M+" onClick={memoryAdd} orange />
          <Button label="1" onClick={() => inputDigit("1")} blue />
          <Button label="2" onClick={() => inputDigit("2")} blue />
          <Button label="3" onClick={() => inputDigit("3")} blue />
          <Button label="-" onClick={() => chooseOperator("-")} />
          <Button label="=" onClick={equals} red />

          <div></div>
          <Button label="0" onClick={() => inputDigit("0")} blue />
          <Button label="+/-" onClick={changeSign} />
          <Button label="." onClick={inputDot} />
          <Button label="+" onClick={() => chooseOperator("+")} />
        </div>
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
  shell: {
    width: 330,
    border: "2px solid #2a2a2a",
    borderRadius: 4,
    background: "#ececec",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    fontFamily: "Segoe UI, Tahoma, Arial, sans-serif",
    overflow: "hidden",
    margin: "auto",
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
};
