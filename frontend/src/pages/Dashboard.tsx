import { useEffect, useState } from "react"
import { PageHeader, PageHeaderHeading } from "@/components/page-header"
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetcher } from "@/lib/api"
import ReactMarkdown from "react-markdown"
import { Link } from "react-router-dom"

type Episode = {
    id: number
    title: string
    slug: string
    summary_text: string
    audio_file: string
    created_at: string
}

export default function Dashboard() {
    const [episodes, setEpisodes] = useState<Episode[]>([])
    const [expanded, setExpanded] = useState<{ [id: number]: boolean }>({})

    useEffect(() => {
        fetcher<Episode[]>("/episodes/")
            .then(setEpisodes)
            .catch((err) => console.error("API Error:", err))
    }, [])

    const toggleExpand = (id: number) => {
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
    }

    return (
        <div className="space-y-6 px-4 md:px-12 py-6">
            <PageHeader>
                <PageHeaderHeading>Latest Episodes</PageHeaderHeading>
            </PageHeader>

            <div className="space-y-6">
                {episodes.map((episode) => {
                    const isExpanded = expanded[episode.id] || false
                    const summary = isExpanded
                        ? episode.summary_text
                        : episode.summary_text.slice(0, 300) + "..."

                    return (
                        <Card key={episode.id} className="w-full max-w-3xl mx-auto">
                            <CardHeader>
                                <CardTitle>{episode.title}</CardTitle>
                                <CardDescription className="prose max-w-none text-sm">
                                    <ReactMarkdown>{summary}</ReactMarkdown>
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="flex justify-between">
                                <button
                                    onClick={() => toggleExpand(episode.id)}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    {isExpanded ? "Show less" : "Read more"}
                                </button>
                                <Link to={`/episodes/${episode.slug}`}>
                                    <Button size="sm">Listen</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
