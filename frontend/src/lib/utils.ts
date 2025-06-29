import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
  return `${(ms / 3600000).toFixed(1)}h`
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'text-green-600 bg-green-100'
    case 'running': return 'text-blue-600 bg-blue-100'
    case 'error': return 'text-red-600 bg-red-100'
    case 'pending': return 'text-yellow-600 bg-yellow-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

export function getRiskColor(risk: string): string {
  switch (risk) {
    case 'low': return 'text-green-600 bg-green-100'
    case 'medium': return 'text-yellow-600 bg-yellow-100'
    case 'high': return 'text-red-600 bg-red-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}