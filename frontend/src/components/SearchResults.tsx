import { useState, useCallback, useEffect } from 'react'
import { fetcher } from '@/lib/api'
import EpisodeCard from './EpisodeCard'
import { EpisodeFull } from '@/types/episode'



// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, delay: number): (...args: Parameters<F>) => void {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<F>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
    }
}

interface SearchResultsProps {
    searchQuery: string
}

export function SearchResults({ searchQuery }: SearchResultsProps) {
    const [searchResults, setSearchResults] = useState<EpisodeFull[]>([])
    const [isSearching, setIsSearching] = useState(false)

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (query: string) => {
            if (query.trim()) {
                setIsSearching(true)
                try {
                    const results = await fetcher<EpisodeFull[]>(`/episodes/?q=${encodeURIComponent(query)}`)
                    setSearchResults(results)
                } catch (error) {
                    console.error('Search error:', error)
                    setSearchResults([])
                } finally {
                    setIsSearching(false)
                }
            } else {
                setSearchResults([])
                setIsSearching(false)
            }
        }, 300),
        []
    )

    // Effect to trigger search when query changes
    useEffect(() => {
        debouncedSearch(searchQuery)
    }, [searchQuery, debouncedSearch])

    return (
        <div className="py-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                    Search Results
                </h2>
                <p className="text-muted-foreground">
                    {isSearching 
                        ? 'Searching...' 
                        : `Found ${searchResults.length} episode${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`
                    }
                </p>
            </div>
            
            {isSearching ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searchResults.map(episode => (
                        <EpisodeCard key={episode.id} episode={episode} />
                    ))}
                </div>
            ) : searchQuery.trim() ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No episodes found for "{searchQuery}"</p>
                    <p className="text-sm text-muted-foreground">Try searching for different keywords or topics</p>
                </div>
            ) : null}
        </div>
    )
}