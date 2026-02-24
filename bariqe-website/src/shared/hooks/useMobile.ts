"use client"

import { useMedia } from "react-use"

export function useMobile(query = "(max-width: 768px)") {
  return useMedia(query, false)
}
