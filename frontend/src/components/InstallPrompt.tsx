import { Smartphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePWAInstall } from '@/hooks/use-pwa-install'


// Floating install prompt for mobile
import React from 'react'

export function InstallPrompt(): React.JSX.Element | null {
  const { 
    isInstallAvailable, 
    promptInstall, 
    dismissInstall, 
    isStandalone 
  } = usePWAInstall()

  if (!isInstallAvailable || isStandalone) {
    return null
  }

  const handleInstall = async (): Promise<void> => {
    await promptInstall()
  }

  const handleDismiss = (): void => {
    dismissInstall()
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 mx-auto max-w-sm bg-card border border-border rounded-lg shadow-lg p-4 z-50 md:hidden">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Smartphone className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-card-foreground">
            Install Journal Club
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Add to your home screen for quick access
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          onClick={handleInstall}
          className="flex-1"
        >
          Install
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDismiss}
          className="flex-1"
        >
          Not now
        </Button>
      </div>
    </div>
  )
}