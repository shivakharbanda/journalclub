import { Input } from '@/components/ui/input'
import { SearchResults } from '@/components/SearchResults'
import { Search } from 'lucide-react'
import { useState } from 'react'

export default function SearchPage() {
    const [query, setQuery] = useState('')

    return (
        <div className="p-4 pb-20 max-w-3xl mx-auto">
            <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search episodes, topics, tags..."
                    className="pl-8 h-10 bg-muted/50 border-0 focus-visible:ring-1"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />
            </div>
            {query.trim() && <SearchResults searchQuery={query} />}
        </div>
    )
}
