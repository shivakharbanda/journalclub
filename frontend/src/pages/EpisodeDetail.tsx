import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { fetcher } from "@/lib/api"
import { format } from "date-fns"
import ReactMarkdown from "react-markdown"
import EpisodeAudio from "@/components/episode-audio"
import TagsList from "@/components/TagsList"
import TopicsList from "@/components/TopicsList"
import Comments from "@/components/CommentSection"
import { Bookmark, Share2, ThumbsDown, ThumbsUp } from "lucide-react"

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
    likes_count: number
    dislikes_count: number
    user_action?: 'like' | 'dislike' | null
}

export default function EpisodeDetail() {
    const { slug } = useParams<{ slug: string }>()
    const [episode, setEpisode] = useState<Episode | null>(null)

    const [liked, setLiked] = useState(false)
    const [disliked, setDisliked] = useState(false)
    const [saved, setSaved] = useState(false)
    const [likeCount, setLikeCount] = useState(123)
    const [dislikeCount, setDislikeCount] = useState(12)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!slug) return
        fetcher<Episode>(`/episode/${slug}/`)
            .then((data) => {
                setEpisode(data)
                setLikeCount(data.likes_count || 0)
                setDislikeCount(data.dislikes_count || 0)
                setLiked(data.user_action === 'like')
                setDisliked(data.user_action === 'dislike')
            })
            .catch(console.error)
    }, [slug])

    const handleLikeDislike = async (action: 'like' | 'dislike') => {
        if (!episode || isLoading) return
        
        setIsLoading(true)
        const isCurrentAction = (action === 'like' && liked) || (action === 'dislike' && disliked)
        
        try {
            if (isCurrentAction) {
                // Remove the current action
                await fetcher(`/episode/${episode.slug}/like-dislike/`, {
                    method: 'DELETE',
                    body: JSON.stringify({  
                        action: action
                    })
                })
                
                if (action === 'like') {
                    setLiked(false)
                    setLikeCount(prev => prev - 1)
                } else {
                    setDisliked(false)
                    setDislikeCount(prev => prev - 1)
                }
            } else {
                // Add or change action
                await fetcher(`/episode/${episode.slug}/like-dislike/`, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: action
                    })
                })
                
                if (action === 'like') {
                    if (disliked) {
                        setDisliked(false)
                        setDislikeCount(prev => prev - 1)
                    }
                    setLiked(true)
                    setLikeCount(prev => prev + (disliked ? 1 : 1))
                } else {
                    if (liked) {
                        setLiked(false)
                        setLikeCount(prev => prev - 1)
                    }
                    setDisliked(true)
                    setDislikeCount(prev => prev + (liked ? 1 : 1))
                }
            }
        } catch (error) {
            console.error(`Error ${isCurrentAction ? 'removing' : 'adding'} ${action}:`, error)
            // You might want to show a toast notification here
        } finally {
            setIsLoading(false)
        }
    }

    const handleLike = () => handleLikeDislike('like')
    const handleDislike = () => handleLikeDislike('dislike')

    const handleSave = () => {
        setSaved(!saved)
        // Add your save logic here
    }

    const handleShare = () => {
        if (navigator.share && episode) {
            navigator.share({
                title: episode.title,
                text: episode.summary_text,
                url: window.location.href,
            })
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href)
            // You might want to show a toast notification here
        }
    }


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
                                    <EpisodeAudio url={episode.audio_file} episodeSlug={episode.slug} />

                                    <TopicsList topics={episode.topics} />
                                    <TagsList tags={episode.tags} />

                                    {/* Summary */}
                                    <section className="prose prose-invert max-w-none">
                                        <h2 className="text-2xl font-semibold text-foreground mb-4">Summary</h2>
                                        <div className="text-muted-foreground">
                                            <ReactMarkdown>{episode.summary_text}</ReactMarkdown>
                                        </div>
                                    </section>

                                    {/* Engagement Buttons */}
                                    <div className="pt-6 border-t border-border flex items-center space-x-6">
                                        <button 
                                            onClick={handleLike}
                                            className={`flex items-center space-x-2 transition-colors duration-150 ${
                                                liked 
                                                    ? 'text-blue-400' 
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <ThumbsUp className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                                            <span>Like ({likeCount})</span>
                                        </button>
                                        
                                        <button 
                                            onClick={handleDislike}
                                            className={`flex items-center space-x-2 transition-colors duration-150 ${
                                                disliked 
                                                    ? 'text-red-400' 
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <ThumbsDown className={`h-5 w-5 ${disliked ? 'fill-current' : ''}`} />
                                            <span>Dislike ({dislikeCount})</span>
                                        </button>
                                        
                                        <button 
                                            onClick={handleSave}
                                            className={`flex items-center space-x-2 transition-colors duration-150 ml-auto ${
                                                saved 
                                                    ? 'text-yellow-400' 
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <Bookmark className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
                                            <span>Save</span>
                                        </button>
                                        
                                        <button 
                                            onClick={handleShare}
                                            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors duration-150"
                                        >
                                            <Share2 className="h-5 w-5" />
                                            <span>Share</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Comments Section */}
                        <Comments
                            objectType="episode" 
                            objectId={episode.id}
                            className="mt-10"
                        />
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