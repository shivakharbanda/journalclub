export type BaseTag = {
    id: number
    name: string
    slug: string
}

export type BaseTopic = {
    id: number
    name: string
    slug: string
    description: string
}

export type EpisodeCompact = {
    id: number
    title: string
    slug: string
    summary_text: string
    audio_file: string
    image: string
    created_at: string
    tags: BaseTag[]
    topics: BaseTopic[]
}

export type EpisodeFull = EpisodeCompact & {
    description: string
    sources: string[]
    image_url: string
    audio_url: string
    likes_count: number
    dislikes_count: number
    user_action: 'like' | 'dislike' | null
    is_saved: boolean
}
