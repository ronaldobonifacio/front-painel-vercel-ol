import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => {
    // Estado inicial baseado no SSR
    if (typeof window === "undefined") return false
    return window.innerWidth < MOBILE_BREAKPOINT
  })

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    
    // Atualiza o state quando houver mudança
    mql.addEventListener("change", handler)
    
    // Atualização inicial
    setIsMobile(mql.matches)
    
    return () => mql.removeEventListener("change", handler)
  }, [])

  return isMobile
}