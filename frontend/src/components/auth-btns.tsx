import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@mui/material'
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { usePWAInstall } from '@/hooks/use-pwa-install'
import { Download } from 'lucide-react'

interface AuthButtonsProps {
    variant: 'header' | 'sidebar'
    onItemClick?: () => void // For closing mobile menu when clicked
}

export function AuthButtons({ variant, onItemClick }: AuthButtonsProps) {
    const { isAuthenticated, logout } = useAuth()
    const { isInstallAvailable, promptInstall, isStandalone } = usePWAInstall()

    const handleLogout = () => {
        logout()
        onItemClick?.()
    }

    const handleLinkClick = () => {
        onItemClick?.()
    }

    const handleInstall = async (): Promise<void> => {
        await promptInstall()
        onItemClick?.()
    }

    if (variant === 'header') {
        return (
            <div className="flex items-center space-x-2">
                {isAuthenticated ? (
                    <Button
                        variant="text"
                        size="small"
                        onClick={handleLogout}
                        className="text-sm font-medium"
                        sx={{ textTransform: 'none' }}
                    >
                        Sign out
                    </Button>
                ) : (
                    <>
                        <Link to="/login">
                            <Button 
                                variant="text" 
                                size="small" 
                                className="text-sm font-medium" 
                                sx={{ textTransform: 'none' }}
                            >
                                Sign in
                            </Button>
                        </Link>
                        <Link to="/register">
                            <Button 
                                variant="outlined" 
                                size="small" 
                                className="text-sm font-medium" 
                                sx={{ textTransform: 'none' }}
                            >
                                Sign up
                            </Button>
                        </Link>
                    </>
                )}
            </div>
        )
    }

    // Sidebar variant - completely different structure
    if (isAuthenticated) {
        return (
            <>
                {(isInstallAvailable && !isStandalone) && (
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleInstall}>
                            <Download className="h-4 w-4" />
                            <span>Install App</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout}>
                        <span>Sign out</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </>
        )
    }

    return (
        <>
            {(isInstallAvailable && !isStandalone) && (
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleInstall}>
                        <Download className="h-4 w-4" />
                        <span>Install App</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )}
            <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link to="/login" onClick={handleLinkClick}>
                        <span>Sign in</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link to="/register" onClick={handleLinkClick}>
                        <span>Sign up</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </>
    )
}