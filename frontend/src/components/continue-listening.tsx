import { useEffect, useState } from "react"
import { fetcher } from "@/lib/api"
import { CompactEpisodeCard } from "@/components/EpisodeCard"
import Carousel from "./carousel-generic"

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
    progress_percent: number
}

export default function ContinueListeningCarousel() {
    const [episodes, setEpisodes] = useState<Episode[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetcher<Episode[]>("/episodes/continue/")
            .then(setEpisodes)
            .catch((err) => console.error("Continue Listening API Error:", err))
            .finally(() => setLoading(false))
    }, [])

    // Don't render anything if loading or no episodes
    if (loading || episodes.length === 0) return null

    return (
        <Carousel
            title="Continue Listening"
        >
            {episodes.map((episode) => (
                <CompactEpisodeCard
                    key={episode.id}
                    episode={episode}
                    progressPercentage={episode.progress_percent}
                />
            ))}
        </Carousel>
    )
}