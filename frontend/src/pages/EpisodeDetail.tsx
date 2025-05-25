import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { fetcher } from "@/lib/api"
import { format } from "date-fns"
import ReactMarkdown from "react-markdown"
import EpisodeAudio from "@/components/episode-audio"
import TagsList from "@/components/TagsList"
import TopicsList from "@/components/TopicsList"

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
    created_at: string
}

type Episode = {
    id: number
    title: string
    slug: string
    summary_text: string
    description: string
    sources: string[]
    audio_file: string
    image: string | null
    created_at: string
    tags: Tag[]
    topics: Topic[]
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

    if (!episode) return <p className="text-center mt-8 text-gray-400">Loading...</p>

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto px-4 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {episode.image && (
                            <div className="bg-card rounded-xl overflow-hidden shadow-xl">
                                <div className="relative h-64 sm:h-80 md:h-96">
                                    <img
                                        src={episode.image}
                                        alt={episode.title}
                                        className="object-cover w-full h-full"
                                    />
                                    <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-6 sm:p-8">
                                        <h1 className="text-3xl sm:text-4xl font-bold text-amber-400 mb-2" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>{episode.title}</h1>
                                        <p className="text-muted-foreground text-sm">
                                            {format(new Date(episode.created_at), "MMMM do, yyyy")}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="p-6 sm:p-8 space-y-6">
                                    {/* Audio */}
                                    <EpisodeAudio url={episode.audio_file} />

                                    <TopicsList topics={episode.topics} />
                                    <TagsList tags={episode.tags} />

                                    {/* Summary */}
                                    <section className="prose prose-invert max-w-none">
                                        <h2 className="text-2xl font-semibold text-foreground mb-4">Summary</h2>
                                        <div className="text-muted-foreground">
                                            <ReactMarkdown>{episode.summary_text}</ReactMarkdown>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:col-span-1 space-y-6">
                        {/* Related Articles (Sources) */}
                        {episode.sources?.length > 0 && (
                            <section className="bg-card rounded-xl shadow-xl p-6">
                                <h3 className="text-xl font-semibold text-foreground mb-4">Related Articles</h3>
                                <ul className="space-y-4">
                                    {episode.sources.map((url, i) => (
                                        <li key={i}>
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group block"
                                            >
                                                <h4 className="font-medium text-blue-400 group-hover:text-blue-300 transition-colors duration-150 text-sm leading-tight">
                                                    {url.replace(/^https?:\/\//, '').split('/')[0]}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-1 break-all">
                                                    {url}
                                                </p>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    )
}