"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface RealTimeContextType {
  isConnected: boolean
  lastUpdate: Date | null
}

const RealTimeContext = createContext<RealTimeContextType>({
  isConnected: false,
  lastUpdate: null,
})

export function RealTimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("global-updates")
      .on("presence", { event: "sync" }, () => {
        setIsConnected(true)
        setLastUpdate(new Date())
      })
      .on("presence", { event: "join" }, () => {
        setIsConnected(true)
      })
      .on("presence", { event: "leave" }, () => {
        setIsConnected(false)
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true)
        } else if (status === "CLOSED") {
          setIsConnected(false)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return <RealTimeContext.Provider value={{ isConnected, lastUpdate }}>{children}</RealTimeContext.Provider>
}

export const useRealTime = () => useContext(RealTimeContext)
