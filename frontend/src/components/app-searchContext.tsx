import { createContext, useContext, useState } from 'react'

interface SearchContextProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
}

const SearchContext = createContext<SearchContextProps | undefined>(undefined)

export function SearchProvider({ children }: { children: React.ReactNode }) {
    const [searchQuery, setSearchQuery] = useState('')
    return (
        <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
            {children}
        </SearchContext.Provider>
    )
}

export function useSearch() {
    const context = useContext(SearchContext)
    if (!context) throw new Error('useSearch must be used within a SearchProvider')
    return context
}
