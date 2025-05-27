import { Link, NavLink, useLocation } from 'react-router-dom'
import { mainMenu } from '@/config/menu'
import { cn } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search } from 'lucide-react'
import { AppLogo } from './app-logo'
import { AppSidebar } from './app-sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@mui/material'

interface AppHeaderProps {
    onSearch?: (query: string) => void
    searchValue?: string
}

export function AppHeader({ onSearch, searchValue = '' }: AppHeaderProps) {
    const location = useLocation()

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearch?.(e.target.value)
    }

    const { isAuthenticated, logout } = useAuth()

    return (
        <header className="bg-background sticky top-0 z-50 border-b">
            <div className="w-full ~max-w-7xl mx-auto flex items-center gap-2 h-14 px-4 md:px-8">
                <div className='flex items-center gap-2 md:gap-0'>
                    <AppSidebar />
                    <Link to="/">
                        <AppLogo />
                    </Link>
                </div>

                <div className='ml-4 flex-1 flex items-center justify-between'>
                    {/* Navigation - hidden on smaller screens when search is present */}
                    <div className='hidden lg:block'>
                        <nav className="flex gap-1">
                            {mainMenu.map((item, index) => (
                                (item.items && item.items.length > 0) ? (
                                    <DropdownMenu key={index}>
                                        <DropdownMenuTrigger className='focus-visible:outline-none'>
                                            <NavLink
                                                key={index}
                                                to={item.url}
                                                className={({ isActive }) => cn(
                                                    "flex items-center gap-2 overflow-hidden rounded-md p-2.5 text-left text-sm outline-none transition-[width,height,padding] hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>svg]:size-4",
                                                    "h-8 text-sm hover:bg-accent hover:text-accent-foreground",
                                                    isActive ? "text-foreground bg-accent" : "text-foreground/70"
                                                )}>
                                                {item.icon && <item.icon />}
                                                <span className='font-medium'>{item.title}</span>
                                                <ChevronDown className='!size-3 -ml-1' />
                                            </NavLink>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align='start' className='min-w-56'>
                                            {item.items.map((subItem, index) => (
                                                <DropdownMenuItem key={index} asChild>
                                                    <NavLink
                                                        to={subItem.url}
                                                        className={cn(
                                                            'cursor-pointer',
                                                            subItem.url === location.pathname && 'bg-muted'
                                                        )}>
                                                        {subItem.title}
                                                    </NavLink>
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <NavLink
                                        key={index}
                                        to={item.url}
                                        className={({ isActive }) => cn(
                                            "flex items-center gap-2 overflow-hidden rounded-md p-2.5 text-left text-sm outline-none transition-[width,height,padding] hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>svg]:size-4",
                                            "h-8 text-sm hover:bg-accent hover:text-accent-foreground",
                                            isActive ? "text-foreground bg-accent" : "text-foreground/70"
                                        )}>
                                        {item.icon && <item.icon />}
                                        <span className='font-medium'>{item.title}</span>
                                    </NavLink>
                                )
                            ))}
                        </nav>
                    </div>

                    {/* Search Bar - centered and responsive */}
                    <div className='flex-1 max-w-md mx-4 lg:mx-8'>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search episodes, topics, tags..."
                                className="pl-8 h-9 bg-muted/50 border-0 focus-visible:ring-1"
                                value={searchValue}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>

                    {/* Right side - placeholder for future user menu */}
                    <div className="flex items-center space-x-2">
                        {isAuthenticated ? (
                            <Button
                                variant="text"
                                size="small"
                                onClick={logout}
                                className="text-sm font-medium"
                                sx={{ textTransform: 'none' }}
                            >
                                Sign out
                            </Button>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="text" size="small" className="text-sm font-medium" sx={{ textTransform: 'none' }}>
                                        Sign in
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button variant="outlined" size="small" className="text-sm font-medium" sx={{ textTransform: 'none' }}>
                                        Sign up
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </header>
    )
}



/*{ <nav className="flex gap-1">
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant='ghost'
                                    className='relative h-8 w-8 rounded-full cursor-pointer ml-2'>
                                    <Avatar className='h-8 w-8'>
                                        <AvatarImage src={baseUrl + '/avatars/shadcn.jpg'} alt='shadcn' />
                                        <AvatarFallback className="rounded-lg">SC</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='w-56' align='end' forceMount>
                                <DropdownMenuLabel className='font-normal'>
                                    <div className='flex flex-col space-y-1'>
                                        <p className='text-sm font-medium leading-none'>shadcn</p>
                                        <p className='text-xs leading-none text-muted-foreground'>
                                            m@example.com
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Log out</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav> }*/