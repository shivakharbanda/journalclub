import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@mui/material'
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

interface AuthButtonsProps {
    variant: 'header' | 'sidebar'
    onItemClick?: () => void // For closing mobile menu when clicked
}

export function AuthButtons({ variant, onItemClick }: AuthButtonsProps) {
    const { isAuthenticated, logout } = useAuth()

    const handleLogout = () => {
        logout()
        onItemClick?.()
    }

    const handleLinkClick = () => {
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
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                    <span>Sign out</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        )
    }

    return (
        <>
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