"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Plus, ArrowRight, Trash2, GripVertical } from "lucide-react"

interface Step {
  id: string
  type: "trigger" | "action"
  label: string
  config: Record<string, string>
}

function AutomationBuilder() {
  const [steps, setSteps] = React.useState<Step[]>([
    { id: "1", type: "trigger", label: "Schedule", config: {} },
    { id: "2", type: "action", label: "Send Email", config: {} },
  ])

  const addStep = (type: "trigger" | "action") => {
    const newStep: Step = {
      id: Date.now().toString(),
      type,
      label: type === "trigger" ? "New Trigger" : "New Action",
      config: {},
    }
    setSteps((prev) => [...prev, newStep])
  }

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Automation Builder</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => addStep("trigger")}>
            <Plus className="h-3 w-3 mr-1" />
            Add Trigger
          </Button>
          <Button variant="outline" size="sm" onClick={() => addStep("action")}>
            <Plus className="h-3 w-3 mr-1" />
            Add Action
          </Button>
        </div>
      </div>

      <div className="relative">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            layout
          >
            {index > 0 && (
              <div className="flex justify-center py-2">
                <div className="h-8 w-8 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-[#00d4ff]" />
                </div>
              </div>
            )}
            <Card variant="default">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-white/20 cursor-grab" />
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <Select defaultValue={step.label}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {step.type === "trigger" ? (
                          <>
                            <SelectItem value="Schedule">Schedule</SelectItem>
                            <SelectItem value="Webhook">Webhook</SelectItem>
                            <SelectItem value="Event">Event</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="Send Email">Send Email</SelectItem>
                            <SelectItem value="API Call">API Call</SelectItem>
                            <SelectItem value="Notification">Notification</SelectItem>
                            <SelectItem value="Data Sync">Data Sync</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Configuration..." className="col-span-2" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-400"
                    onClick={() => removeStep(step.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button variant="glow" size="lg">
          <Zap className="h-4 w-4 mr-2" />
          Save Automation
        </Button>
      </div>
    </div>
  )
}

export { AutomationBuilder }
