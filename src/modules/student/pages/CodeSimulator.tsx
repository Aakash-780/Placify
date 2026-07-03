import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { insforge } from '@/lib/insforge';
import { useRole } from '@/context/RoleContext';
import { useTheme } from '@/context/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import {
    Play, Square, Code2, Terminal as TerminalIcon, RotateCcw,
    Clock, ChevronRight, CheckCircle, Sparkles, Brain, Wand2, Info, AlertTriangle,
    CheckCircle2, AlertCircle, X, Copy, Maximize2, Minimize2, Check, RefreshCw,
    Trophy, Flame, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// CodeMirror 6 imports
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';

const LANG_MAP: Record<string, any> = {
    javascript: javascript({ jsx: false }),
    python: python(),
    java: java(),
    cpp: cpp(),
};

const STARTER_COMMENTS: Record<string, string> = {
    javascript: '// Write your solution here\n\nfunction solve(input) {\n  \n}\n',
    python: '# Write your solution here\n\ndef solve(input):\n    pass\n',
    java: '// Write your solution here\n\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n',
    cpp: '// Write your solution here\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n',
};

const POPULAR_LEETCODE = [
    {
        id: 'lc-1',
        title: '1. Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
        difficulty: 'easy',
        sample_input: 'nums = [2,7,11,15]\ntarget = 9',
        sample_output: '[0,1]',
        constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
        time_limit: 2,
    },
    {
        id: 'lc-2',
        title: '125. Valid Palindrome',
        description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string s, return true if it is a palindrome, or false otherwise.',
        difficulty: 'easy',
        sample_input: 's = "A man, a plan, a canal: Panama"',
        sample_output: 'true',
        constraints: '1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.',
        time_limit: 1,
    },
    {
        id: 'lc-3',
        title: '56. Merge Intervals',
        description: 'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
        difficulty: 'medium',
        sample_input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        sample_output: '[[1,6],[8,10],[15,18]]\n// Explanation: Since intervals [1,3] and [2,6] overlap, merge them into [1,6].',
        constraints: '1 <= intervals.length <= 10^4\nintervals[i].length == 2\n0 <= start_i <= end_i <= 10^4',
        time_limit: 2,
    },
    {
        id: 'lc-4',
        title: '42. Trapping Rain Water',
        description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
        difficulty: 'hard',
        sample_input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
        sample_output: '6',
        constraints: 'n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5',
        time_limit: 3,
    }
];

interface CodeMirrorEditorProps {
    value: string;
    onChange: (val: string) => void;
    language: string;
    theme: 'light' | 'dark';
}

function CodeMirrorEditor({ value, onChange, language, theme }: CodeMirrorEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // Create/recreate editor when language or theme changes
    useEffect(() => {
        if (!containerRef.current) return;

        // Destroy old view
        viewRef.current?.destroy();

        const updateListener = EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                onChangeRef.current(update.state.doc.toString());
            }
        });

        const state = EditorState.create({
            doc: value,
            extensions: [
                lineNumbers(),
                highlightActiveLineGutter(),
                highlightActiveLine(),
                history(),
                bracketMatching(),
                indentOnInput(),
                syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
                keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
                LANG_MAP[language] || javascript(),
                theme === 'dark' ? oneDark : [],
                EditorView.theme({
                    '&': { height: '100%', fontSize: '14px' },
                    '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace" },
                    '.cm-content': { padding: '8px 0' },
                }),
                updateListener,
            ],
        });

        const view = new EditorView({ state, parent: containerRef.current });
        viewRef.current = view;

        return () => view.destroy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language, theme]);

    // Sync external value changes (e.g. Reset button) without recreating
    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        const current = view.state.doc.toString();
        if (current !== value) {
            view.dispatch({
                changes: { from: 0, to: current.length, insert: value },
            });
        }
    }, [value]);

    return <div ref={containerRef} className="h-full w-full overflow-hidden rounded-b-lg" />;
}

const safeBtoa = (str: string) => {
    try {
        return btoa(unescape(encodeURIComponent(str || "")));
    } catch (e) {
        console.error("Base64 encode error:", e);
        return "";
    }
};

const safeAtob = (str: string | null) => {
    if (!str) return "";
    try {
        return decodeURIComponent(escape(atob(str)));
    } catch (e) {
        try {
            return atob(str);
        } catch (err) {
            console.error("Base64 decode error:", err);
            return str;
        }
    }
};

const checkHasNotes = (notesStr: string | null) => {
    if (!notesStr) return false;
    const trimmed = notesStr.trim();
    if (!trimmed) return false;
    try {
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            const parsed = JSON.parse(trimmed);
            return !!(
                (parsed.approach && parsed.approach.trim()) ||
                (parsed.mistakes && parsed.mistakes.trim()) ||
                (parsed.complexity && parsed.complexity.trim())
            );
        }
    } catch (e) { }
    return true;
};

// --- Code Executable Validation Helper ---
const isCodeExecutable = (code: string, lang: string): boolean => {
    if (!code) return true;
    const trimmed = code.trim();
    if (!trimmed) return true;
    if (lang === 'cpp') {
        return code.includes('int main(') || /int\s+main\s*\(/.test(code);
    }
    if (lang === 'java') {
        return code.includes('public static void main') || /public\s+static\s+void\s+main/.test(code);
    }
    if (lang === 'javascript') {
        return code.includes('console.log(') || /console\s*\.\s*log\s*\(/.test(code);
    }
    if (lang === 'python') {
        return code.includes('print(') || /print\s*\(/.test(code) || code.includes('__name__ ==') || code.includes('__name__==');
    }
    return true;
};

// --- Output Normalization Helper ---
const normalizeOutput = (val: string): string => {
    if (!val) return "";
    return val
        .split('\n')
        .map(line => {
            let cleaned = line.trim().toLowerCase();
            // Replace brackets, braces, parentheses, and commas with spaces to handle formatting differences
            cleaned = cleaned.replace(/[\[\]\{\}\(\),]/g, ' ');
            // Collapsing multiple consecutive spaces
            cleaned = cleaned.replace(/\s+/g, ' ');
            return cleaned.trim();
        })
        .filter(line => line.length > 0)
        .join('\n')
        .trim();
};

// --- Runtime Error Likely Cause Helper ---
const getLikelyCause = (stderr: string, lang: string): string => {
    if (!stderr) return "";
    const lower = stderr.toLowerCase();
    
    if (lower.includes('division by zero') || lower.includes('sigfpe') || lower.includes('arithmeticexception: / by zero')) {
        return "Division by zero: Code attempted to divide a number by zero. Check your division/modulo operations.";
    }
    
    if (
        lower.includes('indexerror') || 
        lower.includes('out_of_range') || 
        lower.includes('indexoutofboundsexception') || 
        lower.includes('arrayindexoutofboundsexception') ||
        lower.includes('invalid array length')
    ) {
        return "Index out of bounds: Attempted to access an array, list, vector, or string index that is negative or greater than/equal to the length.";
    }
    
    if (
        lower.includes('nonetype') || 
        lower.includes('nullpointerexception') || 
        lower.includes('cannot read properties of null') || 
        lower.includes('cannot read properties of undefined') ||
        lower.includes('sigsegv') || 
        lower.includes('segmentation fault')
    ) {
        return "Null pointer or invalid memory access: Code attempted to access properties/methods of a null/undefined object, or dereference an invalid/null pointer.";
    }
    
    if (lower.includes('stackoverflow') || lower.includes('maximum call stack size exceeded')) {
        return "Stack Overflow / Infinite Recursion: Code has recursive calls that never reach a base case, or recursion is too deep.";
    }

    if (lower.includes('nameerror') || lower.includes('referenceerror') || lower.includes('cannot find symbol')) {
        return "Undefined variable or function: Attempted to use a variable, class, or function that has not been defined or imported.";
    }

    return "Runtime Exception: An unexpected error occurred during execution. Double-check your logic and edge cases.";
};

// --- Automatic LeetCode Function Wrapper Generator ---
const generateRunnerWrapper = (code: string, language: string, problem: any): string => {
    if (!problem || !problem.sample_input) return code;

    const inputLines = problem.sample_input.split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l && l.includes('=') && !l.startsWith('//') && !l.startsWith('#'));

    const inputVars: Record<string, string> = {};
    inputLines.forEach((line: string) => {
        const parts = line.split('=');
        const name = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        inputVars[name] = value;
    });

    const countOccurrences = (str: string, substr: string) => {
        return str.split(substr).length - 1;
    };

    if (language === 'python') {
        const isClass = code.includes('class Solution');
        // Match Python function or class method definitions
        // def twoSum(self, nums: List[int], target: int) -> List[int]:
        const funcMatch = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
        if (!funcMatch) return code;

        const funcName = funcMatch[1];
        if (countOccurrences(code, `${funcName}(`) > 1) {
            return code;
        }

        const paramsStr = funcMatch[2] || '';
        const params = paramsStr.split(',')
            .map(p => p.split(':')[0].trim())
            .filter(p => p && p !== 'self');

        let prependImports = `from typing import *\n\n`;
        let runner = `\n\n# --- Code Simulator Auto-Runner ---\n`;
        // Define all input variables
        Object.entries(inputVars).forEach(([name, val]) => {
            runner += `${name} = ${val}\n`;
        });

        // Map parameters by name or position
        const argNames: string[] = [];
        const inputKeys = Object.keys(inputVars);
        params.forEach((param, idx) => {
            if (inputVars[param] !== undefined) {
                argNames.push(param);
            } else if (inputKeys[idx] !== undefined) {
                // Name mismatch, create mapping: paramName = inputKeys[idx]
                runner += `${param} = ${inputKeys[idx]}\n`;
                argNames.push(param);
            } else {
                argNames.push('None');
            }
        });

        if (isClass) {
            runner += `solver = Solution()\n`;
            runner += `result = solver.${funcName}(${argNames.join(', ')})\n`;
        } else {
            runner += `result = ${funcName}(${argNames.join(', ')})\n`;
        }
        runner += `print(result)\n`;
        return prependImports + code + runner;
    }

    if (language === 'javascript') {
        const isClass = code.includes('class Solution');
        let funcName = '';
        let paramsStr = '';

        // 1. Check for standard function: function name(args)
        let funcMatch = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
        if (funcMatch) {
            funcName = funcMatch[1];
            paramsStr = funcMatch[2] || '';
        } else {
            // 2. Check for arrow function or expression: const name = (args) => or const name = function(args)
            funcMatch = code.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:\(([^)]*)\)|([a-zA-Z0-9_]+))\s*=>/);
            if (funcMatch) {
                funcName = funcMatch[1];
                paramsStr = funcMatch[2] || funcMatch[3] || '';
            } else {
                funcMatch = code.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*function\s*\(([^)]*)\)/);
                if (funcMatch) {
                    funcName = funcMatch[1];
                    paramsStr = funcMatch[2] || '';
                }
            }
        }

        // 3. If it's a class Solution, match the method inside
        if (!funcName && isClass) {
            // Look for any method like: name(args) {
            const classBodyMatch = code.match(/class\s+Solution\s*\{([\s\S]*)\}/);
            if (classBodyMatch) {
                const body = classBodyMatch[1];
                const methodMatch = body.match(/(?:async|static)?\s*([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/);
                if (methodMatch) {
                    const tempName = methodMatch[1];
                    const reserved = ['if', 'for', 'while', 'switch', 'catch', 'function', 'class', 'constructor'];
                    if (!reserved.includes(tempName)) {
                        funcName = tempName;
                        paramsStr = methodMatch[2] || '';
                    }
                }
            }
        }

        if (!funcName) return code;
        if (countOccurrences(code, `${funcName}(`) > 1) {
            return code;
        }

        const params = paramsStr.split(',').map(p => p.trim()).filter(p => p);
        const inputKeys = Object.keys(inputVars);

        let runner = `\n\n// --- Code Simulator Auto-Runner ---\n`;
        // Define all input variables
        Object.entries(inputVars).forEach(([name, val]) => {
            runner += `let ${name} = ${val};\n`;
        });

        // Map parameters by name or position
        const argNames: string[] = [];
        params.forEach((param, idx) => {
            if (inputVars[param] !== undefined) {
                argNames.push(param);
            } else if (inputKeys[idx] !== undefined) {
                // Name mismatch, create mapping: let paramName = inputKeys[idx];
                runner += `let ${param} = ${inputKeys[idx]};\n`;
                argNames.push(param);
            } else {
                argNames.push('undefined');
            }
        });

        if (isClass) {
            runner += `let solver = new Solution();\n`;
            runner += `let result = solver.${funcName}(${argNames.join(', ')});\n`;
        } else {
            runner += `let result = ${funcName}(${argNames.join(', ')});\n`;
        }
        runner += `console.log(result);\n`;
        return code + runner;
    }

    if (language === 'cpp') {
        if (code.includes('int main') || code.includes('main(')) {
            return code;
        }

        const funcMatch = code.match(/([a-zA-Z0-9_<>&:*]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:const)?\s*\{/);
        if (!funcMatch) return code;

        const returnType = funcMatch[1].trim();
        const funcName = funcMatch[2].trim();
        const paramsStr = funcMatch[3];

        const params = paramsStr.split(',').map(p => p.trim()).filter(p => p);
        const argNames: string[] = [];
        let runnerDecls = '';
        const inputKeys = Object.keys(inputVars);

        params.forEach((param, idx) => {
            const cleanParam = param.replace(/const/g, '').trim();
            const paramMatch = cleanParam.match(/(.+?)\s*&?\s*([a-zA-Z0-9_]+)$/);
            if (paramMatch) {
                const paramType = paramMatch[1].trim().replace(/&/g, '').trim();
                const paramName = paramMatch[2].trim();
                argNames.push(paramName);

                // Find matching input value by name or position
                let inputKey = paramName;
                if (inputVars[paramName] === undefined && inputKeys[idx] !== undefined) {
                    inputKey = inputKeys[idx];
                }

                const rawVal = inputVars[inputKey] || '0';
                let cppVal = rawVal;
                if (paramType.includes('vector') || paramType.includes('[]')) {
                    cppVal = rawVal.replace(/\[/g, '{').replace(/\]/g, '}');
                } else if (paramType === 'string') {
                    if (!rawVal.startsWith('"')) {
                        cppVal = `"${rawVal}"`;
                    }
                }
                runnerDecls += `    ${paramType} ${paramName} = ${cppVal};\n`;
            }
        });

        let prependHeaders = `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\n`;
        let runner = `\n\n// --- Code Simulator Auto-Runner ---\n`;
        runner += `int main() {\n`;
        runner += `    Solution solver;\n`;
        runner += runnerDecls;

        runner += `    auto result = solver.${funcName}(${argNames.join(', ')});\n`;

        if (returnType.includes('vector<vector')) {
            runner += `    cout << "[";\n`;
            runner += `    for (size_t i = 0; i < result.size(); ++i) {\n`;
            runner += `        cout << "[";\n`;
            runner += `        for (size_t j = 0; j < result[i].size(); ++j) {\n`;
            runner += `            cout << result[i][j];\n`;
            runner += `            if (j < result[i].size() - 1) cout << ",";\n`;
            runner += `        }\n`;
            runner += `        cout << "]";\n`;
            runner += `        if (i < result.size() - 1) cout << ",";\n`;
            runner += `    }\n`;
            runner += `    cout << "]" << endl;\n`;
        } else if (returnType.includes('vector')) {
            runner += `    cout << "[";\n`;
            runner += `    for (size_t i = 0; i < result.size(); ++i) {\n`;
            runner += `        cout << result[i];\n`;
            runner += `        if (i < result.size() - 1) cout << ",";\n`;
            runner += `    }\n`;
            runner += `    cout << "]" << endl;\n`;
        } else if (returnType === 'bool') {
            runner += `    cout << (result ? "true" : "false") << endl;\n`;
        } else {
            runner += `    cout << result << endl;\n`;
        }
        runner += `    return 0;\n`;
        runner += `}\n`;

        return prependHeaders + code + runner;
    }

    if (language === 'java') {
        if (code.includes('public static void main') || code.includes('main(')) {
            return code;
        }

        const funcMatch = code.match(/(?:public|private|protected|static|final|\s)+\s+([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:throws\s+[a-zA-Z0-9_, ]+)?\s*\{/);
        if (!funcMatch) return code;

        const returnType = funcMatch[1].trim();
        const funcName = funcMatch[2].trim();
        const paramsStr = funcMatch[3];

        const params = paramsStr.split(',').map(p => p.trim()).filter(p => p);
        const argNames: string[] = [];
        let runnerDecls = '';
        const inputKeys = Object.keys(inputVars);

        params.forEach((param, idx) => {
            const paramParts = param.trim().split(/\s+/);
            if (paramParts.length >= 2) {
                const paramName = paramParts[paramParts.length - 1].trim();
                const paramType = paramParts.slice(0, paramParts.length - 1).join(' ').trim();
                argNames.push(paramName);

                // Find matching input value by name or position
                let inputKey = paramName;
                if (inputVars[paramName] === undefined && inputKeys[idx] !== undefined) {
                    inputKey = inputKeys[idx];
                }

                const rawVal = inputVars[inputKey] || '0';
                let javaVal = rawVal;

                if (paramType.endsWith('[]')) {
                    javaVal = `new ${paramType.replace(/\[\]/g, '')}[]` + rawVal.replace(/\[/g, '{').replace(/\]/g, '}');
                } else if (paramType.startsWith('List') || paramType.startsWith('ArrayList')) {
                    const innerMatch = paramType.match(/<(.+)>/);
                    const innerType = innerMatch ? innerMatch[1].trim() : 'Object';
                    javaVal = `new java.util.ArrayList<${innerType}>(java.util.Arrays.asList(` + rawVal.replace(/\[/g, '').replace(/\]/g, '') + `))`;
                } else if (paramType === 'String') {
                    if (!rawVal.startsWith('"')) {
                        javaVal = `"${rawVal}"`;
                    }
                }
                runnerDecls += `        ${paramType} ${paramName} = ${javaVal};\n`;
            }
        });

        let prependImports = `import java.util.*;\n\n`;
        let runner = `\n\n// --- Code Simulator Auto-Runner ---\n`;
        runner += `class Main {\n`;
        runner += `    public static void main(String[] args) {\n`;
        runner += `        Solution solver = new Solution();\n`;
        runner += runnerDecls;

        runner += `        ${returnType} result = solver.${funcName}(${argNames.join(', ')});\n`;

        if (returnType.endsWith('[][]')) {
            runner += `        System.out.println(java.util.Arrays.deepToString(result));\n`;
        } else if (returnType.endsWith('[]')) {
            runner += `        System.out.println(java.util.Arrays.toString(result));\n`;
        } else {
            runner += `        System.out.println(result);\n`;
        }
        runner += `    }\n`;
        runner += `}\n`;

        return prependImports + code + runner;
    }

    return code;
};

// --- AI Response String Parser ---
const parseAiResponse = (text: string) => {
    let mistakesText = '';
    let fixText = '';
    let codeText = '';

    const mistakesHeaderMatch = text.match(/##\s*(Mistakes|Why Wrong|Error)[\s\S]*?(?=##\s*Fix)/i);
    const fixHeaderMatch = text.match(/##\s*Fix[\s\S]*?(?=##\s*Correct Code)/i);
    const codeHeaderMatch = text.match(/##\s*Correct Code([\s\S]*)/i);

    if (mistakesHeaderMatch) {
        mistakesText = mistakesHeaderMatch[0].replace(/##\s*(Mistakes|Why Wrong|Error)/i, '').trim();
    }
    if (fixHeaderMatch) {
        fixText = fixHeaderMatch[0].replace(/##\s*Fix/i, '').trim();
    }
    if (codeHeaderMatch) {
        codeText = codeHeaderMatch[1].trim();
        codeText = codeText.replace(/^```[a-zA-Z0-9_]*\n/i, '').replace(/\n```$/g, '').trim();
    }

    if (!mistakesHeaderMatch && !fixHeaderMatch && !codeHeaderMatch) {
        return null;
    }

    return {
        mistakesHeader: mistakesHeaderMatch ? mistakesHeaderMatch[1] : 'Mistakes',
        mistakesText,
        fixText,
        codeText
    };
};

export default function CodeSimulator() {
    const ENABLE_AI_ASSISTANT = false;
    const { roleData } = useRole();
    const { resolvedTheme } = useTheme();
    const [searchParams, setSearchParams] = useSearchParams();
    const [problems, setProblems] = useState<any[]>([]);
    const [selectedProblem, setSelectedProblem] = useState<any>(null);
    const [code, setCode] = useState(STARTER_COMMENTS.javascript);
    const [language, setLanguage] = useState(() => localStorage.getItem("activeCodingLanguage") || 'javascript');
    const [output, setOutput] = useState('');
    const [running, setRunning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showCelebrationModal, setShowCelebrationModal] = useState(false);
    const [confetti, setConfetti] = useState<{ id: number; style: React.CSSProperties }[]>([]);
    const [motivationalMessage, setMotivationalMessage] = useState('');

    // Toast notifications state
    interface Toast {
        id: string;
        message: string;
        type: 'success' | 'error' | 'info';
    }
    const [toasts, setToasts] = useState<Toast[]>([]);
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const getExecutionStatusBadge = () => {
        if (!lastExecutionData) return null;

        const isCompileError = !!lastExecutionData.compile_output;
        const isRuntimeError = !!lastExecutionData.stderr;
        const isSuccess = !isCompileError && !isRuntimeError;
        const hasNoOutput = isSuccess && !lastExecutionData.stdout;

        if (isCompileError) {
            return (
                <div className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 border-b border-red-500/20 text-xs font-semibold">
                    <span>🔴 Compilation Error</span>
                </div>
            );
        }
        if (isRuntimeError) {
            return (
                <div className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 border-b border-red-500/20 text-xs font-semibold">
                    <span>🔴 Runtime Error</span>
                </div>
            );
        }
        if (hasNoOutput) {
            return (
                <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-b border-amber-500/20 text-xs font-semibold">
                    <span>🟡 Code Ran But No Output Produced</span>
                </div>
            );
        }
        if (isSuccess) {
            return (
                <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-b border-emerald-500/20 text-xs font-semibold">
                    <span>🟢 Execution Successful</span>
                </div>
            );
        }
        return null;
    };

    const renderAiResponse = (text: string) => {
        if (!text) return null;
        
        // Skip structured parsing for general conversational/info modes
        const skipParsing = ['hint', 'approach', 'optimize', 'review', 'chat'].includes(aiMode);
        const parsed = skipParsing ? null : parseAiResponse(text);

        if (!parsed) {
            return (
                <div className="text-sm whitespace-pre-wrap leading-relaxed font-sans prose dark:prose-invert max-w-none space-y-2">
                    {text}
                </div>
            );
        }

        const { mistakesHeader, mistakesText, fixText, codeText } = parsed;
        const codeIsExecutable = isCodeExecutable(codeText, language);

        return (
            <div className="space-y-4 font-sans text-sm">
                {mistakesText && (
                    <div className="border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 rounded-lg p-4">
                        <h4 className="text-red-700 dark:text-red-400 font-semibold mb-2 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {mistakesHeader}
                        </h4>
                        <ul className="pl-5 text-red-800 dark:text-red-300 space-y-1 list-disc">
                            {mistakesText.split('\n').map((line, idx) => {
                                const cleaned = line.replace(/^\s*[*+-]\s*/, '').trim();
                                if (!cleaned) return null;
                                return <li key={idx}>{cleaned}</li>;
                            })}
                        </ul>
                    </div>
                )}

                {fixText && (
                    <div className="border border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-4">
                        <h4 className="text-amber-700 dark:text-amber-400 font-semibold mb-2 flex items-center gap-1.5">
                            <Info className="w-4 h-4 shrink-0" />
                            Fix
                        </h4>
                        <ul className="pl-5 text-amber-800 dark:text-amber-300 space-y-1 list-disc">
                            {fixText.split('\n').map((line, idx) => {
                                const cleaned = line.replace(/^\s*[*+-]\s*/, '').trim();
                                if (!cleaned) return null;
                                return <li key={idx}>{cleaned}</li>;
                            })}
                        </ul>
                    </div>
                )}

                {codeText && (
                    <div className="space-y-2">
                        {!codeIsExecutable && (
                            <div className="border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 rounded-lg p-3 flex items-start gap-2.5">
                                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-amber-800 dark:text-amber-200">⚠ AI generated non-executable code.</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">This appears to be a LeetCode-style solution and may not run directly in the simulator.</p>
                                </div>
                            </div>
                        )}
                        <div className="border border-border rounded-lg overflow-hidden bg-slate-900 text-slate-100">
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 text-xs">
                                <span className="font-mono text-slate-400 font-semibold uppercase">{language}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-700 px-2 flex items-center gap-1"
                                    onClick={() => {
                                        navigator.clipboard.writeText(codeText);
                                        showToast("Code copied to clipboard!", "success");
                                    }}
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy Code
                                </Button>
                            </div>
                            <pre className="p-4 overflow-auto max-h-[350px] text-xs font-mono whitespace-pre leading-relaxed scrollbar-thin">
                                <code>{codeText}</code>
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // =====================================================
    // FEATURE: STATE & HOOKS
    // =====================================================
    const [currentPage, setCurrentPage] = useState(1);
    const QUESTIONS_PER_PAGE = 6;

    const [progressList, setProgressList] = useState<any[]>([]);
    const [notes, setNotes] = useState('');
    const [isSolved, setIsSolved] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [showAiDialog, setShowAiDialog] = useState(false);
    const [isWrongAnswer, setIsWrongAnswer] = useState(false);
    const [aiMode, setAiMode] = useState<'hint' | 'approach' | 'optimize' | 'solution' | 'error' | 'wrong_answer' | 'review' | 'chat'>('hint');
    const [lastExecutionData, setLastExecutionData] = useState<any>(null);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [leftTab, setLeftTab] = useState('description');
    const [bottomTab, setBottomTab] = useState('testcase');
    const [codeAutosaveStatus, setCodeAutosaveStatus] = useState<'Saved' | 'Saving...' | ''>('');
    const [progressLoaded, setProgressLoaded] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [modalApproach, setModalApproach] = useState('');
    const [modalMistakes, setModalMistakes] = useState('');
    const [modalComplexity, setModalComplexity] = useState('');
    const [autosaveStatus, setAutosaveStatus] = useState<'Saved' | 'Saving...' | ''>('');

    // Reset page back to 1 when problems changes
    useEffect(() => {
        setCurrentPage(1);
    }, [problems]);

    // Reset AI states when selectedProblem changes
    useEffect(() => {
        setAiResponse('');
        setChatHistory([]);
        setChatInput('');
        setAiMode('hint');
    }, [selectedProblem]);

    // Handlers and effects for the Accepted Celebration Modal
    useEffect(() => {
        if (showCelebrationModal) {
            // Pick a random motivational message
            const messages = [
                "Great job! Keep the streak alive 🔥",
                "Excellent work! You're improving every day 🚀",
                "Another problem conquered 💪",
                "Consistency beats talent. Keep going ⭐"
            ];
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            setMotivationalMessage(randomMsg);

            // Trigger the toast notification after modal appears
            showToast("🎉 Accepted! All test cases passed.", "success");

            // Generate confetti particles
            const particles = Array.from({ length: 45 }).map((_, idx) => {
                const angle = Math.random() * Math.PI * 2;
                const distance = 40 + Math.random() * 160;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance - 30; // push slightly upwards
                const r = Math.random() * 360;
                const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const size = 6 + Math.random() * 8;
                return {
                    id: idx,
                    style: {
                        position: 'absolute' as const,
                        left: '50%',
                        top: '50%',
                        width: `${size}px`,
                        height: `${size}px`,
                        backgroundColor: color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        '--x': `${x}px`,
                        '--y': `${y}px`,
                        '--r': `${r}deg`,
                        transform: 'translate(-50%, -50%)',
                    } as React.CSSProperties
                };
            });
            setConfetti(particles);
        } else {
            setConfetti([]);
        }
    }, [showCelebrationModal]);

    const codeSaveTimeoutRef = useRef<any>(null);
    const notesSaveTimeoutRef = useRef<any>(null);
    const lastRestoredProblemIdRef = useRef<string | null>(null);
    const originalNotesRef = useRef('');
    const hasRestoredOnLoadRef = useRef(false);

    // Sync language state to localStorage
    useEffect(() => {
        localStorage.setItem("activeCodingLanguage", language);
    }, [language]);

    // Sync selectedProblem state to search parameters and localStorage
    useEffect(() => {
        if (!hasRestoredOnLoadRef.current) return;

        if (selectedProblem) {
            const problemId = selectedProblem.id !== null ? String(selectedProblem.id) : 'free';
            localStorage.setItem("activeCodingProblem", problemId);
            setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.set('problem', problemId);
                return next;
            });
        } else {
            if (localStorage.getItem("activeCodingProblem")) {
                localStorage.removeItem("activeCodingProblem");
            }
            if (searchParams.has('problem')) {
                setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    next.delete('problem');
                    return next;
                });
            }
        }
    }, [selectedProblem, setSearchParams]);

    // =====================================================
    // FEATURE: PROGRESS TRACKING & BULK LOADING
    // =====================================================
    useEffect(() => {
        async function fetch() {
            setLoading(true);
            console.log("Loading coding problems...");
            const { data: problemsData, error: problemsError } = await insforge.database.from('coding_problems').select('*').order('created_at', { ascending: false });
            if (problemsError) {
                console.error("Error loading coding problems:", problemsError);
            }
            const loadedProblems = problemsData && problemsData.length > 0 ? problemsData : POPULAR_LEETCODE;
            setProblems(loadedProblems);

            if (roleData?.id) {
                console.log("Loading coding_progress in bulk for student ID:", roleData.id);
                const { data, error } = await insforge.database
                    .from('coding_progress')
                    .select('*')
                    .eq('student_id', roleData.id);

                if (error) {
                    console.error(error);
                } else {
                    console.log("Loaded progress", data);
                    setProgressList(data || []);
                    setProgressLoaded(true);
                }
            } else {
                console.log("No student logged in (roleData.id is null). Skipping progress load.");
            }

            // Restore last active problem
            if (!hasRestoredOnLoadRef.current) {
                const urlParams = new URLSearchParams(window.location.search);
                const urlProblemId = urlParams.get('problem');
                const activeProblemId = urlProblemId || localStorage.getItem("activeCodingProblem");
                if (activeProblemId) {
                    if (activeProblemId === 'free') {
                        lastRestoredProblemIdRef.current = null;
                        setSelectedProblem({ id: null, title: 'Free Coding', description: 'Write any code you want!', difficulty: 'easy' });
                    } else {
                        const restoredProblem = loadedProblems.find((p: any) => String(p.id) === String(activeProblemId));
                        if (restoredProblem) {
                            lastRestoredProblemIdRef.current = null;
                            setSelectedProblem(restoredProblem);
                        }
                    }
                }
                hasRestoredOnLoadRef.current = true;
            }

            setLoading(false);
        }
        fetch();
    }, [roleData]);

    // =====================================================
    // FEATURE: WORKSPACE RESTORATION (LOADS INDIVIDUAL PROBLEM ON SELECTION)
    // =====================================================
    useEffect(() => {
        if (!roleData?.id || !selectedProblem || !selectedProblem.id) return;

        // Skip if already restored this problem to prevent overwriting user input
        if (lastRestoredProblemIdRef.current === selectedProblem.id) return;

        async function loadSelectedProgress() {
            try {
                console.log("Loading progress for selected problem from DB:", selectedProblem.id);
                const { data, error } = await insforge.database
                    .from('coding_progress')
                    .select('*')
                    .eq('student_id', roleData.id)
                    .eq('problem_id', selectedProblem.id)
                    .maybeSingle();

                if (error) {
                    console.error(error);
                } else {
                    console.log("Loaded progress", data);
                    console.log("Loaded code", data?.last_code);
                    if (data) {
                        setNotes(data.notes || '');
                        setIsSolved(data.status === 'solved');

                        if (data.last_language) {
                            setLanguage(data.last_language);
                        }
                        if (data.last_code) {
                            setCode(data.last_code);
                        } else {
                            const starterLang = data.last_language || language;
                            setCode(selectedProblem.starter_code?.[starterLang] || STARTER_COMMENTS[starterLang] || '// Write your solution here\n');
                        }

                        // Update cache
                        setProgressList(prev => {
                            const next = [...prev];
                            const idx = next.findIndex(p => p.problem_id === selectedProblem.id);
                            if (idx >= 0) {
                                next[idx] = data;
                            } else {
                                next.push(data);
                            }
                            return next;
                        });
                    } else {
                        console.log("No progress record found for problem in DB:", selectedProblem.id);
                        setNotes('');
                        setIsSolved(false);
                        setCode(selectedProblem.starter_code?.[language] || STARTER_COMMENTS[language] || '// Write your solution here\n');
                    }

                    lastRestoredProblemIdRef.current = selectedProblem.id;
                    setIsWrongAnswer(false);
                    setLastExecutionData(null);
                }
            } catch (err) {
                console.error("Exception loading progress:", err);
            }
        }

        loadSelectedProgress();
    }, [selectedProblem, roleData]);

    // =====================================================
    // FEATURE: AUTO SAVE CORE LOGIC
    // =====================================================
    const saveProgress = async (updates: Partial<{ status: string; notes: string; last_code: string; last_language: string }>) => {
        if (!roleData?.id || !selectedProblem || !selectedProblem.id) return;

        const existing = progressList.find(p => p.problem_id === selectedProblem.id);

        let completed = updates.status || existing?.status || 'unsolved';
        if (completed === 'started') {
            completed = 'unsolved';
        }
        const notesToSave = updates.notes !== undefined ? updates.notes : (existing?.notes || notes);
        const codeToSave = updates.last_code !== undefined ? updates.last_code : (existing?.last_code || code);

        console.log(
            "Saving Progress",
            {
                studentId: roleData?.id,
                problemId: selectedProblem?.id,
                status: completed,
                notes: notesToSave,
                code: codeToSave
            }
        );
        console.log("Saving code", codeToSave);

        try {
            console.log("Upserting coding_progress in DB for problem:", selectedProblem.id, "student:", roleData.id);
            const { data, error } = await insforge.database
                .from('coding_progress')
                .upsert({
                    student_id: roleData.id,
                    problem_id: selectedProblem.id,
                    status: completed,
                    notes: notesToSave,
                    last_code: codeToSave,
                    last_language: updates.last_language !== undefined ? updates.last_language : (existing?.last_language || language),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'student_id,problem_id' })
                .select();

            if (error) {
                console.error(error);
            } else if (data && data[0]) {
                console.log("Successfully upserted coding_progress row:", data[0]);
                console.log("Loaded code", data[0].last_code);
                setProgressList(prev => {
                    const next = [...prev];
                    const idx = next.findIndex(p => p.problem_id === selectedProblem.id);
                    if (idx >= 0) {
                        next[idx] = data[0];
                    } else {
                        next.push(data[0]);
                    }
                    return next;
                });
            }
        } catch (err) {
            console.error('Exception inside saveProgress:', err);
        }
    };

    // Auto-save code on change (Debounce 1500ms)
    useEffect(() => {
        if (!selectedProblem || !selectedProblem.id) return;
        if (lastRestoredProblemIdRef.current !== selectedProblem.id) return; // Wait until restoration completes

        const prog = progressList.find(p => p.problem_id === selectedProblem.id);
        if (prog && prog.last_code === code && prog.last_language === language) return;
        if (!prog && code === (selectedProblem.starter_code?.[language] || STARTER_COMMENTS[language])) return;

        if (codeSaveTimeoutRef.current) clearTimeout(codeSaveTimeoutRef.current);

        setCodeAutosaveStatus('Saving...');
        codeSaveTimeoutRef.current = setTimeout(async () => {
            await saveProgress({ last_code: code, last_language: language });
            setCodeAutosaveStatus('Saved');
        }, 1500);

        return () => {
            if (codeSaveTimeoutRef.current) clearTimeout(codeSaveTimeoutRef.current);
        };
    }, [code, language, selectedProblem]);

    // Synchronize modalApproach/modalMistakes/modalComplexity when notes changes externally
    useEffect(() => {
        let approachVal = '';
        let mistakesVal = '';
        let complexityVal = '';

        try {
            if (notes && notes.startsWith('{') && notes.endsWith('}')) {
                const parsed = JSON.parse(notes);
                approachVal = parsed.approach || '';
                mistakesVal = parsed.mistakes || '';
                complexityVal = parsed.complexity || '';
            } else {
                approachVal = notes || '';
            }
        } catch (e) {
            approachVal = notes || '';
        }

        setModalApproach(approachVal);
        setModalMistakes(mistakesVal);
        setModalComplexity(complexityVal);
    }, [notes]);

    // Debounced autosave for Revision Notebook fields (inline in Tabs or in Modal)
    useEffect(() => {
        if (!selectedProblem || !selectedProblem.id) return;

        const compiled = JSON.stringify({
            approach: modalApproach,
            mistakes: modalMistakes,
            complexity: modalComplexity
        });

        if (compiled === notes) {
            setAutosaveStatus('Saved');
            return;
        }

        setAutosaveStatus('Saving...');
        const timer = setTimeout(async () => {
            setNotes(compiled);
            if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current);
            await saveProgress({ notes: compiled });
            setAutosaveStatus('Saved');
        }, 1000);

        return () => clearTimeout(timer);
    }, [modalApproach, modalMistakes, modalComplexity, selectedProblem, notes]);

    // Auto-save notes on change (Debounce 1000ms)
    const handleNotesChange = (val: string) => {
        setNotes(val);

        if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current);

        notesSaveTimeoutRef.current = setTimeout(() => {
            saveProgress({ notes: val });
        }, 1000);
    };

    const openNotesModal = () => {
        let approachVal = '';
        let mistakesVal = '';
        let complexityVal = '';

        try {
            if (notes.startsWith('{') && notes.endsWith('}')) {
                const parsed = JSON.parse(notes);
                approachVal = parsed.approach || '';
                mistakesVal = parsed.mistakes || '';
                complexityVal = parsed.complexity || '';
            } else {
                approachVal = notes || '';
            }
        } catch (e) {
            approachVal = notes || '';
        }

        setModalApproach(approachVal);
        setModalMistakes(mistakesVal);
        setModalComplexity(complexityVal);
        originalNotesRef.current = notes;
        setAutosaveStatus('Saved');
        setShowNotesModal(true);
    };

    const handleNotesSave = async () => {
        const compiled = JSON.stringify({
            approach: modalApproach,
            mistakes: modalMistakes,
            complexity: modalComplexity
        });
        setNotes(compiled);
        if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current);
        await saveProgress({ notes: compiled });
        setShowNotesModal(false);
    };

    const handleNotesCancel = async () => {
        const orig = originalNotesRef.current;
        setNotes(orig);
        if (notesSaveTimeoutRef.current) clearTimeout(notesSaveTimeoutRef.current);
        await saveProgress({ notes: orig });
        setShowNotesModal(false);
    };

    // Toggle Solved status instantly
    const handleSolvedToggle = async (checked: boolean) => {
        setIsSolved(checked);
        const newStatus = checked ? 'solved' : 'unsolved';
        await saveProgress({ status: newStatus });
    };

    // =====================================================
    // FEATURE: AI ASSISTANT API INTEGRATION
    // =====================================================
    const askGemini = async (
        mode: 'hint' | 'approach' | 'optimize' | 'solution' | 'error' | 'wrong_answer' | 'review' | 'chat',
        customMessage?: string
    ) => {
        setAiMode(mode);

        const key = import.meta.env.VITE_GEMINI_API_KEY;
        console.log(`[AI Assistant] Gemini API Key status check:`, {
            exists: !!key,
            length: key ? key.length : 0,
            prefix: key ? key.substring(0, 7) : 'none',
            isPlaceholder: key === 'your_gemini_api_key_here'
        });

        if (!key || key === 'your_gemini_api_key_here') {
            const errorMsg = "⚠️ VITE_GEMINI_API_KEY is not configured in your environment variables.";
            console.error(`[AI Assistant] Key Configuration Error: ${errorMsg}`);
            if (mode === 'chat') {
                setChatHistory(prev => [...prev, { sender: 'ai', text: errorMsg }]);
            } else {
                setAiResponse(errorMsg);
            }
            return;
        }

        if (mode === 'chat') {
            if (!customMessage?.trim()) return;
            const newUserMessage = { sender: 'user' as const, text: customMessage.trim() };
            setChatHistory(prev => [...prev, newUserMessage]);
        }

        setAiLoading(true);
        if (mode !== 'chat') {
            setAiResponse("Thinking...");
        }

        try {
            let modeInstructions = "";
            switch (mode) {
                case 'hint':
                    modeInstructions = `You must provide a subtle, conceptual hint to help the student progress.
Do NOT write or reveal the correct code solution.
Focus on:
- Clues about the algorithm or pattern.
- Edge cases they might have missed.
- No direct code snippets. Only conceptual guidance.`;
                    break;
                case 'approach':
                    modeInstructions = `You must explain the optimal algorithmic approach in detail.
Focus on:
- Explaining the time and space complexity.
- Describing the steps of the algorithm clearly.
- Showing pseudocode or high-level structure, but do NOT write the full concrete code yet.`;
                    break;
                case 'optimize':
                    modeInstructions = `You must suggest performance, memory, or readability optimizations for the student's current code.
Focus on:
- Analyzing time/space complexity of the current code.
- Outlining more efficient alternatives.
- Showing optimized snippets where relevant.`;
                    break;
                case 'solution':
                    modeInstructions = `You must reveal the complete, optimal, and correct code solution.
Follow this Markdown format:
## Correct Code
\`\`\`${language}
<full corrected code>
\`\`\`
## Explanation
- <Brief explanation of why this solution is optimal>

Do NOT return LeetCode-only Solution classes unless necessary. The code must run in Judge0.`;
                    break;
                case 'review':
                    modeInstructions = `You must perform a detailed Code Review of the student's current code.
Check for:
- Code cleanliness and formatting.
- Potential edge cases (e.g. empty inputs, null pointers, overflow).
- Performance bottleneck issues.
Structure your response with bullet points under "## Strengths", "## Areas for Improvement", and "## Edge Cases to Test".`;
                    break;
                case 'chat':
                    modeInstructions = `You are a coding mentor. Answer the student's specific question: "${customMessage}"
Provide direct, clean explanations. If they ask for code, show snippets but keep it educational.`;
                    break;
                case 'error':
                case 'wrong_answer':
                default:
                    modeInstructions = `Analyze the student's mistakes and explain how to fix them.
You must structure your response exactly in this Markdown format:
## Mistakes
- <Brief bullet list of what is wrong or compiler/runtime errors>

## Fix
- <Brief explanation of how to fix it>

## Correct Code
\`\`\`${language}
<full corrected code>
\`\`\`
`;
                    break;
            }

            // Compile chat history if chat mode is active
            let historyContext = "";
            if (mode === 'chat' && chatHistory.length > 0) {
                historyContext = `CONVERSATION HISTORY:\n` + 
                    chatHistory.slice(-4).map(msg => `${msg.sender.toUpperCase()}: ${msg.text}`).join('\n') + `\n`;
            }

            const prompt = `You are generating code for a Judge0-based Code Simulator.

RULES:
1. Return COMPLETE executable code.
2. Include main() when required.
3. Follow the exact sample input format.
4. Follow the exact sample output format.
5. Do not return LeetCode-only Solution classes unless explicitly requested.
6. Code must compile and run directly in Judge0.
7. Preserve the user's approach whenever possible.
8. Fix only the mistakes.
9. Return corrected code first.
10. Keep explanations short. No essays. No theory. No long explanations.

PROBLEM DETAILS:
- Title: ${selectedProblem?.title || 'Free Coding'}
- Description: ${selectedProblem?.description || 'N/A'}
- Constraints: ${selectedProblem?.constraints || 'N/A'}

STUDENT CONTEXT:
- Programming Language: ${language}
- Student's Current Code:
\`\`\`${language}
${code}
\`\`\`

EXECUTION RESULTS:
- Current Terminal Output: ${output || 'No output recorded yet'}
${lastExecutionData?.compile_output ? `- Compiler Error Output: ${lastExecutionData.compile_output}` : ''}
${lastExecutionData?.stderr ? `- Runtime Error Output: ${lastExecutionData.stderr}` : ''}
${mode === 'wrong_answer' ? `- Expected Output: ${selectedProblem?.sample_output || 'N/A'}` : ''}

STRICT FORMAT RULES:
- Maximum 5 bullet points total across the entire response.
- No introduction (do not write "Here is the analysis...", "Sure...", "Based on your code...", etc.).
- No conclusion or motivational text (do not write "Keep coding!", "Good luck!", "Hope this helps", etc.).
- No theory paragraphs or general explanations of syntax.
- Always provide the full corrected code inside a Markdown code block under the "## Correct Code" header.
- Focus strictly on the student's mistakes/errors and direct fixes.

${historyContext}
${modeInstructions}`;

            console.log(`[AI Assistant] Prompt Generated for mode "${mode}":\n`, prompt);

            const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3, initialDelay = 1000): Promise<Response> => {
                let delay = initialDelay;
                for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
                    try {
                        console.log(`[AI Assistant] Request Payload (Attempt ${attempt}/${maxRetries + 1}):\n`, options.body);
                        const res = await fetch(url, options);

                        if (res.ok) {
                            console.log(`[AI Assistant] API Response Status: ${res.status} OK`);
                            return res;
                        }

                        console.error(`[AI Assistant] Error Response Received (Attempt ${attempt}): Status ${res.status}`);

                        if (res.status === 429) {
                            const rateLimitMsg = "AI service rate limit reached. Please try again later.";
                            console.warn(`[AI Assistant] 429 Too Many Requests. Aborting retries.`);
                            throw new Error(`API_429: ${rateLimitMsg}`);
                        }

                        if (res.status === 503) {
                            if (attempt <= maxRetries) {
                                const retryMsg = "AI service temporarily unavailable. Retrying...";
                                console.warn(`[AI Assistant] 503 Service Unavailable. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
                                if (mode !== 'chat') {
                                    setAiResponse(retryMsg);
                                }
                                await new Promise(resolve => setTimeout(resolve, delay));
                                delay *= 2; // Exponential backoff
                                continue;
                            } else {
                                throw new Error("API_503: AI service temporarily unavailable after multiple retries.");
                            }
                        }

                        let errorDetail = "";
                        try {
                            errorDetail = await res.text();
                        } catch {}
                        console.error(`[AI Assistant] API Error Detail (Attempt ${attempt}):`, errorDetail);
                        throw new Error(`Gemini API error ${res.status}: ${errorDetail || 'Unknown error'}`);
                    } catch (err: any) {
                        if (err.message.startsWith('API_429') || err.message.startsWith('API_503')) {
                            throw err;
                        }

                        if (attempt <= maxRetries) {
                            console.warn(`[AI Assistant] Network error or exception (Attempt ${attempt}/${maxRetries}):`, err, `Retrying in ${delay}ms...`);
                            if (mode !== 'chat') {
                                setAiResponse("AI service temporarily unavailable. Retrying...");
                            }
                            await new Promise(resolve => setTimeout(resolve, delay));
                            delay *= 2;
                        } else {
                            throw err;
                        }
                    }
                }
                throw new Error("Maximum retry attempts reached without response.");
            };

            const res = await fetchWithRetry(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
                {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.2 },
                    }),
                }
            );

            const data = await res.json();
            console.log(`[AI Assistant] Response JSON Payload:`, data);

            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
            console.log("=== AI RESPONSE RECEIVED ===\n", responseText);

            if (mode === 'chat') {
                setChatHistory(prev => [...prev, { sender: 'ai', text: responseText }]);
            } else {
                setAiResponse(responseText);
            }
        } catch (err: any) {
            console.error('Gemini error final catch:', err);

            if (err.message.includes('API_429') || err.message.includes('rate limit reached')) {
                const msg = "AI service rate limit reached. Please try again later.";
                if (mode === 'chat') {
                    setChatHistory(prev => [...prev, { sender: 'ai', text: msg }]);
                } else {
                    setAiResponse(msg);
                }
            } else if (err.message.includes('API_503') || err.message.includes('temporarily unavailable')) {
                const msg = "AI service temporarily unavailable. Please try again later.";
                if (mode === 'chat') {
                    setChatHistory(prev => [...prev, { sender: 'ai', text: msg }]);
                } else {
                    setAiResponse(msg);
                }
            } else {
                const msg = `⚠️ Failed to connect to Gemini: ${err.message || 'Unknown error'}`;
                if (mode === 'chat') {
                    setChatHistory(prev => [...prev, { sender: 'ai', text: msg }]);
                } else {
                    setAiResponse(msg);
                }
            }
        } finally {
            setAiLoading(false);
        }
    };

    // When language changes, reset code to starter template
    const handleLanguageChange = useCallback((lang: string) => {
        setLanguage(lang);
        setCode(selectedProblem?.starter_code?.[lang] || STARTER_COMMENTS[lang] || '// Write your code here\n');
    }, [selectedProblem]);

    const runCode = async () => {
        setRunning(true);
        setBottomTab('result');
        setOutput('Running code securely...\n');
        setIsWrongAnswer(false);
        setLastExecutionData(null);
        try {
            // Map our UI languages to Judge0 CE API language IDs
            const judge0LangMap: Record<string, number> = {
                javascript: 63,
                python: 71,
                java: 62,
                cpp: 54
            };

            const langId = judge0LangMap[language] || 63;
            const stdinData = selectedProblem?.sample_input?.replace(/^.*=\s*/gm, '') || "";

            let executeCode = generateRunnerWrapper(code, language, selectedProblem);

            console.log("=== GENERATED WRAPPER ===");
            console.log(executeCode);

            console.log("=== JUDGE0 REQUEST ===");
            console.log({
                source_code: executeCode,
                language_id: langId,
                stdin: stdinData
            });

            const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_code: safeBtoa(executeCode),
                    language_id: langId,
                    stdin: safeBtoa(stdinData)
                })
            });

            if (!res.ok) {
                throw new Error(`Code Execution API Error ${res.status}`);
            }

            const data = await res.json();

            // Add temporary debugging logs
            console.log("=== JUDGE0 RESPONSE ===");
            console.log(data);

            const stdout = safeAtob(data.stdout);
            const stderr = safeAtob(data.stderr);
            const compileOutput = safeAtob(data.compile_output);

            console.log("=== EXPECTED OUTPUT ===");
            console.log(selectedProblem?.sample_output);

            console.log("=== ACTUAL OUTPUT ===");
            console.log(stdout);

            let finalOutput = '';
            if (compileOutput) {
                finalOutput += `Compile Error:\n${compileOutput}\n`;
            } else if (stderr) {
                const cause = getLikelyCause(stderr, language);
                finalOutput += `Runtime Error:\n${stderr}\n\nLikely Cause:\n${cause}\n`;
                if (stdout) {
                    finalOutput += `\nOutput:\n${stdout}\n`;
                }
            } else if (stdout) {
                finalOutput += `${stdout}\n`;
            } else {
                finalOutput = `✅ Code Executed Successfully\n\nNo output was produced.\n\nTo display output:\n\nC++:\ncout << result;\n\nPython:\nprint(result)\n\nJavaScript:\nconsole.log(result)\n\nJava:\nSystem.out.println(result)`;
            }

            setOutput(finalOutput.trim());

            const decodedData = {
                ...data,
                stdout,
                stderr,
                compile_output: compileOutput
            };
            setLastExecutionData(decodedData); // Save complete execution payload

            // =====================================================
            // FEATURE: WRONG ANSWER DETECTION
            // =====================================================
            let waDetected = false;
            if (!compileOutput && !stderr && selectedProblem?.sample_output) {
                const cleanActual = normalizeOutput(stdout);
                const cleanExpected = normalizeOutput(selectedProblem.sample_output);
                if (cleanActual !== cleanExpected) {
                    waDetected = true;
                }
            }
            setIsWrongAnswer(waDetected);

            // Save submission to database
            if (roleData?.id && selectedProblem && selectedProblem.id !== null && !String(selectedProblem.id).startsWith('lc-')) {
                await insforge.database.from('coding_submissions').insert({
                    student_id: roleData.id,
                    problem_id: selectedProblem.id,
                    code,
                    language,
                    output: finalOutput.substring(0, 500),
                    status: 'completed',
                });
            }
        } catch (err: any) {
            setOutput(`Error: ${err.message || 'Something went wrong'}`);
        } finally {
            setRunning(false);
        }
    };

    // Submits the code, evaluates matching cases, marks solved and saves record
    const submitCode = async () => {
        setRunning(true);
        setBottomTab('result');
        setOutput('Submitting solution securely...\n');
        setIsWrongAnswer(false);
        setLastExecutionData(null);
        try {
            const judge0LangMap: Record<string, number> = {
                javascript: 63,
                python: 71,
                java: 62,
                cpp: 54
            };

            const langId = judge0LangMap[language] || 63;
            const stdinData = selectedProblem?.sample_input?.replace(/^.*=\s*/gm, '') || "";
            let executeCode = generateRunnerWrapper(code, language, selectedProblem);

            console.log("=== GENERATED WRAPPER ===");
            console.log(executeCode);

            console.log("=== JUDGE0 SUBMISSION REQUEST ===");
            console.log({
                source_code: executeCode,
                language_id: langId,
                stdin: stdinData
            });

            const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_code: safeBtoa(executeCode),
                    language_id: langId,
                    stdin: safeBtoa(stdinData)
                })
            });

            if (!res.ok) {
                throw new Error(`Code Submission API Error ${res.status}`);
            }

            const data = await res.json();

            console.log("=== JUDGE0 SUBMISSION RESPONSE ===");
            console.log(data);

            const stdout = safeAtob(data.stdout);
            const stderr = safeAtob(data.stderr);
            const compileOutput = safeAtob(data.compile_output);

            console.log("=== EXPECTED OUTPUT ===");
            console.log(selectedProblem?.sample_output);

            console.log("=== ACTUAL OUTPUT ===");
            console.log(stdout);

            let finalOutput = '';
            let waDetected = false;

            if (compileOutput) {
                finalOutput += `Compile Error:\n${compileOutput}\n`;
            } else if (stderr) {
                const cause = getLikelyCause(stderr, language);
                finalOutput += `Runtime Error:\n${stderr}\n\nLikely Cause:\n${cause}\n`;
            } else if (stdout) {
                finalOutput += `${stdout}\n`;
            } else {
                finalOutput = `✅ Code Executed Successfully\n\nNo output was produced.`;
            }

            if (!compileOutput && !stderr && selectedProblem?.sample_output) {
                const cleanActual = normalizeOutput(stdout);
                const cleanExpected = normalizeOutput(selectedProblem.sample_output);
                if (cleanActual !== cleanExpected) {
                    waDetected = true;
                }
            }

            setIsWrongAnswer(waDetected);

            // Save submission to database
            if (roleData?.id && selectedProblem && selectedProblem.id !== null && !String(selectedProblem.id).startsWith('lc-')) {
                await insforge.database.from('coding_submissions').insert({
                    student_id: roleData.id,
                    problem_id: selectedProblem.id,
                    code,
                    language,
                    output: finalOutput.substring(0, 500),
                    status: waDetected ? 'failed' : 'completed',
                });
            }

            if (!compileOutput && !stderr && !waDetected) {
                finalOutput = `🏆 Submission Accepted!\n\nAll test cases passed successfully.\n\nOutput:\n${stdout}`;
                await handleSolvedToggle(true);
                showToast("Congratulations! Solution accepted.", "success");
                setShowCelebrationModal(true);
            } else if (waDetected) {
                finalOutput = `❌ Wrong Answer\n\nInput:\n${selectedProblem?.sample_input}\n\nExpected Output:\n${selectedProblem?.sample_output}\n\nYour Output:\n${stdout}`;
            }

            setOutput(finalOutput.trim());

            const decodedData = {
                ...data,
                stdout,
                stderr,
                compile_output: compileOutput
            };
            setLastExecutionData(decodedData);

        } catch (err: any) {
            setOutput(`Error: ${err.message || 'Something went wrong'}`);
        } finally {
            setRunning(false);
        }
    };

    const getNextProblem = () => {
        if (!selectedProblem || !problems || problems.length === 0) return null;
        const currentIndex = problems.findIndex(p => String(p.id) === String(selectedProblem.id));
        if (currentIndex === -1 || currentIndex === problems.length - 1) return null;
        return problems[currentIndex + 1];
    };

    const handleNextProblem = () => {
        const nextP = getNextProblem();
        if (nextP) {
            setSelectedProblem(nextP);
            setShowCelebrationModal(false);
            setBottomTab('testcase');
            setOutput('');
            setIsWrongAnswer(false);
            setLastExecutionData(null);
        }
    };

    const handleContinuePracticing = () => {
        setShowCelebrationModal(false);
    };

    const handleViewSolutionAnalysis = () => {
        setShowCelebrationModal(false);
        setBottomTab('ai');
        setAiMode('review');
        askGemini('review');
    };

    // Keyboard Shortcuts Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedProblem) {
                // Cmd/Ctrl + Enter -> Run Code, Cmd/Ctrl + Shift + Enter -> Submit
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    if (e.shiftKey) {
                        e.preventDefault();
                        submitCode();
                    } else {
                        e.preventDefault();
                        runCode();
                    }
                }
                // Escape -> exit fullscreen
                if (e.key === 'Escape' && isFullscreen) {
                    setIsFullscreen(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedProblem, code, language, isFullscreen]);

    // =====================================================
    // FEATURE: PROBLEM LIST STATUS HELPER
    // =====================================================
    const getStatusBadge = (pId: string) => {
        const prog = progressList.find(pr => pr.problem_id === pId);
        const status = prog ? prog.status : 'unsolved';

        if (status === 'solved') {
            return <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30">✅ Solved</Badge>;
        } else {
            return <Badge variant="outline" className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30">🔴 Unsolved</Badge>;
        }
    };

    const difficultyColor: Record<string, string> = {
        easy: 'text-emerald-500',
        medium: 'text-amber-500',
        hard: 'text-red-500',
    };

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(problems.length / QUESTIONS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * QUESTIONS_PER_PAGE;
    const paginatedProblems = problems.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);

    // Dashboard calculations
    const totalCount = problems.length;
    const solvedCount = problems.filter(p => {
        const prog = progressList.find(pr => pr.problem_id === p.id);
        return prog ? prog.status === 'solved' : false;
    }).length;
    const remainingCount = Math.max(0, totalCount - solvedCount);

    const difficultyBadgeStyles: Record<string, string> = {
        easy: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:scale-105 transition-all duration-300 rounded-full px-3 py-0.5 border text-xs font-semibold flex items-center gap-1.5 select-none",
        medium: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-sm hover:bg-amber-100 dark:hover:bg-amber-500/20 hover:scale-105 transition-all duration-300 rounded-full px-3 py-0.5 border text-xs font-semibold flex items-center gap-1.5 select-none",
        hard: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 shadow-sm hover:bg-red-100 dark:hover:bg-red-500/20 hover:scale-105 transition-all duration-300 rounded-full px-3 py-0.5 border text-xs font-semibold flex items-center gap-1.5 select-none",
    };


    return (
        <div className={cn("space-y-4 animate-fade-in flex flex-col", selectedProblem ? "h-full w-full overflow-hidden" : "space-y-6")}>
            {!selectedProblem && (
                <div>
                    <h1 className="text-3xl font-heading font-bold">Code Simulator</h1>
                    <p className="text-muted-foreground mt-1">Practice coding problems with an integrated editor</p>
                </div>
            )}

            {!selectedProblem ? (
                <>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3].map(i => <Card key={i} className="h-28 animate-pulse bg-muted/50" />)}
                        </div>
                    ) : problems.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Code2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                <p>No problems available yet</p>
                                <p className="text-sm text-muted-foreground mt-1">You can still use the editor below for free-coding</p>
                                <Button className="mt-4" onClick={() => {
                                    lastRestoredProblemIdRef.current = null;
                                    setSelectedProblem({ id: null, title: 'Free Coding', description: 'Write any code you want!', difficulty: 'easy' });
                                }}>
                                    <Code2 className="w-4 h-4 mr-2" />Open Free Editor
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {/* Dashboard Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Card className="border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.05)] hover:shadow-md transition-all duration-300">
                                    <CardContent className="p-5 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Questions</p>
                                            <h3 className="text-3xl font-bold font-heading text-foreground mt-1">{totalCount}</h3>
                                        </div>
                                        <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                                            <Code2 className="w-6 h-6" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-md transition-all duration-300">
                                    <CardContent className="p-5 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Solved</p>
                                            <h3 className="text-3xl font-bold font-heading text-foreground mt-1">{solvedCount}</h3>
                                        </div>
                                        <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="border-red-500/20 bg-red-500/5 dark:bg-red-500/10 shadow-sm dark:shadow-[0_0_15px_rgba(239,68,68,0.05)] hover:shadow-md transition-all duration-300">
                                    <CardContent className="p-5 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Remaining</p>
                                            <h3 className="text-3xl font-bold font-heading text-foreground mt-1">{remainingCount}</h3>
                                        </div>
                                        <div className="p-3 bg-red-500/10 dark:bg-red-500/20 rounded-xl text-red-600 dark:text-red-400">
                                            <RotateCcw className="w-6 h-6" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Questions Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-stagger">
                                {paginatedProblems.map(p => (
                                    <Card
                                        key={p.id}
                                        className="card-hover cursor-pointer shadow-sm dark:shadow-[0_0_15px_rgba(255,255,255,0.01)] hover:shadow-md hover:scale-[1.01] transition-all duration-300 border border-border hover:border-primary/30 bg-card hover:bg-accent/30"
                                        onClick={() => {
                                            lastRestoredProblemIdRef.current = null;
                                            setSelectedProblem(p);
                                            const prog = progressList.find(pr => pr.problem_id === p.id);
                                            if (prog && prog.last_code) {
                                                setCode(prog.last_code);
                                                if (prog.last_language) setLanguage(prog.last_language);
                                            } else {
                                                setCode(p.starter_code?.[language] || STARTER_COMMENTS[language]);
                                            }
                                        }}
                                    >
                                        <CardContent className="p-5">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-heading font-semibold">{p.title}</h3>
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(p.id)}
                                                    <span className={difficultyBadgeStyles[p.difficulty] || ""}>
                                                        {p.difficulty === 'easy' && '🟢'}
                                                        {p.difficulty === 'medium' && '🟡'}
                                                        {p.difficulty === 'hard' && '🔴'}
                                                        <span className="capitalize ml-1">{p.difficulty}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                                            <div className="flex items-center justify-between mt-3">
                                                {(() => {
                                                    const prog = progressList.find(pr => pr.problem_id === p.id);
                                                    const hasNotes = prog && checkHasNotes(prog.notes);
                                                    return (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedProblem(p);
                                                                const notesVal = prog ? (prog.notes || '') : '';
                                                                setNotes(notesVal);

                                                                // Load notebook fields
                                                                let approachVal = '';
                                                                let mistakesVal = '';
                                                                let complexityVal = '';
                                                                try {
                                                                    if (notesVal.startsWith('{') && notesVal.endsWith('}')) {
                                                                        const parsed = JSON.parse(notesVal);
                                                                        approachVal = parsed.approach || '';
                                                                        mistakesVal = parsed.mistakes || '';
                                                                        complexityVal = parsed.complexity || '';
                                                                    } else {
                                                                        approachVal = notesVal || '';
                                                                    }
                                                                } catch (err) {
                                                                    approachVal = notesVal || '';
                                                                }
                                                                setModalApproach(approachVal);
                                                                setModalMistakes(mistakesVal);
                                                                setModalComplexity(complexityVal);
                                                                originalNotesRef.current = notesVal;
                                                                setAutosaveStatus('Saved');
                                                                setShowNotesModal(true);
                                                            }}
                                                            className="rounded-full px-3 py-1 text-xs font-medium border bg-card text-foreground hover:bg-accent transition-all cursor-pointer select-none flex items-center gap-1.5 border-muted-foreground/20"
                                                        >
                                                            {hasNotes ? (
                                                                <><span>📝</span><span>View Notes</span></>
                                                            ) : (
                                                                <><span>✏️</span><span>Add Note</span></>
                                                            )}
                                                        </button>
                                                    );
                                                })()}
                                                <ChevronRight className="w-4 h-4 ml-auto text-primary" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between border-t border-border pt-6 mt-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="rounded-full px-5 py-2 border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer select-none"
                                    >
                                        ← Previous
                                    </Button>
                                    <span className="text-sm text-muted-foreground font-medium font-sans">
                                        Page <span className="text-primary font-bold text-base px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20">{currentPage}</span> of <span className="text-foreground font-semibold">{totalPages}</span>
                                    </span>
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="rounded-full px-5 py-2 border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer select-none"
                                    >
                                        Next →
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="h-full flex flex-col gap-3 -mt-2 overflow-hidden">
                    {/* Top sub-header for problem summary & toolbar controls if not in fullscreen */}
                    {!isFullscreen && (
                        <div className="flex items-center justify-between pb-1 border-b border-border/40">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedProblem(null)}
                                    className="h-8 hover:bg-accent/10 px-2 flex items-center gap-1"
                                >
                                    ← Problems
                                </Button>
                                <div className="h-4 w-px bg-border/60" />
                                <span className="font-heading font-semibold text-lg">{selectedProblem.title}</span>
                                <span className={difficultyBadgeStyles[selectedProblem.difficulty] || ''}>
                                    {selectedProblem.difficulty === 'easy' && '🟢'}
                                    {selectedProblem.difficulty === 'medium' && '🟡'}
                                    {selectedProblem.difficulty === 'hard' && '🔴'}
                                    <span className="capitalize ml-1">{selectedProblem.difficulty}</span>
                                </span>
                            </div>
                        </div>
                    )}

                    {isFullscreen ? (
                        /* Fullscreen Editor Mode */
                        <Card className="flex-1 flex flex-col overflow-hidden border border-primary/20 shadow-md">
                            {/* Editor Toolbar */}
                            <div className="py-2 px-4 border-b flex-shrink-0 bg-muted/30 flex items-center justify-between gap-3 h-12">
                                <div className="flex items-center gap-2">
                                    <Code2 className="w-4 h-4 text-muted-foreground" />
                                    <Select value={language} onValueChange={handleLanguageChange}>
                                        <SelectTrigger className="w-[140px] h-8 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="javascript">JavaScript</SelectItem>
                                            <SelectItem value="python">Python</SelectItem>
                                            <SelectItem value="java">Java</SelectItem>
                                            <SelectItem value="cpp">C++</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCode(selectedProblem?.starter_code?.[language] || STARTER_COMMENTS[language])}
                                        className="h-8 hover:bg-accent/10"
                                        title="Reset code to starter comments"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                        Reset
                                    </Button>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    {/* Mark Solved */}
                                    <div className="flex items-center gap-2 border rounded px-3 py-1 bg-muted/30 h-8">
                                        <input
                                            id="mark-solved-chk-fs"
                                            type="checkbox"
                                            checked={isSolved}
                                            onChange={e => handleSolvedToggle(e.target.checked)}
                                            className="w-4 h-4 rounded border-muted-foreground/30 text-primary focus:ring-primary cursor-pointer"
                                        />
                                        <label htmlFor="mark-solved-chk-fs" className="text-xs font-medium cursor-pointer select-none">
                                            Mark Solved
                                        </label>
                                    </div>

                                    {/* Autosave Status */}
                                    {codeAutosaveStatus && (
                                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            {codeAutosaveStatus === 'Saving...' ? (
                                                <>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    Autosaved
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Minimize Fullscreen */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsFullscreen(false)}
                                        className="h-8 hover:bg-accent/10 px-2.5"
                                        title="Exit Fullscreen Editor"
                                    >
                                        <Minimize2 className="w-4 h-4" />
                                    </Button>
                                    
                                    <div className="h-4 w-px bg-border/60" />

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={runCode}
                                        disabled={running}
                                        className="h-8 border-primary/20 hover:border-primary text-primary"
                                    >
                                        {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                                        Run
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={submitCode}
                                        disabled={running}
                                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
                                    >
                                        Submit
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Fullscreen Editor Wrapper */}
                            <div className="flex-1 overflow-hidden">
                                <CodeMirrorEditor
                                    value={code}
                                    onChange={setCode}
                                    language={language}
                                    theme={resolvedTheme}
                                />
                            </div>
                        </Card>
                    ) : (
                        /* Resizable Split Layout Mode */
                        <PanelGroup orientation="horizontal" className="flex-1 flex gap-2 overflow-hidden">
                            {/* Left Panel: Problem Information & Revision Notebook */}
                            <Panel defaultSize={40} minSize={25} maxSize={70} className="flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm">
                                <Tabs value={leftTab} onValueChange={setLeftTab} className="flex flex-col h-full w-full overflow-hidden">
                                    <TabsList className="flex-shrink-0 w-full justify-start border-b rounded-none bg-muted/40 px-3 h-11 gap-1">
                                        <TabsTrigger value="description" className="px-3 h-8 text-xs font-semibold data-[state=active]:bg-background">
                                            📖 Description
                                        </TabsTrigger>
                                        <TabsTrigger value="notes" className="px-3 h-8 text-xs font-semibold data-[state=active]:bg-background">
                                            📝 Notes
                                        </TabsTrigger>
                                        {ENABLE_AI_ASSISTANT && (
                                            <>
                                                <TabsTrigger value="hints" className="px-3 h-8 text-xs font-semibold data-[state=active]:bg-background">
                                                    💡 Hints
                                                </TabsTrigger>
                                                <TabsTrigger value="editorial" className="px-3 h-8 text-xs font-semibold data-[state=active]:bg-background">
                                                    🧠 Editorial
                                                </TabsTrigger>
                                            </>
                                        )}
                                    </TabsList>
                                    
                                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin space-y-4">
                                        <TabsContent value="description" className="m-0 space-y-4">
                                            <p className="text-sm border-l-4 border-primary pl-4 py-1 italic whitespace-pre-wrap leading-relaxed">{selectedProblem.description}</p>
                                            
                                            <div className="space-y-3 pt-2">
                                                <div>
                                                    <h4 className="font-semibold text-xs text-primary mb-1 uppercase tracking-wider">Sample Input</h4>
                                                    <pre className="bg-muted p-3 rounded-md text-sm font-mono text-muted-foreground whitespace-pre">{selectedProblem.sample_input || '// No sample input provided.\n// Assume default inputs for testing.'}</pre>
                                                </div>

                                                <div>
                                                    <h4 className="font-semibold text-xs text-primary mb-1 uppercase tracking-wider">Expected Output</h4>
                                                    <pre className="bg-muted p-3 rounded-md text-sm font-mono text-muted-foreground whitespace-pre">{selectedProblem.sample_output || '// Output will depend on implementation logic.'}</pre>
                                                </div>

                                                <div>
                                                    <h4 className="font-semibold text-xs text-primary mb-1 uppercase tracking-wider">Constraints</h4>
                                                    <p className="text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-md leading-relaxed">{selectedProblem.constraints || '• Optimize for O(N) time complexity if possible.\n• Handle edge cases safely.'}</p>
                                                </div>
                                            </div>
                                        </TabsContent>
                                        
                                        <TabsContent value="notes" className="m-0 space-y-4">
                                            <div className="flex items-center justify-between border-b pb-2">
                                                <h3 className="font-heading font-bold text-sm">Revision Notebook</h3>
                                                {autosaveStatus && (
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-sans">
                                                        {autosaveStatus === 'Saving...' ? (
                                                            <>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                                Saving notes...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                Saved to DB
                                                            </>
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-4 pt-1">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Approach</label>
                                                    <Textarea
                                                        value={modalApproach}
                                                        onChange={e => setModalApproach(e.target.value)}
                                                        placeholder="Explain your approach, algorithm, design, data structures used..."
                                                        className="min-h-[100px] text-sm resize-y"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mistakes & Learnings</label>
                                                    <Textarea
                                                        value={modalMistakes}
                                                        onChange={e => setModalMistakes(e.target.value)}
                                                        placeholder="Document any bugs found, syntax mistakes, edge cases missed..."
                                                        className="min-h-[80px] text-sm resize-y"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Complexity</label>
                                                    <input
                                                        type="text"
                                                        value={modalComplexity}
                                                        onChange={e => setModalComplexity(e.target.value)}
                                                        placeholder="e.g. Time: O(N log N), Space: O(N)"
                                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                    />
                                                </div>
                                            </div>
                                        </TabsContent>
                                        
                                        {ENABLE_AI_ASSISTANT && (
                                            <>
                                                <TabsContent value="hints" className="m-0 space-y-4">
                                                    <div className="flex items-center justify-between border-b pb-2">
                                                        <h3 className="font-heading font-bold text-sm">Problem Hints</h3>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs"
                                                            onClick={() => askGemini('hint')}
                                                            disabled={aiLoading}
                                                        >
                                                            🤖 Generate AI Hint
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-3 pt-2">
                                                        {aiLoading && aiMode === 'hint' ? (
                                                            <div className="flex flex-col items-center justify-center py-8 space-y-2 text-muted-foreground text-sm">
                                                                <Sparkles className="w-6 h-6 animate-spin text-primary" />
                                                                <p className="text-xs">Consulting interviewer...</p>
                                                            </div>
                                                        ) : aiResponse && aiMode === 'hint' ? (
                                                            renderAiResponse(aiResponse)
                                                        ) : (
                                                            <div className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg italic text-center">
                                                                Need a push? Click the button above to generate a dynamic hint based on your current code.
                                                            </div>
                                                        )}
                                                    </div>
                                                </TabsContent>
                                                
                                                <TabsContent value="editorial" className="m-0 space-y-4">
                                                    <div className="flex items-center justify-between border-b pb-2">
                                                        <h3 className="font-heading font-bold text-sm">Editorial & Explanation</h3>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs"
                                                            onClick={() => askGemini('approach')}
                                                            disabled={aiLoading}
                                                        >
                                                            🤖 Generate AI Editorial
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-3 pt-2">
                                                        {aiLoading && aiMode === 'approach' ? (
                                                            <div className="flex flex-col items-center justify-center py-8 space-y-2 text-muted-foreground text-sm">
                                                                <Sparkles className="w-6 h-6 animate-spin text-primary" />
                                                                <p className="text-xs">Synthesizing detailed solution guide...</p>
                                                            </div>
                                                        ) : aiResponse && aiMode === 'approach' ? (
                                                            renderAiResponse(aiResponse)
                                                        ) : (
                                                            <div className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg italic text-center">
                                                                Click the button above to request a full algorithmic walkthrough and code strategy.
                                                            </div>
                                                        )}
                                                    </div>
                                                </TabsContent>
                                            </>
                                        )}
                                    </div>
                                </Tabs>
                            </Panel>

                            {/* Panel Draggable Divider */}
                            <PanelResizeHandle className="w-1.5 hover:w-2 bg-muted-foreground/15 hover:bg-primary/50 transition-all cursor-col-resize rounded-full mx-0.5" />

                            {/* Right Panel: Code Editor and Console Outputs */}
                            <Panel defaultSize={60} minSize={30} maxSize={75} className="flex flex-col gap-2 overflow-hidden">
                                <PanelGroup orientation="vertical" className="flex-1 flex gap-2 overflow-hidden">
                                    
                                    {/* Editor Sub-panel */}
                                    <Panel defaultSize={65} minSize={30} className="flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm">
                                        <div className="py-2 px-4 border-b flex-shrink-0 bg-muted/30 flex items-center justify-between gap-3 h-12">
                                            <div className="flex items-center gap-2">
                                                <Code2 className="w-4 h-4 text-muted-foreground" />
                                                <Select value={language} onValueChange={handleLanguageChange}>
                                                    <SelectTrigger className="w-[130px] h-8 text-xs font-semibold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="javascript">JavaScript</SelectItem>
                                                        <SelectItem value="python">Python</SelectItem>
                                                        <SelectItem value="java">Java</SelectItem>
                                                        <SelectItem value="cpp">C++</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCode(selectedProblem?.starter_code?.[language] || STARTER_COMMENTS[language])}
                                                    className="h-8 hover:bg-accent/10 px-2.5"
                                                    title="Reset code"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                                    Reset
                                                </Button>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* Mark Solved */}
                                                <div className="flex items-center gap-2 border rounded px-3 py-1 bg-muted/30 h-8">
                                                    <input
                                                        id="mark-solved-chk-split"
                                                        type="checkbox"
                                                        checked={isSolved}
                                                        onChange={e => handleSolvedToggle(e.target.checked)}
                                                        className="w-3.5 h-3.5 rounded border-muted-foreground/30 text-primary focus:ring-primary cursor-pointer"
                                                    />
                                                    <label htmlFor="mark-solved-chk-split" className="text-xs font-medium cursor-pointer select-none">
                                                        Mark Solved
                                                    </label>
                                                </div>

                                                {/* Autosave Status */}
                                                {codeAutosaveStatus && (
                                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-sans">
                                                        {codeAutosaveStatus === 'Saving...' ? (
                                                            <>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                                Saving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                Saved
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Maximize Fullscreen */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsFullscreen(true)}
                                                    className="h-8 hover:bg-accent/10 px-2.5"
                                                    title="Fullscreen Editor Mode"
                                                >
                                                    <Maximize2 className="w-4 h-4" />
                                                </Button>
                                                
                                                <div className="h-4 w-px bg-border/60" />

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={runCode}
                                                    disabled={running}
                                                    className="h-8 border-primary/20 hover:border-primary text-primary"
                                                >
                                                    {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                                                    Run
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={submitCode}
                                                    disabled={running}
                                                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
                                                >
                                                    Submit
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Editor Content Area */}
                                        <div className="flex-1 overflow-hidden">
                                            <CodeMirrorEditor
                                                value={code}
                                                onChange={setCode}
                                                language={language}
                                                theme={resolvedTheme}
                                            />
                                        </div>
                                    </Panel>

                                    {/* Editor Vertical Divider Handle */}
                                    <PanelResizeHandle className="h-1.5 hover:h-2 bg-muted-foreground/15 hover:bg-primary/50 transition-all cursor-row-resize rounded-full my-0.5" />

                                    {/* Console / Output Tabs Sub-panel */}
                                    <Panel defaultSize={35} minSize={20} className="flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm">
                                        <Tabs value={bottomTab} onValueChange={setBottomTab} className="flex flex-col h-full w-full overflow-hidden bg-card">
                                            <TabsList className="flex-shrink-0 w-full justify-start border-b rounded-none bg-muted/20 px-3 h-10 gap-1">
                                                <TabsTrigger value="testcase" className="px-3 h-8 text-xs font-semibold data-[state=active]:bg-background">
                                                    📋 Testcase Input
                                                </TabsTrigger>
                                                <TabsTrigger value="result" className="px-3 h-8 text-xs font-semibold data-[state=active]:bg-background">
                                                    💻 Result Console
                                                </TabsTrigger>
                                                {ENABLE_AI_ASSISTANT && (
                                                    <TabsTrigger value="ai" className="px-3 h-8 text-xs font-semibold data-[state=active]:bg-background">
                                                        🤖 AI Assistant
                                                    </TabsTrigger>
                                                )}
                                            </TabsList>
                                            
                                            <div className="flex-1 overflow-hidden relative">
                                                <TabsContent value="testcase" className="m-0 p-4 h-full overflow-y-auto space-y-3">
                                                    <div>
                                                        <h4 className="font-semibold text-xs text-primary mb-1 uppercase tracking-wider">Sample Input</h4>
                                                        <pre className="bg-muted p-3 rounded-md text-sm font-mono text-muted-foreground whitespace-pre">{selectedProblem?.sample_input || '// No sample input provided.'}</pre>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-xs text-primary mb-1 uppercase tracking-wider">Expected Output</h4>
                                                        <pre className="bg-muted p-3 rounded-md text-sm font-mono text-muted-foreground whitespace-pre">{selectedProblem?.sample_output || '// Output will depend on implementation logic.'}</pre>
                                                    </div>
                                                </TabsContent>
                                                
                                                <TabsContent value="result" className="m-0 p-0 h-full flex flex-col overflow-hidden bg-slate-900 text-slate-100">
                                                    {getExecutionStatusBadge()}
                                                    
                                                    <pre className="flex-1 p-4 overflow-auto text-xs font-mono whitespace-pre-wrap leading-relaxed">
                                                        {output || <span className="text-slate-500 italic">// Output will appear here after running or submitting code...</span>}
                                                    </pre>

                                                    {isWrongAnswer && (
                                                        <div className="flex items-center justify-between bg-red-500/10 text-red-400 border-t border-red-500/20 px-4 py-2 text-xs font-semibold">
                                                            <span className="flex items-center gap-1.5">
                                                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                                                Wrong Answer Detected
                                                            </span>
                                                            {ENABLE_AI_ASSISTANT && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 text-xs border-red-500/30 hover:border-red-500 text-red-400 hover:bg-red-500/10 py-1"
                                                                    onClick={() => {
                                                                        setAiMode('wrong_answer');
                                                                        askGemini('wrong_answer');
                                                                        setBottomTab('ai');
                                                                    }}
                                                                    disabled={aiLoading}
                                                                >
                                                                    🤖 Explain with AI
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {(lastExecutionData?.compile_output || lastExecutionData?.stderr) && (
                                                        <div className="flex items-center justify-between bg-amber-500/10 text-amber-400 border-t border-amber-500/20 px-4 py-2 text-xs font-semibold">
                                                            <span className="flex items-center gap-1.5">
                                                                <Info className="w-4 h-4 text-amber-400" />
                                                                AI Analysis Available
                                                            </span>
                                                            {ENABLE_AI_ASSISTANT && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 text-xs border-amber-500/30 hover:border-amber-500 text-amber-400 hover:bg-amber-500/10 py-1"
                                                                    onClick={() => {
                                                                        setAiMode('error');
                                                                        askGemini('error');
                                                                        setBottomTab('ai');
                                                                    }}
                                                                    disabled={aiLoading}
                                                                >
                                                                    🤖 Analyze Error
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {ENABLE_AI_ASSISTANT && (
                                                        <TabsContent value="ai" className="m-0 p-4 h-full flex flex-col overflow-hidden bg-card">
                                                            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-2 flex-shrink-0">
                                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">🤖 AI Coding Helper</span>
                                                                <div className="flex flex-wrap gap-1">
                                                                    <Button
                                                                        variant={aiMode === 'hint' ? 'default' : 'outline'}
                                                                        className="h-7 text-xs px-2.5 py-1"
                                                                        onClick={() => { setAiMode('hint'); askGemini('hint'); }}
                                                                        disabled={aiLoading}
                                                                    >
                                                                        💡 Hint
                                                                    </Button>
                                                                    <Button
                                                                        variant={aiMode === 'optimize' ? 'default' : 'outline'}
                                                                        className="h-7 text-xs px-2.5 py-1"
                                                                        onClick={() => { setAiMode('optimize'); askGemini('optimize'); }}
                                                                        disabled={aiLoading}
                                                                    >
                                                                        ⚡ Optimize
                                                                    </Button>
                                                                    <Button
                                                                        variant={aiMode === 'review' ? 'default' : 'outline'}
                                                                        className="h-7 text-xs px-2.5 py-1"
                                                                        onClick={() => { setAiMode('review'); askGemini('review'); }}
                                                                        disabled={aiLoading}
                                                                    >
                                                                        🔍 Review
                                                                    </Button>
                                                                    <Button
                                                                        variant={aiMode === 'approach' ? 'default' : 'outline'}
                                                                        className="h-7 text-xs px-2.5 py-1"
                                                                        onClick={() => { setAiMode('approach'); askGemini('approach'); }}
                                                                        disabled={aiLoading}
                                                                    >
                                                                        🎓 Approach
                                                                    </Button>
                                                                    <Button
                                                                        variant={aiMode === 'chat' ? 'default' : 'outline'}
                                                                        className="h-7 text-xs px-2.5 py-1"
                                                                        onClick={() => { setAiMode('chat'); }}
                                                                        disabled={aiLoading}
                                                                    >
                                                                        💬 Chat
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        className="h-7 text-xs px-2.5 py-1 hover:bg-primary/10 border-primary/20"
                                                                        onClick={() => { setShowAiDialog(true); }}
                                                                    >
                                                                        Maximize ↗
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 overflow-hidden min-h-0 relative flex flex-col">
                                                                {aiMode === 'chat' ? (
                                                                    <div className="flex flex-col h-full space-y-3 justify-end">
                                                                        <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-muted/5 rounded-lg border border-border/40 scrollbar-thin">
                                                                            {chatHistory.length === 0 ? (
                                                                                <div className="text-center text-xs text-muted-foreground italic py-8">
                                                                                    Ask me anything about this coding problem or your solution!
                                                                                </div>
                                                                            ) : (
                                                                                chatHistory.map((msg, idx) => (
                                                                                    <div key={idx} className={cn(
                                                                                        "flex flex-col max-w-[85%] rounded-lg p-2.5 text-xs leading-relaxed",
                                                                                        msg.sender === 'user'
                                                                                            ? "bg-primary text-primary-foreground ml-auto rounded-tr-none"
                                                                                            : "bg-muted text-foreground border mr-auto rounded-tl-none whitespace-pre-wrap font-sans"
                                                                                    )}>
                                                                                        <span className="font-bold mb-1 block opacity-75">
                                                                                            {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                                                                                        </span>
                                                                                        {msg.sender === 'user' ? msg.text : renderAiResponse(msg.text)}
                                                                                    </div>
                                                                                ))
                                                                            )}
                                                                            {aiLoading && (
                                                                                <div className="bg-muted text-foreground border mr-auto rounded-lg rounded-tl-none p-2.5 text-xs max-w-[85%] flex items-center gap-1.5">
                                                                                    <Sparkles className="w-3.5 h-3.5 animate-spin text-primary" />
                                                                                    <span className="animate-pulse">Thinking...</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        
                                                                        <div className="flex gap-2 flex-shrink-0">
                                                                            <input
                                                                                type="text"
                                                                                value={chatInput}
                                                                                onChange={(e) => setChatInput(e.target.value)}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter' && chatInput.trim() && !aiLoading) {
                                                                                        askGemini('chat', chatInput);
                                                                                        setChatInput('');
                                                                                    }
                                                                                }}
                                                                                placeholder="Ask a question about the code..."
                                                                                disabled={aiLoading}
                                                                                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                                            />
                                                                            <Button
                                                                                size="sm"
                                                                                disabled={!chatInput.trim() || aiLoading}
                                                                                onClick={() => {
                                                                                    askGemini('chat', chatInput);
                                                                                    setChatInput('');
                                                                                }}
                                                                                className="h-9 px-3"
                                                                            >
                                                                                Send
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex-1 overflow-y-auto border border-border/80 rounded-lg p-4 bg-muted/10">
                                                                        {aiLoading ? (
                                                                            <div className="flex flex-col items-center justify-center py-6 space-y-2 text-muted-foreground text-sm">
                                                                                <Sparkles className="w-6 h-6 animate-spin text-primary" />
                                                                                <p className="text-xs">Analyzing code and generating response...</p>
                                                                            </div>
                                                                        ) : aiResponse ? (
                                                                            renderAiResponse(aiResponse)
                                                                        ) : (
                                                                            <p className="text-xs text-muted-foreground italic text-center py-4">
                                                                                No recent AI interactions. Select actions or analyze results to get feedback.
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TabsContent>
                                                    )}
                                                </TabsContent>
                                            </div>
                                        </Tabs>
                                    </Panel>
                                </PanelGroup>
                            </Panel>
                        </PanelGroup>
                    )}
                </div>
            )}

            {/* =====================================================
                FEATURE: AI ASSISTANT MODAL
                ===================================================== */}
            {ENABLE_AI_ASSISTANT && (
                <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl font-bold font-heading">
                                <Brain className="w-5 h-5 text-primary" />
                                AI Coding Assistant
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 my-2">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-shrink-0">
                                <Button
                                    variant={aiMode === 'hint' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => { setAiMode('hint'); askGemini('hint'); }}
                                    disabled={aiLoading}
                                >
                                    Hint
                                </Button>
                                <Button
                                    variant={aiMode === 'approach' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => { setAiMode('approach'); askGemini('approach'); }}
                                    disabled={aiLoading}
                                >
                                    Explain Approach
                                </Button>
                                <Button
                                    variant={aiMode === 'optimize' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => { setAiMode('optimize'); askGemini('optimize'); }}
                                    disabled={aiLoading}
                                >
                                    Optimize Code
                                </Button>
                                <Button
                                    variant={aiMode === 'review' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => { setAiMode('review'); askGemini('review'); }}
                                    disabled={aiLoading}
                                >
                                    Code Review
                                </Button>
                                <Button
                                    variant={aiMode === 'chat' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => { setAiMode('chat'); }}
                                    disabled={aiLoading}
                                >
                                    Chat Assistant
                                </Button>
                                <Button
                                    variant={aiMode === 'solution' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => { setAiMode('solution'); askGemini('solution'); }}
                                    disabled={aiLoading}
                                    className="bg-red-500 hover:bg-red-600 text-white border-none"
                                >
                                    Reveal Solution
                                </Button>
                            </div>

                            <div className="border rounded-lg bg-muted/40 p-4 min-h-[220px] overflow-hidden flex flex-col">
                                {aiMode === 'chat' ? (
                                    <div className="flex flex-col h-full space-y-3 justify-end">
                                        <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-muted/5 rounded-lg border border-border/40 max-h-[350px] scrollbar-thin">
                                            {chatHistory.length === 0 ? (
                                                <div className="text-center text-xs text-muted-foreground italic py-12">
                                                    Ask me anything about this coding problem or your solution!
                                                </div>
                                            ) : (
                                                chatHistory.map((msg, idx) => (
                                                    <div key={idx} className={cn(
                                                        "flex flex-col max-w-[85%] rounded-lg p-2.5 text-xs leading-relaxed",
                                                        msg.sender === 'user'
                                                            ? "bg-primary text-primary-foreground ml-auto rounded-tr-none"
                                                            : "bg-muted text-foreground border mr-auto rounded-tl-none whitespace-pre-wrap font-sans"
                                                    )}>
                                                        <span className="font-bold mb-1 block opacity-75">
                                                            {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                                                        </span>
                                                        {msg.sender === 'user' ? msg.text : renderAiResponse(msg.text)}
                                                    </div>
                                                ))
                                            )}
                                            {aiLoading && (
                                                <div className="bg-muted text-foreground border mr-auto rounded-lg rounded-tl-none p-2.5 text-xs max-w-[85%] flex items-center gap-1.5">
                                                    <Sparkles className="w-3.5 h-3.5 animate-spin text-primary" />
                                                    <span className="animate-pulse">Thinking...</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex gap-2 flex-shrink-0">
                                            <input
                                                type="text"
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && chatInput.trim() && !aiLoading) {
                                                        askGemini('chat', chatInput);
                                                        setChatInput('');
                                                    }
                                                }}
                                                placeholder="Ask a question about the code..."
                                                disabled={aiLoading}
                                                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors"
                                            />
                                            <Button
                                                size="sm"
                                                disabled={!chatInput.trim() || aiLoading}
                                                onClick={() => {
                                                    askGemini('chat', chatInput);
                                                    setChatInput('');
                                                }}
                                                className="h-9 px-3"
                                            >
                                                Send
                                            </Button>
                                        </div>
                                    </div>
                                ) : aiLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-2 text-muted-foreground text-sm">
                                        <Sparkles className="w-8 h-8 animate-spin text-primary" />
                                        <p>Generating response from Gemini...</p>
                                    </div>
                                ) : aiResponse ? (
                                    <div className="max-h-[450px] overflow-y-auto pr-1 scrollbar-thin">
                                        {renderAiResponse(aiResponse)}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic text-center py-12">Select an option above to generate AI help.</p>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* =====================================================
                FEATURE: NOTES MODAL
                ===================================================== */}
            <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
                <DialogContent className="max-w-2xl bg-background border border-border text-foreground shadow-2xl rounded-xl">
                    <DialogHeader className="border-b border-border/80 pb-4">
                        <div className="flex items-start justify-between gap-4 w-full">
                            <div className="space-y-1">
                                <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">Interview Prep Notebook</span>
                                <DialogTitle className="text-2xl font-bold font-heading flex items-center gap-2 mt-1">
                                    {selectedProblem?.title}
                                </DialogTitle>
                            </div>
                            <div className="flex-shrink-0 pt-1">
                                {selectedProblem && getStatusBadge(selectedProblem.id)}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-1 border-t border-border/40">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "w-2 h-2 rounded-full inline-block",
                                    autosaveStatus === 'Saving...' ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                                )} />
                                <span className="text-xs text-muted-foreground font-mono font-medium">
                                    {autosaveStatus === 'Saving...' ? 'Saving...' : 'Autosaved'}
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                                Last Updated: {(() => {
                                    const prog = progressList.find(p => p.problem_id === selectedProblem?.id);
                                    return prog?.updated_at ? new Date(prog.updated_at).toLocaleTimeString() : 'Never';
                                })()}
                            </span>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 my-2">
                        {/* Section 1: Approach */}
                        <div className="bg-muted/30 dark:bg-zinc-900/40 border border-border border-l-4 border-l-primary rounded-lg p-4 space-y-2 focus-within:border-primary/40 focus-within:bg-muted/60 dark:focus-within:bg-zinc-900/60 transition-all shadow-sm">
                            <label className="text-xs font-bold text-primary flex items-center gap-1.5 select-none uppercase tracking-wider">
                                <Brain className="w-4 h-4 text-primary/80" />
                                Strategy & Optimal Approach
                            </label>
                            <Textarea
                                value={modalApproach}
                                onChange={e => setModalApproach(e.target.value)}
                                placeholder="Explain your strategy, core data structures, algorithms, and key edge cases..."
                                className="text-sm border-none bg-transparent resize-none w-full outline-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[96px] p-0 text-foreground font-sans placeholder:text-muted-foreground/50 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_24px] leading-[24px]"
                            />
                        </div>

                        {/* Section 2: Mistakes Made */}
                        <div className="bg-muted/30 dark:bg-zinc-900/40 border border-border border-l-4 border-l-amber-500 rounded-lg p-4 space-y-2 focus-within:border-amber-500/40 focus-within:bg-muted/60 dark:focus-within:bg-zinc-900/60 transition-all shadow-sm">
                            <label className="text-xs font-bold text-amber-500 flex items-center gap-1.5 select-none uppercase tracking-wider">
                                <AlertTriangle className="w-4 h-4 text-amber-500/80" />
                                Mistakes Made & Key Gotchas
                            </label>
                            <Textarea
                                value={modalMistakes}
                                onChange={e => setModalMistakes(e.target.value)}
                                placeholder="What tripped you up? Off-by-one errors? Corner cases? Time limit exceeded? Write down notes for review."
                                className="text-sm border-none bg-transparent resize-none w-full outline-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[96px] p-0 text-foreground font-sans placeholder:text-muted-foreground/50 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_24px] leading-[24px]"
                            />
                        </div>

                        {/* Section 3: Complexity */}
                        <div className="bg-muted/30 dark:bg-zinc-900/40 border border-border border-l-4 border-l-emerald-500 rounded-lg p-4 space-y-2 focus-within:border-emerald-500/40 focus-within:bg-muted/60 dark:focus-within:bg-zinc-900/60 transition-all shadow-sm">
                            <label className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 select-none uppercase tracking-wider">
                                <Clock className="w-4 h-4 text-emerald-500/80" />
                                Time & Space Complexity
                            </label>
                            <Textarea
                                value={modalComplexity}
                                onChange={e => setModalComplexity(e.target.value)}
                                placeholder="e.g. Time Complexity: O(N) | Space Complexity: O(1)"
                                className="text-sm border-none bg-transparent resize-none w-full outline-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[48px] p-0 text-foreground font-mono placeholder:text-muted-foreground/50 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_24px] leading-[24px]"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={handleNotesCancel} className="h-9 border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                                Cancel
                            </Button>
                            <Button onClick={handleNotesSave} className="h-9 min-w-[100px] bg-primary hover:bg-primary/95 text-primary-foreground font-medium shadow-sm">
                                Done
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* =====================================================
                FEATURE: ACCEPTED SUBMISSION CELEBRATION MODAL
                ===================================================== */}
            <Dialog open={showCelebrationModal} onOpenChange={setShowCelebrationModal}>
                <DialogContent className="max-w-md w-full border border-emerald-500/20 bg-slate-950 text-white shadow-2xl rounded-2xl p-6 overflow-hidden backdrop-blur-xl animate-scale-in fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    {/* Confetti Particles Container */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                        {confetti.map((particle) => (
                            <div
                                key={particle.id}
                                className="animate-confetti-pop"
                                style={particle.style}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col items-center text-center space-y-5 relative z-10">
                        {/* Trophy / Icon container with success glow and bounce */}
                        <div className="relative flex items-center justify-center">
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl w-24 h-24 -translate-y-2 animate-pulse" />
                            {/* Success Pulse Ring */}
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30 animate-success-pulse">
                                <Trophy className="w-10 h-10 text-emerald-400 animate-trophy-bounce" />
                            </div>
                        </div>

                        {/* Title & Subtitle */}
                        <div className="space-y-1.5">
                            <h2 className="text-2xl font-extrabold tracking-tight font-heading text-emerald-400">
                                🎉 Problem Solved!
                            </h2>
                            <p className="text-xs text-zinc-400 font-medium">
                                Congratulations! Your solution passed all test cases.
                            </p>
                        </div>

                        {/* Motivational quote area */}
                        {motivationalMessage && (
                            <div className="bg-emerald-950/40 border border-emerald-500/20 px-4 py-2.5 rounded-full text-xs font-semibold text-emerald-300 shadow-inner flex items-center gap-1.5 animate-pulse">
                                <span>{motivationalMessage}</span>
                            </div>
                        )}

                        {/* Checkbox Items */}
                        <div className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-2 text-left">
                            <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-300">
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Accepted</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-300">
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>All Test Cases Passed</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-300">
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Ready for the next challenge</span>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="w-full grid grid-cols-2 gap-2 text-left text-xs bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-3.5">
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-medium block">Problem</span>
                                <span className="text-zinc-200 font-bold block truncate">{selectedProblem?.title || 'Untitled'}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-zinc-500 font-medium block">Difficulty</span>
                                <span className={cn(
                                    "font-bold block capitalize",
                                    selectedProblem?.difficulty === 'easy' && "text-emerald-400",
                                    selectedProblem?.difficulty === 'medium' && "text-amber-400",
                                    selectedProblem?.difficulty === 'hard' && "text-red-400"
                                )}>
                                    {selectedProblem?.difficulty || 'easy'}
                                </span>
                            </div>
                            <div className="space-y-1 mt-2">
                                <span className="text-zinc-500 font-medium block">Language</span>
                                <span className="text-zinc-200 font-bold block uppercase">{language === 'cpp' ? 'C++' : language}</span>
                            </div>
                            <div className="space-y-1 mt-2">
                                <span className="text-zinc-500 font-medium block">Status</span>
                                <span className="text-emerald-400 font-bold block flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5 shrink-0" /> Accepted
                                </span>
                            </div>
                        </div>

                        {/* Streak / Solved Tracker (Optional Streak Feature) */}
                        <div className="w-full flex items-center justify-between border-t border-zinc-800/60 pt-3 text-xs">
                            <div className="flex items-center gap-1.5 text-zinc-400">
                                <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                                <span>Daily Streak: <strong className="text-orange-400">1 Day</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-400">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                <span>Problems Solved: <strong className="text-yellow-400">{solvedCount}</strong></span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="w-full flex flex-col gap-2 pt-2">
                            {getNextProblem() ? (
                                <Button
                                    onClick={handleNextProblem}
                                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wide shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 group transition-all"
                                >
                                    Next Problem
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Button>
                            ) : (
                                <Button
                                    disabled
                                    className="w-full h-10 bg-zinc-800 text-zinc-500 font-bold tracking-wide cursor-not-allowed"
                                >
                                    All Conquered! 🏆
                                </Button>
                            )}

                            <div className="grid grid-cols-2 gap-2 w-full">
                                <Button
                                    variant="outline"
                                    onClick={handleContinuePracticing}
                                    className={cn("h-9 border-zinc-800 bg-transparent hover:bg-zinc-900 hover:text-white text-zinc-300 font-semibold text-xs transition-colors", !ENABLE_AI_ASSISTANT && "col-span-2")}
                                >
                                    Continue Practicing
                                </Button>
                                {ENABLE_AI_ASSISTANT && (
                                    <Button
                                        variant="outline"
                                        onClick={handleViewSolutionAnalysis}
                                        className="h-9 border-emerald-500/30 hover:border-emerald-500 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 hover:text-emerald-300 font-semibold text-xs transition-colors"
                                    >
                                        Solution Analysis
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Toasts overlay list container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto p-4 rounded-lg shadow-xl border flex items-center gap-3 transition-all duration-300 ${t.type === 'success'
                                ? 'bg-emerald-50 dark:bg-emerald-950/95 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                                : t.type === 'error'
                                    ? 'bg-rose-50 dark:bg-rose-950/95 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200'
                                    : 'bg-slate-50 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700/30 text-slate-800 dark:text-slate-200'
                            }`}
                    >
                        {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                        {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                        {t.type === 'info' && <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        <span className="text-xs font-semibold">{t.message}</span>
                        <button
                            type="button"
                            onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                            className="ml-auto text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors shrink-0 pl-2 cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
