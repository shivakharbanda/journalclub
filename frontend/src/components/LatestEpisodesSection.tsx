import { useEffect, useState } from "react"
import { fetcher } from "@/lib/api"
import Carousel from "./carousel-generic"
import EpisodeCard from "./EpisodeCard"

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

export default function LatestEpisodesSection() {
    const [episodes, setEpisodes] = useState<Episode[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetcher<Episode[]>("/episodes/")
            .then(setEpisodes)
            .catch((err) => console.error("Latest Episodes API Error:", err))
            .finally(() => setLoading(false))
    }, [])

    // Don't render anything if loading or no episodes
    if (loading || episodes.length === 0) return null

    return (
        <Carousel
            title="Latest Episodes"
            subtitle="Fresh content just dropped! 🎙️"
            itemsToShow={3}
        >
            {episodes.map((episode) => (
                <EpisodeCard
                    key={episode.id}
                    episode={episode}
                />
            ))}
        </Carousel>
    )
}