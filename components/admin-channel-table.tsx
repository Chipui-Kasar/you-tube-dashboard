"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCompactNumber } from "@/lib/utils"
import { Trash2, Edit2, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react"

interface Channel {
  id: number
  youtube_channel_id: string
  channel_name: string
  tribe: string
  region: string
  thumbnail_url: string
  subscribers: number
  views: number
  created_at: string
}

interface AdminChannelTableProps {
  channels: Channel[]
  onEdit: (channel: Channel) => void
  onDelete: (id: number) => void
}

type SortKey = "channel_name" | "tribe" | "region" | "subscribers" | "views"

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "channel_name", label: "Channel", align: "left" },
  { key: "tribe", label: "Tribe", align: "left" },
  { key: "region", label: "Region", align: "left" },
  { key: "subscribers", label: "Subscribers", align: "right" },
  { key: "views", label: "Views", align: "right" },
]

const PAGE_SIZE = 10

export default function AdminChannelTable({ channels, onEdit, onDelete }: AdminChannelTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)

  const handleSort = (key: SortKey) => {
    setCurrentPage(1)
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const sortedChannels = useMemo(() => {
    if (!sortKey) return channels
    const direction = sortDirection === "asc" ? 1 : -1
    return [...channels].sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]
      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * direction
      }
      return String(aValue).localeCompare(String(bValue)) * direction
    })
  }, [channels, sortKey, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sortedChannels.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const paginatedChannels = useMemo(
    () => sortedChannels.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sortedChannels, page],
  )

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className={`select-none cursor-pointer py-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  <span
                    className={`inline-flex items-center gap-1 ${
                      column.align === "right" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {column.label}
                    {sortKey === column.key ? (
                      sortDirection === "asc" ? (
                        <ChevronUp className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-primary" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/40" />
                    )}
                  </span>
                </th>
              ))}
              <th className="w-24 py-3 px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedChannels.map((channel) => (
              <tr key={channel.id} className="transition-colors hover:bg-muted/40">
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={channel.thumbnail_url || "/placeholder.svg"}
                      alt=""
                      className="size-9 shrink-0 rounded-full border border-border object-cover"
                      onError={(e) => {
                        const img = e.currentTarget
                        if (img.src.endsWith("/placeholder.svg")) return
                        img.src = "/placeholder.svg"
                      }}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{channel.channel_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{channel.youtube_channel_id}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-4">
                  <Badge variant="secondary" className="font-normal">
                    {channel.tribe}
                  </Badge>
                </td>
                <td className="py-2.5 px-4">
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                    {channel.region}
                  </Badge>
                </td>
                <td className="py-2.5 px-4 text-right font-medium tabular-nums text-foreground">
                  {formatCompactNumber(channel.subscribers)}
                </td>
                <td className="py-2.5 px-4 text-right font-medium tabular-nums text-foreground">
                  {formatCompactNumber(channel.views)}
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onEdit(channel)}
                      title="Edit channel"
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onDelete(channel.id)}
                      title="Delete channel"
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{(page - 1) * PAGE_SIZE + 1}</span>–
            <span className="font-medium text-foreground">{Math.min(page * PAGE_SIZE, sortedChannels.length)}</span>{" "}
            of <span className="font-medium text-foreground">{sortedChannels.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
