import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { PageHeader, PageHeaderHeading } from "@/components/page-header"
import { fetcher } from "@/lib/api"
import ReactMarkdown from "react-markdown"
import { format } from "date-fns"
import EpisodeAudio from "@/components/episode-audio"

type Episode = {
    id: number
    title: string
    slug: string
    summary_text: string
    description: string
    sources: string[]
    audio_file: string
    created_at: string
}

export default function EpisodeDetail() {
    const { slug } = useParams<{ slug: string }>()
    const [episode, setEpisode] = useState<Episode | null>(null)

    useEffect(() => {
        if (!slug) return
        fetcher<Episode>(`/episode/${slug}/`)
            .then(setEpisode)
            .catch(console.error)
    }, [slug])

    if (!episode) return <p className="text-center mt-8">Loading...</p>

    return (
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
            <PageHeader>
                <PageHeaderHeading>{episode.title}</PageHeaderHeading>
            </PageHeader>

            <p className="text-muted-foreground text-sm">
                {format(new Date(episode.created_at), "PPP")}
            </p>

            <EpisodeAudio url={episode.audio_file} />

            <section className="prose prose-neutral mt-6 max-w-none">
                <h2>Summary</h2>
                <ReactMarkdown>{episode.summary_text}</ReactMarkdown>
            </section>
        </div>
    )
}
