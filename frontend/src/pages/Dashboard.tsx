import ContinueListeningCarousel from "@/components/continue-listening"
import BookmarkedEpisodesCarousel from "@/components/bookmarked-section"
import LatestEpisodesSection from "@/components/LatestEpisodesSection"


export default function Dashboard() {
    return (
        <div className="space-y-6 px-4 md:px-12 py-6">

            <ContinueListeningCarousel />

            <LatestEpisodesSection />

            <BookmarkedEpisodesCarousel />
        </div>
    )
}
