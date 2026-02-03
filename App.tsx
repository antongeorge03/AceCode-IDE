import React, { useState, useCallback, useRef, useEffect } from "react";
import EditorPane from "./components/EditorPane";
import TerminalPane from "./components/TerminalPane";
import ChatPane from "./components/ChatPane";
import { Message, TerminalLine, CodeStatus, Language } from "./types";
import { geminiService } from "./services/geminiService";

const DEFAULT_JS = `// Welcome to AceCode IDE!
// Write your JavaScript code here and hit 'Run'.

console.log("This is a dog!");

`;

const DEFAULT_PY = `# Welcome to AceCode IDE!
# Write your Python code here and hit 'Run'.

print("Hello World!")
`;

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState(DEFAULT_PY);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [codeStatus, setCodeStatus] = useState<CodeStatus>(CodeStatus.IDLE);
  const [pyodide, setPyodide] = useState<any>(null);

  // Ref to hold running intervals/timeouts to allow stopping
  const activeHandles = useRef<any[]>([]);

  const addTerminalLine = (
    content: string,
    type: TerminalLine["type"] = "output",
  ) => {
    setTerminalLines((prev) => [
      ...prev,
      {
        content,
        type,
        timestamp: Date.now(),
      },
    ]);
  };

  const initPyodide = async () => {
    if (pyodide) return pyodide;

    addTerminalLine("Initializing Python environment...", "system");
    try {
      // @ts-ignore
      const instance = await loadPyodide({
        stdout: (text: string) => addTerminalLine(text),
        stderr: (text: string) => addTerminalLine(text, "error"),
      });
      setPyodide(instance);
      addTerminalLine("Python 3.x ready.", "system");
      return instance;
    } catch (err: any) {
      addTerminalLine(`Failed to load Python: ${err.message}`, "error");
      return null;
    }
  };

  const handleRunJS = () => {
    addTerminalLine("Executing script (JavaScript)...", "system");
    try {
      const originalLog = console.log;
      const originalError = console.error;

      const log = (...args: any[]) => {
        addTerminalLine(
          args
            .map((a) =>
              typeof a === "object" ? JSON.stringify(a, null, 2) : String(a),
            )
            .join(" "),
        );
      };

      const error = (...args: any[]) => {
        addTerminalLine(args.map((a) => String(a)).join(" "), "error");
        originalError(...args);
      };

      const customSetTimeout = (
        handler: TimerHandler,
        timeout?: number,
        ...args: any[]
      ) => {
        const id = window.setTimeout(
          () => {
            if (codeStatus !== CodeStatus.STOPPED) {
              if (typeof handler === "function") {
                handler(...args);
              } else {
                eval(handler);
              }
            }
          },
          timeout,
          ...args,
        );
        activeHandles.current.push(id);
        return id;
      };

      const executionFn = new Function(
        "console",
        "setTimeout",
        `
        try {
          ${code}
        } catch (e) {
          console.error(e.stack || e.message);
        }
        `,
      );

      executionFn({ log, error, warn: log }, customSetTimeout);
    } catch (err: any) {
      addTerminalLine(`Runtime Error: ${err.message}`, "error");
    }
  };

  const handleRunPython = async () => {
    const py = pyodide || (await initPyodide());
    if (!py) return;

    addTerminalLine("Executing script (Python)...", "system");
    try {
      await py.runPythonAsync(code);
    } catch (err: any) {
      addTerminalLine(`Python Error: ${err.message}`, "error");
    } finally {
      setCodeStatus(CodeStatus.IDLE);
    }
  };

  const handleRunCode = () => {
    handleStopCode();
    setCodeStatus(CodeStatus.RUNNING);

    if (language === "javascript") {
      handleRunJS();
    } else {
      handleRunPython();
    }
  };

  const handlePauseCode = () => {
    if (codeStatus === CodeStatus.RUNNING) {
      setCodeStatus(CodeStatus.PAUSED);
      addTerminalLine("Execution paused.", "info");
    } else if (codeStatus === CodeStatus.PAUSED) {
      setCodeStatus(CodeStatus.RUNNING);
      addTerminalLine("Execution resumed.", "info");
    }
  };

  const handleStopCode = () => {
    activeHandles.current.forEach(clearTimeout);
    activeHandles.current = [];
    setCodeStatus(CodeStatus.STOPPED);
    addTerminalLine("Execution stopped.", "system");
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setIsAiLoading(true);

    const responseContent = await geminiService.chat(
      [...chatMessages, userMessage],
      code,
      language,
    );

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: responseContent,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, assistantMessage]);
    setIsAiLoading(false);
  };

  const toggleLanguage = (lang: Language) => {
    if (lang === language) return;
    setLanguage(lang);
    setCode(lang === "javascript" ? DEFAULT_JS : DEFAULT_PY);
    handleStopCode();
    addTerminalLine(`Switched to ${lang}`, "system");
  };

  const clearTerminal = () => {
    setTerminalLines([]);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top Header/Toolbar */}
      <header className="h-14 border-b border-gray-800 bg-[#151515] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {/* <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              AC
            </div> */}
            <h1 className="font-bold tracking-tight text-white hidden sm:block">
              AceCode <span className="text-gray-500 font-normal">IDE</span>
            </h1>
          </div>

          <div className="h-6 w-[1px] bg-gray-700 mx-2"></div>

          {/* Language Switcher */}
          <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800">
            <button
              onClick={() => toggleLanguage("python")}
              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                language === "python"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.25.18l.9.2.73.26.59.33.45.38.34.44.25.51.15.57.06.63-.01.63-.08.63-.16.63-.26.63-.37.63-.48.63-.61.63-.1.1V4h2.5V3a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2a1 1 0 01-1-1V6H20v5h-2.5V8.5h-1l-.1-.1-.61-.63-.48-.63-.37-.63-.26-.63-.16-.63-.08-.63-.01-.63.06-.63.15-.57.25-.51.34-.44.45-.38.59-.33.73-.26.9-.2zM9.75 23.82l-.9-.2-.73-.26-.59-.33-.45-.38-.34-.44-.25-.51-.15-.57-.06-.63.01-.63.08-.63.16-.63.26-.63.37-.63.48-.63.61-.63.1-.1V20h-2.5v1a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v1H4v-5h2.5v2.5h1l.1.1.61.63.48.63.37.63.26.63.16.63.08.63.01.63-.06.63-.15.57-.25.51-.34.44-.45.38-.59.33-.73.26-.9.2z" />
              </svg>
              PYTHON
            </button>
            <button
              onClick={() => toggleLanguage("javascript")}
              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                language === "javascript"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" />
              </svg>
              JS
            </button>
          </div>

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={handleRunCode}
              disabled={codeStatus === CodeStatus.RUNNING}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                codeStatus === CodeStatus.RUNNING
                  ? "bg-green-500/10 text-green-500 cursor-not-allowed opacity-50"
                  : "bg-green-600 hover:bg-green-500 text-white"
              }`}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.512 1.512a.5.5 0 01.5.5v15a.5.5 0 01-1 0V2a.5.5 0 01.5-.5zM15.5 10l-8 4.5V5.5l8 4.5z" />
              </svg>
              RUN
            </button>
            <button
              onClick={handlePauseCode}
              disabled={language === "python"} // Python in Pyodide is single threaded sync execution here
              className={`p-1.5 rounded-md text-xs font-bold transition-all ${
                codeStatus === CodeStatus.PAUSED
                  ? "bg-yellow-500 text-black hover:bg-yellow-400"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              } ${language === "python" ? "opacity-30 cursor-not-allowed" : ""}`}
              title={
                language === "python"
                  ? "Not supported in Python"
                  : codeStatus === CodeStatus.PAUSED
                    ? "Resume"
                    : "Pause"
              }
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                {codeStatus === CodeStatus.PAUSED ? (
                  <path d="M8 5v14l11-7z" />
                ) : (
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                )}
              </svg>
            </button>
            <button
              onClick={handleStopCode}
              className="p-1.5 bg-gray-800 hover:bg-red-600 hover:text-white rounded-md text-gray-300 transition-all"
              title="Stop"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
              codeStatus === CodeStatus.RUNNING
                ? "bg-green-500/20 text-green-400"
                : codeStatus === CodeStatus.PAUSED
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-gray-800 text-gray-400"
            }`}
          >
            {codeStatus}
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 border-2 border-gray-800"></div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Editor & Terminal Section */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0">
            <EditorPane
              code={code}
              language={language}
              onChange={(v) => setCode(v || "")}
            />
          </div>
          <div className="h-1/3 min-h-[150px] max-h-[500px]">
            <TerminalPane lines={terminalLines} onClear={clearTerminal} />
          </div>
        </div>

        {/* AI Sidebar */}
        <ChatPane
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          isLoading={isAiLoading}
        />
      </main>

      {/* Bottom Footer Status Bar */}
      <footer className="h-6 bg-blue-600 shrink-0 flex items-center justify-between px-3 text-[10px] font-medium text-white select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 capitalize">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            {language}
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.3 1.047a1 1 0 01.897.95l1.419 2.812a1 1 0 00.745.541l3.15.45a1 1 0 01.55 1.716l-2.27 2.222a1 1 0 00-.287.892l.534 3.123a1 1 0 01-1.455 1.056L10 13.34l-2.822 1.478a1 1 0 01-1.455-1.056l.534-3.123a1 1 0 00-.287-.892L3.74 7.516a1 1 0 01.55-1.716l3.15-.45a1 1 0 00.745-.541l1.419-2.812a1 1 0 01.897-.95z"
                clipRule="evenodd"
              />
            </svg>
            Master Branch
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white opacity-80"></div>
            Online
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
