"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Code, Play, Sparkles, Bug, RefreshCw, FileText, ChevronDown, Copy, Check, Wand2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

const languages = ["JavaScript", "TypeScript", "Python", "Java", "Go", "Rust", "C++", "Ruby", "PHP", "Swift"]

const actions = [
  { id: "analyze", label: "Analyze", icon: FileText, color: "text-blue-400" },
  { id: "generate", label: "Generate", icon: Sparkles, color: "text-purple-400" },
  { id: "review", label: "Review", icon: Code, color: "text-green-400" },
  { id: "explain", label: "Explain", icon: FileText, color: "text-yellow-400" },
  { id: "debug", label: "Debug", icon: Bug, color: "text-red-400" },
  { id: "refactor", label: "Refactor", icon: RefreshCw, color: "text-[#00d4ff]" },
]

const sampleResult = `## Analysis Results

**Code Quality Score: 87/100** ✅

### Issues Found:
1. **Performance** - Consider using memoization for expensive function calls
2. **Style** - Line 42 exceeds 80 character limit
3. **Type Safety** - Missing TypeScript return type annotations

### Suggestions:
\`\`\`typescript
// Consider this optimized approach:
const memoizedResult = useMemo(() => {
  return expensiveComputation(data);
}, [data]);
\`\`\`

### Metrics:
- Lines of Code: 156
- Functions: 12
- Complexity: Moderate
- Test Coverage: 78%`

export default function CodingPage() {
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("TypeScript")
  const [result, setResult] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const sampleCode = `function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Inefficient for large n - consider memoization
function fibonacciMemo(n: number, memo: Map<number, number> = new Map()): number {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n)!;
  const result = fibonacciMemo(n - 1, memo) + fibonacciMemo(n - 2, memo);
  memo.set(n, result);
  return result;
}`

  const handleAction = async (action: string) => {
    if (!code.trim()) return
    setActiveAction(action)
    setIsProcessing(true)
    setResult(null)
    await new Promise((r) => setTimeout(r, 2000))
    setResult(sampleResult)
    setIsProcessing(false)
  }

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const loadSample = () => {
    setCode(sampleCode)
    setResult(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Coding Assistant</h1>
          <p className="text-sm text-white/50">AI-powered code analysis, generation, and review</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadSample}>
            Load Sample
          </Button>
          <Badge variant="default" className="gap-1.5">
            <Code className="h-3 w-3" />
            {language}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-10 rounded-t-lg bg-[#1e1e1e] border border-white/10 border-b-0 flex items-center px-4">
              <span className="text-xs text-white/40 font-mono">code.{language.toLowerCase()}</span>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
            </div>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Paste your code here or start typing..."
              className="min-h-[400px] font-mono text-sm bg-[#1e1e1e] border border-white/10 rounded-lg pt-12 leading-relaxed"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={activeAction === action.id ? "glow" : "outline"}
                size="sm"
                onClick={() => handleAction(action.id)}
                disabled={!code.trim() || isProcessing}
                className="gap-1.5"
              >
                <action.icon className={`h-4 w-4 ${action.color}`} />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/70">Results</span>
            {result && (
              <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5">
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            )}
          </div>

          <div className="min-h-[400px] rounded-lg bg-[#1e1e1e] border border-white/10 p-4 overflow-y-auto">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="flex gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <motion.span
                      key={i}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      className="w-2 h-2 rounded-full bg-[#00d4ff]"
                    />
                  ))}
                </div>
                <p className="text-sm text-[#00d4ff]/60">Processing code...</p>
              </div>
            ) : result ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans">{result}</pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Code className="h-12 w-12 text-white/10 mb-3" />
                <p className="text-sm text-white/30">Select an action to analyze your code</p>
                <p className="text-xs text-white/20 mt-1">Results will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
