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

export default function BookmarkedEpisodesCarousel() {
    const [episodes, setEpisodes] = useState<Episode[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetcher<Episode[]>("/saved-episodes/")
            .then(setEpisodes)
            .catch((err) => console.error("Bookmarked Episodes API Error:", err))
            .finally(() => setLoading(false))
    }, [])

    // Don't render anything if loading or no episodes
    if (loading || episodes.length === 0) return null

    return (
        <Carousel
            title="Your Saved Episodes"
            subtitle="Time to dive into those gems you bookmarked! 🎧✨"
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