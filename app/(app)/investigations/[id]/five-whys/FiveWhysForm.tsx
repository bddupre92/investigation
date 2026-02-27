"use client"

import { useState, useTransition } from "react"
import { StepShell } from "@/components/investigation/StepShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { saveFiveWhys } from "@/actions/investigation"
import { toast } from "sonner"

interface WhyNode {
  clientId: string
  parentClientId: string | null
  treeIndex: number
  depth: number
  whyQuestion: string
  answer: string
  evidence: string
}

interface ExistingNode {
  id: string
  parentId: string | null
  treeIndex: number
  depth: number
  whyQuestion: string
  answer: string
  evidence: string
}

interface FiveWhysFormProps {
  id: string
  existing: ExistingNode[]
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function buildInitialNodes(existing: ExistingNode[]): WhyNode[] {
  if (existing.length === 0) {
    return [
      {
        clientId: generateId(),
        parentClientId: null,
        treeIndex: 0,
        depth: 1,
        whyQuestion: "",
        answer: "",
        evidence: "",
      },
    ]
  }

  // Map DB IDs to client IDs
  const dbToClient = new Map<string, string>()
  for (const node of existing) {
    dbToClient.set(node.id, generateId())
  }

  return existing.map((node) => ({
    clientId: dbToClient.get(node.id)!,
    parentClientId: node.parentId ? dbToClient.get(node.parentId) ?? null : null,
    treeIndex: node.treeIndex,
    depth: node.depth,
    whyQuestion: node.whyQuestion,
    answer: node.answer,
    evidence: node.evidence,
  }))
}

function buildDisplayOrder(nodes: WhyNode[]): WhyNode[] {
  const result: WhyNode[] = []

  const treeIndices = [...new Set(nodes.map((n) => n.treeIndex))].sort((a, b) => a - b)

  for (const treeIdx of treeIndices) {
    const treeNodes = nodes.filter((n) => n.treeIndex === treeIdx)
    const roots = treeNodes.filter((n) => n.parentClientId === null)
    for (const root of roots) {
      dfs(root, treeNodes, result)
    }
  }

  return result
}

function dfs(node: WhyNode, allNodes: WhyNode[], result: WhyNode[]) {
  result.push(node)
  const children = allNodes.filter((n) => n.parentClientId === node.clientId)
  for (const child of children) {
    dfs(child, allNodes, result)
  }
}

export function FiveWhysForm({ id, existing }: FiveWhysFormProps) {
  const [nodes, setNodes] = useState<WhyNode[]>(() => buildInitialNodes(existing))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const displayOrder = buildDisplayOrder(nodes)
  const treeIndices = [...new Set(nodes.map((n) => n.treeIndex))].sort((a, b) => a - b)

  function updateNode(clientId: string, field: keyof WhyNode, value: string) {
    setNodes((prev) =>
      prev.map((n) => (n.clientId === clientId ? { ...n, [field]: value } : n))
    )
  }

  function addChild(parent: WhyNode) {
    if (parent.depth >= 10) {
      toast.error("Maximum depth of 10 reached")
      return
    }
    const newNode: WhyNode = {
      clientId: generateId(),
      parentClientId: parent.clientId,
      treeIndex: parent.treeIndex,
      depth: parent.depth + 1,
      whyQuestion: parent.answer ? `Why did "${parent.answer.slice(0, 60)}" happen?` : "",
      answer: "",
      evidence: "",
    }
    setNodes((prev) => [...prev, newNode])
  }

  function addBranch(sibling: WhyNode) {
    const newNode: WhyNode = {
      clientId: generateId(),
      parentClientId: sibling.parentClientId,
      treeIndex: sibling.treeIndex,
      depth: sibling.depth,
      whyQuestion: "",
      answer: "",
      evidence: "",
    }
    setNodes((prev) => [...prev, newNode])
  }

  function removeSubtree(clientId: string) {
    setNodes((prev) => {
      const toRemove = new Set<string>()

      function collectDescendants(id: string) {
        toRemove.add(id)
        prev.filter((n) => n.parentClientId === id).forEach((n) => collectDescendants(n.clientId))
      }

      collectDescendants(clientId)
      return prev.filter((n) => !toRemove.has(n.clientId))
    })
  }

  function addNewTree() {
    const maxTree = Math.max(...nodes.map((n) => n.treeIndex), -1)
    const newNode: WhyNode = {
      clientId: generateId(),
      parentClientId: null,
      treeIndex: maxTree + 1,
      depth: 1,
      whyQuestion: "",
      answer: "",
      evidence: "",
    }
    setNodes((prev) => [...prev, newNode])
  }

  function getChildCount(clientId: string): number {
    return nodes.filter((n) => n.parentClientId === clientId).length
  }

  function handleSubmit() {
    setError(null)

    for (const node of nodes) {
      if (node.whyQuestion.trim().length < 5) {
        setError("All Why questions must be at least 5 characters.")
        return
      }
      if (node.answer.trim().length < 5) {
        setError("All Why answers must be at least 5 characters.")
        return
      }
      if (node.evidence.trim().length < 5) {
        setError("All Whys must have evidence (at least 5 characters).")
        return
      }
    }

    const payload = nodes.map((n) => ({
      id: n.clientId,
      parentId: n.parentClientId,
      treeIndex: n.treeIndex,
      depth: n.depth,
      whyQuestion: n.whyQuestion,
      answer: n.answer,
      evidence: n.evidence,
    }))

    startTransition(async () => {
      await saveFiveWhys(id, payload)
    })
  }

  return (
    <StepShell
      stepNumber={4}
      title="Five Whys Analysis"
      description="Ask 'Why?' repeatedly to drill down to the root cause. Add branches when causes diverge, or separate trees for multiple root causes."
      investigationId={id}
    >
      <div className="space-y-6">
        {treeIndices.map((treeIdx, treeArrayIdx) => {
          const treeNodes = displayOrder.filter((n) => n.treeIndex === treeIdx)
          const isOnlyTree = treeIndices.length === 1

          return (
            <div key={treeIdx} className="space-y-3">
              {!isOnlyTree && (
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Root Cause Tree {treeArrayIdx + 1}
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 text-xs"
                    onClick={() => {
                      setNodes((prev) => prev.filter((n) => n.treeIndex !== treeIdx))
                    }}
                  >
                    Remove Tree
                  </Button>
                </div>
              )}

              {treeArrayIdx > 0 && <div className="border-t border-slate-200 pt-3" />}

              {treeNodes.map((node) => {
                const isRoot = node.parentClientId === null

                return (
                  <div
                    key={node.clientId}
                    style={{ marginLeft: `${(node.depth - 1) * 2}rem` }}
                  >
                    {!isRoot && (
                      <div className="flex items-center gap-1 mb-1 ml-2">
                        <div className="w-4 border-t border-slate-300" />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                          because
                        </span>
                      </div>
                    )}

                    <Card className="border-slate-200">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                                "bg-blue-600 text-white"
                              )}
                            >
                              {node.depth}
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                              Why {node.depth}
                            </span>
                          </div>
                          {!isRoot && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-600 text-xs h-6 px-2"
                              onClick={() => removeSubtree(node.clientId)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-3">
                        <div>
                          <Label className="text-xs font-medium text-slate-600">Question</Label>
                          <Input
                            value={node.whyQuestion}
                            onChange={(e) => updateNode(node.clientId, "whyQuestion", e.target.value)}
                            placeholder={isRoot ? "Why did the problem occur?" : "Why did this happen?"}
                            className="mt-1 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-slate-600">Answer</Label>
                          <Textarea
                            value={node.answer}
                            onChange={(e) => updateNode(node.clientId, "answer", e.target.value)}
                            placeholder="Because..."
                            rows={2}
                            className="mt-1 text-sm resize-none"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-slate-600">
                            Evidence <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            value={node.evidence}
                            onChange={(e) => updateNode(node.clientId, "evidence", e.target.value)}
                            placeholder="What evidence supports this?"
                            rows={2}
                            className="mt-1 text-sm resize-none"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {node.answer.trim().length > 0 && node.depth < 10 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => addChild(node)}
                            >
                              + Deeper Why
                            </Button>
                          )}
                          {!isRoot && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => addBranch(node)}
                            >
                              + Branch
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          )
        })}

        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={addNewTree}
            className="text-sm"
          >
            + Add Separate Root Cause Tree
          </Button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Save & Continue \u2192"}
          </Button>
        </div>
      </div>
    </StepShell>
  )
}
