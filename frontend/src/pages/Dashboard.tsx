import { useEffect, useState } from "react"
import { PageHeader, PageHeaderHeading } from "@/components/page-header"
import { fetcher } from "@/lib/api"
import EpisodeCard from "@/components/EpisodeCard"
import ContinueListeningCarousel from "@/components/continue-listening"
import BookmarkedEpisodesCarousel from "@/components/bookmarked-section"
import LatestEpisodesSection from "@/components/LatestEpisodesSection"

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

export default function Dashboard() {
    const [episodes, setEpisodes] = useState<Episode[]>([])

    useEffect(() => {
        fetcher<Episode[]>("/episodes/")
            .then(setEpisodes)
            .catch((err) => console.error("API Error:", err))
    }, [])

    return (
        <div className="space-y-6 px-4 md:px-12 py-6">

            <ContinueListeningCarousel />

            <LatestEpisodesSection />

            <BookmarkedEpisodesCarousel />
        </div>
    )
}
