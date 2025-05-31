import { useEffect, useRef, useState } from "react"
import { fetcher } from "@/lib/api"

type Props = {
    url: string
    episodeSlug: string
}

export default function EpisodeAudio({ url, episodeSlug }: Props) {
    const [audioSrc, setAudioSrc] = useState<string | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const lastPercentSent = useRef<number>(0)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const initLogged = useRef<boolean>(false)

    const [startFrom, setStartFrom] = useState<number>(0)

    useEffect(() => {
        let localUrl: string

        async function fetchAudio() {
            try {
                // 1. Fetch saved progress
                const progress = await fetcher<{ position_seconds: number }>("/listen-progress/?episode_slug=" + episodeSlug)
                setStartFrom(progress.position_seconds || 0)

                // 2. Fetch audio blob
                const res = await fetch(url)
                const blob = await res.blob()
                localUrl = URL.createObjectURL(blob)
                setAudioSrc(localUrl)
            } catch (err) {
                console.error("Failed to load audio or progress:", err)
            }
        }

        fetchAudio()

        return () => {
            if (localUrl) URL.revokeObjectURL(localUrl)
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [url])

    const saveProgress = async (position: number, completed = false) => {
        const audio = audioRef.current
        if (!audio || isNaN(audio.duration)) return

        try {
            await fetcher("/listen-progress/", {
                method: "POST",
                body: JSON.stringify({
                    episode_slug: episodeSlug,
                    position_seconds: Math.floor(position),
                    duration_seconds: Math.floor(audio.duration), // <-- send total duration
                    completed,
                }),
            })
        } catch (err) {
            console.error("Failed to save progress:", err)
        }
    }

    const handleCanPlay = () => {
        const audio = audioRef.current
        if (!audio || initLogged.current) return

        // jump to previous time if needed
        if (startFrom > 0) {
            audio.currentTime = startFrom
        }

        saveProgress(audio.currentTime, false)
        initLogged.current = true
    }

    const handlePlay = () => {
        const audio = audioRef.current
        if (!audio || isNaN(audio.duration)) return

        if (!intervalRef.current) {
            intervalRef.current = setInterval(() => {
                const current = audio.currentTime
                const duration = audio.duration
                const percent = Math.floor((current / duration) * 100)

                if (percent - lastPercentSent.current >= 5) {
                    saveProgress(current, false)
                    lastPercentSent.current = percent
                }
            }, 3000)
        }
    }

    const handlePause = () => {
        const pos = audioRef.current?.currentTime || 0
        saveProgress(pos, false)

        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }

    const handleEnded = () => {
        const dur = audioRef.current?.duration || 0
        saveProgress(dur, true)

        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }

    if (!audioSrc) return <p className="text-sm">Loading audio...</p>

    return (
        <audio
            ref={audioRef}
            controls
            className="w-full mt-4 rounded-md"
            onCanPlay={handleCanPlay}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
        >
            <source src={audioSrc} type="audio/wav" />
            Your browser does not support the audio element.
        </audio>
    )
}
