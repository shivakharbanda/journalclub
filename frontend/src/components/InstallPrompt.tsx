import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt: () => Promise<void>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      // Check and cast to correct type
      const promptEvent = e as BeforeInstallPromptEvent
      e.preventDefault()
      setDeferredPrompt(promptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    setDeferredPrompt(null)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-0 right-0 mx-auto w-fit px-4 py-2 bg-accent text-accent-foreground rounded shadow-md z-50">
      <button onClick={install} className="px-4 py-2 bg-primary text-white rounded">
        Install Journal Club
      </button>
    </div>
  )
}
