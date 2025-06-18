import { useState } from "react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"

import TagsList from "./TagsList"
import TopicsList from "./TopicsList"
import { PlayCircle } from "lucide-react"
import { EpisodeCompact, EpisodeFull } from "@/types/episode"

type Props = {
    episode: EpisodeFull
}

type CompactProps = {
    episode: EpisodeCompact
    progressPercentage?: number
}

export default function EpisodeCard({ episode }: Props) {
    const [expanded, setExpanded] = useState(false)

    const needsTruncation = episode.description.length > 80 // Much shorter

    return (
        <Card className="bg-card border border-border shadow-sm hover:scale-[1.005] transition-transform duration-200">
            {/* Image with Play Overlay */}
            <Link to={`/episodes/${episode.slug}`} className="relative block group">
                <img
                    src={episode.image_url}
                    alt={episode.title}
                    className="w-full h-28 object-cover rounded-t-md" // Even smaller
                />
                {/* Play Button - Shows on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <PlayCircle className="h-12 w-12 text-white drop-shadow-lg" />
                </div>
            </Link>

            {/* Compact content container */}
            <div className="p-2 space-y-1.5">
                {/* Title and Date - Tighter spacing */}
                <div className="space-y-0.5">
                    <CardTitle className="text-amber-400 text-sm font-semibold leading-tight line-clamp-2">
                        {episode.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric"
                        }).format(new Date(episode.created_at))}
                    </p>
                </div>

                {/* Compact Description */}
                <CardDescription className="text-muted-foreground text-xs leading-tight">
                    <div className="prose prose-xs max-w-none [&>*]:my-0">
                        <ReactMarkdown>
                            {expanded
                                ? episode.description
                                : `${episode.description.slice(0, 80).trim()}${needsTruncation ? '...' : ''}`}
                        </ReactMarkdown>
                    </div>

                    {needsTruncation && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-primary hover:underline font-medium text-xs ml-1"
                        >
                            {expanded ? "Less" : "More"}
                        </button>
                    )}
                </CardDescription>

                {/* Compact Topics and Tags */}
                <div className="space-y-1">
                    <TopicsList topics={episode.topics} />
                    <TagsList tags={episode.tags} />
                </div>
            </div>
        </Card>
    )
}
// Compact version for carousels
export function CompactEpisodeCard({ episode, progressPercentage = 0 }: CompactProps) {
    return (
        <Card className="bg-card border border-border shadow-sm hover:scale-[1.02] transition-all duration-200 group overflow-hidden">
            <Link 
                to={`/episodes/${episode.slug}`} 
                className="relative block"
            >
                <div className="relative w-full h-48">
                    <img
                        src={episode.image}
                        alt={episode.title}
                        className="w-full h-full object-cover"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Play Button - Shows on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <PlayCircle className="h-12 w-12 text-white drop-shadow-lg" />
                    </div>

                    {/* Progress Bar (only show if progressPercentage > 0) */}
                    {progressPercentage > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            <div 
                                className="h-full bg-red-600 transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    )}
                    
                    {/* Title Overlay */}
                    <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-amber-400 font-semibold text-base leading-tight line-clamp-2 drop-shadow-lg" style={{ textShadow: "rgba(0, 0, 0, 0.8) 2px 2px 4px" }}>
                            {episode.title}
                        </h3>
                        <p className="text-white/80 text-sm mt-1 drop-shadow">
                            {new Intl.DateTimeFormat("en-US", {
                                month: "short",
                                day: "numeric"
                            }).format(new Date(episode.created_at))}
                        </p>
                    </div>
                </div>
            </Link>
        </Card>
    )
}