import { useState, useCallback, useEffect } from 'react'
import { fetcher } from '@/lib/api'
import EpisodeCard from './EpisodeCard'
import { EpisodeFull } from '@/types/episode'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

// Types for tags and topics
interface Tag {
  id: number
  name: string
  slug: string
  color?: string
}

interface Topic {
  id: number
  name: string
  slug: string
  color?: string
}

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
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])
    const [allTags, setAllTags] = useState<Tag[]>([])
    const [allTopics, setAllTopics] = useState<Topic[]>([])
    const [isFiltersOpen, setIsFiltersOpen] = useState(false)
    const [isTagsOpen, setIsTagsOpen] = useState(true)
    const [isTopicsOpen, setIsTopicsOpen] = useState(true)

    // Build search URL with filters
    const buildSearchUrl = useCallback((query: string, tags: string[], topics: string[]) => {
        const params = new URLSearchParams()
        if (query.trim()) params.append('q', query)
        tags.forEach(tag => params.append('tag', tag))
        topics.forEach(topic => params.append('topic', topic))
        return `/episodes/?${params.toString()}`
    }, [])

    // Debounced search function with filters
    const debouncedSearch = useCallback(
        debounce(async (query: string, tags: string[], topics: string[]) => {
            setIsSearching(true)
            try {
                const url = buildSearchUrl(query, tags, topics)
                const results = await fetcher<EpisodeFull[]>(url)
                setSearchResults(results)
            } catch (error) {
                console.error('Search error:', error)
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }, 300),
        [buildSearchUrl]
    )

    // Load all tags and topics on component mount
    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [tagsData, topicsData] = await Promise.all([
                    fetcher<Tag[]>('/tags/'),
                    fetcher<Topic[]>('/topics/')
                ])
                setAllTags(tagsData)
                setAllTopics(topicsData)
            } catch (error) {
                console.error('Error loading filters:', error)
            }
        }
        loadFilters()
    }, [])

    // Effect to trigger search when query or filters change
    useEffect(() => {
        if (searchQuery.trim() || selectedTags.length > 0 || selectedTopics.length > 0) {
            debouncedSearch(searchQuery, selectedTags, selectedTopics)
        } else {
            setSearchResults([])
            setIsSearching(false)
        }
    }, [searchQuery, selectedTags, selectedTopics, debouncedSearch])

    // Filter handlers
    const handleTagToggle = (tagSlug: string) => {
        setSelectedTags(prev => 
            prev.includes(tagSlug) 
                ? prev.filter(t => t !== tagSlug)
                : [...prev, tagSlug]
        )
    }

    const handleTopicToggle = (topicSlug: string) => {
        setSelectedTopics(prev => 
            prev.includes(topicSlug) 
                ? prev.filter(t => t !== topicSlug)
                : [...prev, topicSlug]
        )
    }

    const clearAllFilters = () => {
        setSelectedTags([])
        setSelectedTopics([])
    }

    const hasActiveFilters = selectedTags.length > 0 || selectedTopics.length > 0
    const totalResults = searchResults.length
    const hasQuery = searchQuery.trim().length > 0

    return (
        <div className="py-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-foreground">
                        Search Results
                    </h2>
                    
                    {/* Mobile filter toggle */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className="lg:hidden"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        {hasActiveFilters && (
                            <Badge variant="secondary" className="ml-2">
                                {selectedTags.length + selectedTopics.length}
                            </Badge>
                        )}
                    </Button>
                </div>

                {/* Search status */}
                <div className="flex items-center gap-2 text-muted-foreground">
                    {isSearching ? (
                        <span>Searching...</span>
                    ) : (
                        <span>
                            {hasQuery || hasActiveFilters 
                                ? `Found ${totalResults} episode${totalResults !== 1 ? 's' : ''}`
                                : 'Enter a search term or select filters to find episodes'
                            }
                            {hasQuery && ` for "${searchQuery}"`}
                        </span>
                    )}
                </div>

                {/* Active filters display */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="text-sm text-muted-foreground">Active filters:</span>
                        {selectedTags.map(tagSlug => {
                            const tag = allTags.find(t => t.slug === tagSlug)
                            return (
                                <Badge 
                                    key={tagSlug} 
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => handleTagToggle(tagSlug)}
                                >
                                    {tag?.name || tagSlug}
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            )
                        })}
                        {selectedTopics.map(topicSlug => {
                            const topic = allTopics.find(t => t.slug === topicSlug)
                            return (
                                <Badge 
                                    key={topicSlug} 
                                    variant="outline"
                                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                                    onClick={() => handleTopicToggle(topicSlug)}
                                >
                                    {topic?.name || topicSlug}
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            )
                        })}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearAllFilters}
                            className="h-6 px-2 text-xs"
                        >
                            Clear all
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex gap-6">
                {/* Filters Sidebar */}
                <div className={`${isFiltersOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 shrink-0`}>
                    <Card className="sticky top-4">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Filters</h3>
                                {hasActiveFilters && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={clearAllFilters}
                                        className="h-6 px-2 text-xs"
                                    >
                                        Clear all
                                    </Button>
                                )}
                            </div>

                            {/* Tags Filter */}
                            <Collapsible open={isTagsOpen} onOpenChange={setIsTagsOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between p-0 h-8 mb-2">
                                        <span className="font-medium">Tags</span>
                                        {isTagsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-2 mb-4">
                                    {allTags.map(tag => (
                                        <div
                                            key={tag.slug}
                                            className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                                                selectedTags.includes(tag.slug)
                                                    ? 'bg-secondary text-secondary-foreground'
                                                    : 'hover:bg-muted'
                                            }`}
                                            onClick={() => handleTagToggle(tag.slug)}
                                        >
                                            <div className={`w-3 h-3 rounded border-2 mr-2 ${
                                                selectedTags.includes(tag.slug)
                                                    ? 'bg-primary border-primary'
                                                    : 'border-border'
                                            }`} />
                                            <span className="text-sm">{tag.name}</span>
                                        </div>
                                    ))}
                                </CollapsibleContent>
                            </Collapsible>

                            <Separator className="my-4" />

                            {/* Topics Filter */}
                            <Collapsible open={isTopicsOpen} onOpenChange={setIsTopicsOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="w-full justify-between p-0 h-8 mb-2">
                                        <span className="font-medium">Topics</span>
                                        {isTopicsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-2">
                                    {allTopics.map(topic => (
                                        <div
                                            key={topic.slug}
                                            className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                                                selectedTopics.includes(topic.slug)
                                                    ? 'bg-secondary text-secondary-foreground'
                                                    : 'hover:bg-muted'
                                            }`}
                                            onClick={() => handleTopicToggle(topic.slug)}
                                        >
                                            <div className={`w-3 h-3 rounded border-2 mr-2 ${
                                                selectedTopics.includes(topic.slug)
                                                    ? 'bg-primary border-primary'
                                                    : 'border-border'
                                            }`} />
                                            <span className="text-sm">{topic.name}</span>
                                        </div>
                                    ))}
                                </CollapsibleContent>
                            </Collapsible>
                        </CardContent>
                    </Card>
                </div>

                {/* Results */}
                <div className="flex-1 min-w-0">
                    {isSearching ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {searchResults.map(episode => (
                                <EpisodeCard key={episode.id} episode={episode} />
                            ))}
                        </div>
                    ) : (hasQuery || hasActiveFilters) ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">
                                No episodes found
                                {hasQuery && ` for "${searchQuery}"`}
                                {hasActiveFilters && " with the selected filters"}
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                                Try different keywords or adjust your filters
                            </p>
                            {hasActiveFilters && (
                                <Button variant="outline" onClick={clearAllFilters}>
                                    Clear all filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                Start typing to search episodes or use the filters to browse by tags and topics
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}