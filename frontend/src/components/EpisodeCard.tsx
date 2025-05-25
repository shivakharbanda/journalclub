import { useState } from "react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"

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

    const summary = expanded
        ? episode.summary_text
        : episode.summary_text.slice(0, 300) + "..."

    return (
        <Card className="bg-card border border-border shadow-lg hover:scale-[1.01] transition-transform duration-200">
            <img
                src={episode.image}
                alt={episode.title}
                className="w-full h-48 object-cover rounded-t-md"
            />

            <div className="px-4 py-3 space-y-2">
                <CardTitle className="text-amber-400 text-lg font-semibold">
                    {episode.title}
                </CardTitle>

                <CardDescription className="prose max-w-none text-muted-foreground text-sm">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                </CardDescription>

                <div>
                    <TopicsList topics={episode.topics} />
                    <TagsList tags={episode.tags} />
                </div>

                <div className="flex justify-between items-center pt-3">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-sm text-primary hover:underline"
                    >
                        {expanded ? "Show less" : "Read more"}
                    </button>

                    <Link to={`/episodes/${episode.slug}`}>
                        <Button size="sm">Listen</Button>
                    </Link>
                </div>
            </div>
        </Card>
    )
}