import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// US Date/Time formatting utilities
export function formatDateUS(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  })
}

export function formatTimeUS(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export function formatDateTimeUS(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${formatDateUS(d)} ${formatTimeUS(d)}`
}

export function parseTimeSlot(timeStr: string): string {
  // Convert 24-hour format to 12-hour AM/PM format
  const [hour, minute] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hour, minute || 0, 0, 0)
  return formatTimeUS(date)
}
