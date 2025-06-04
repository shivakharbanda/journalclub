import { useEffect, useState } from "react"
import { fetcher } from "@/lib/api"
import Carousel from "./carousel-generic"
import EpisodeCard from "./EpisodeCard"
import { EpisodeFull } from "@/types/episode"



export default function LatestEpisodesSection() {
    const [episodes, setEpisodes] = useState<EpisodeFull[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetcher<EpisodeFull[]>("/episodes/")
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