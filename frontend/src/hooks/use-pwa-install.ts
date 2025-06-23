import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

type InstallState = 'available' | 'dismissed' | 'installed' | 'not-available'

const INSTALL_DISMISSED_KEY = 'journal-club-install-dismissed'
const INSTALL_PROMPT_SHOWN_KEY = 'journal-club-install-prompt-shown'

interface PWAInstallReturn {
  installState: InstallState
  isInstallAvailable: boolean
  isStandalone: boolean
  promptInstall: () => Promise<boolean>
  dismissInstall: () => void
  resetInstallPrompt: () => void
  showInstallToast: () => void
}

export function usePWAInstall(): PWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installState, setInstallState] = useState<InstallState>('not-available')
  const [isStandalone, setIsStandalone] = useState(false)

  const checkStandalone = useCallback((): boolean => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      'standalone' in window.navigator ||
      document.referrer.includes('android-app://')
    )
  }, [])

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setInstallState('installed')
        setDeferredPrompt(null)
        return true
      } else {
        localStorage.setItem(INSTALL_DISMISSED_KEY, 'true')
        setInstallState('dismissed')
        setDeferredPrompt(null)
        return false
      }
    } catch (error) {
      console.error('Error during install prompt:', error)
      return false
    }
  }, [deferredPrompt])

  const dismissInstall = useCallback((): void => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, 'true')
    setInstallState('dismissed')
    setDeferredPrompt(null)
  }, [])

  const showInstallToast = useCallback((): void => {
    toast("📱 Install Journal Club", {
      description: "Get quick access from your home screen for a better experience!",
      action: {
        label: "Install",
        onClick: promptInstall,
      },
      duration: 8000,
    })
  }, [promptInstall])

  const resetInstallPrompt = useCallback((): void => {
    localStorage.removeItem(INSTALL_DISMISSED_KEY)
    localStorage.removeItem(INSTALL_PROMPT_SHOWN_KEY)
    setInstallState('not-available')
    window.location.reload()
  }, [])

  // Check if app is already installed
  useEffect(() => {
    setIsStandalone(checkStandalone())
  }, [checkStandalone])

  useEffect(() => {
    // Don't show install prompts if already installed
    if (isStandalone) {
      setInstallState('installed')
      return
    }

    const isDismissed = localStorage.getItem(INSTALL_DISMISSED_KEY) === 'true'
    if (isDismissed) {
      setInstallState('dismissed')
      return
    }

    const handleBeforeInstallPrompt = (e: Event): void => {
      const promptEvent = e as BeforeInstallPromptEvent
      e.preventDefault()
      setDeferredPrompt(promptEvent)
      setInstallState('available')
      
      // Show toast notification on first visit
      const hasShownPrompt = localStorage.getItem(INSTALL_PROMPT_SHOWN_KEY) === 'true'
      if (!hasShownPrompt) {
        showInstallToast()
        localStorage.setItem(INSTALL_PROMPT_SHOWN_KEY, 'true')
      }
    }

    const handleAppInstalled = (): void => {
      setInstallState('installed')
      toast.success("🎉 Journal Club Installed!", {
        description: "You can now access Journal Club from your home screen.",
      })
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return (): void => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isStandalone, showInstallToast])

  return {
    installState,
    isInstallAvailable: installState === 'available',
    isStandalone,
    promptInstall,
    dismissInstall,
    resetInstallPrompt,
    showInstallToast,
  }
}