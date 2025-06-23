import { Outlet, useLocation } from 'react-router'
import { AppHeader } from './app-header'
import { AppFooter } from './app-footer'
import { SearchResults } from './SearchResults'
import { useState } from 'react'
import { BottomNav } from './app-bottomnav'

export function AppLayout() {
    const [searchQuery, setSearchQuery] = useState('')

    const location = useLocation()
    const isSearchRoute = location.pathname.startsWith('/search')



    const handleSearch = (query: string) => {
        setSearchQuery(query)
    }

    return (
        <div className="min-h-screen flex flex-col w-full ~bg-muted/50">
            <AppHeader
                searchValue={searchQuery}
                onSearch={handleSearch}
            />
            <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-grow flex-col">
                <div className='flex flex-grow flex-col'>
                    {/* Conditional rendering: Search results or normal pages */}
                    {!isSearchRoute && searchQuery.trim() ? (
                        <SearchResults searchQuery={searchQuery} />
                    ) : (
                        <Outlet />
                    )}
                </div>
                <AppFooter />
            </div>
            <BottomNav/>
        </div>
    )
}