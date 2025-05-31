import { useState } from "react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled"

import TagsList from "./TagsList"
import TopicsList from "./TopicsList"
import { PlayCircle } from "lucide-react"

type Tag = {
    id: number
    name: string
    slug: string
}

type Topic = {
    id: number
    name: string
    slug: string
    description: string
}

type Episode = {
    id: number
    title: string
    slug: string
    summary_text: string
    audio_file: string
    created_at: string
    image: string
    tags: Tag[]
    topics: Topic[]
}

type Props = {
    episode: Episode
}

type CompactProps = {
    episode: Episode
    progressPercentage?: number
}

export default function EpisodeCard({ episode }: Props) {
    const [expanded, setExpanded] = useState(false)

    const needsTruncation = episode.summary_text.length > 300

    return (
        <Card className="bg-card border border-border shadow-sm hover:scale-[1.005] transition-transform duration-200">
            {/* Image with Play Overlay */}
            <Link to={`/episodes/${episode.slug}`} className="relative block group">
                <img
                    src={episode.image}
                    alt={episode.title}
                    className="w-full h-36 object-cover rounded-t-md"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-t-md">
                    <PlayCircleFilledIcon
                        className="text-white drop-shadow-lg"
                        style={{ fontSize: '2.5rem' }}
                    />
                </div>
            </Link>

            <div className="px-3 py-2 space-y-2">
                <div className="flex flex-col gap-0.5">
                    <CardTitle className="text-amber-400 text-base font-semibold leading-snug">
                        {episode.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground leading-tight">
                        {new Intl.DateTimeFormat("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                        }).format(new Date(episode.created_at))}
                    </p>
                </div>

                <CardDescription className="text-muted-foreground text-sm leading-snug">
                    <ReactMarkdown>
                        {expanded
                            ? episode.summary_text
                            : `${episode.summary_text.slice(0, 300).trim()}...`}
                    </ReactMarkdown>

                    {needsTruncation && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-primary hover:underline font-medium ml-1"
                        >
                            {expanded ? "Show less" : "Read more"}
                        </button>
                    )}
                </CardDescription>

                <div className="pt-1">
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