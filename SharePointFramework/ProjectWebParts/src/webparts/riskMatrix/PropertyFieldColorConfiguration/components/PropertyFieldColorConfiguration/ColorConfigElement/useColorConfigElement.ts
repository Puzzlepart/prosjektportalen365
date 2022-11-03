import { useRef, useState } from 'react'

export function useColorConfigElement() {
  const [isEditing, setIsEditing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  return { ref, isEditing, setIsEditing } as const
}
