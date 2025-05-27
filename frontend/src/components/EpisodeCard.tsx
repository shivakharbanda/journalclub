import { useState } from "react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled"

import TagsList from "./TagsList"
import TopicsList from "./TopicsList"

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
