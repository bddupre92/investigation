"use client"

import { Button } from "@/components/ui/button"

export function BackButton() {
  return (
    <Button type="button" variant="outline" onClick={() => window.history.back()}>
      Back
    </Button>
  )
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
    >
      Print / PDF
    </button>
  )
}

export function ExportCsvButton({ investigationId }: { investigationId: string }) {
  return (
    <a
      href={`/api/investigations/${investigationId}/export`}
      download
      className="print:hidden inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
    >
      Export CSV
    </a>
  )
}
