import { useEffect, useRef, useState } from "react"
import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player'
import 'react-h5-audio-player/lib/styles.css'
import { fetcher } from "@/lib/api"
import styles from '@/styles/episode-audio.module.css'

type Props = {
    url: string
    episodeSlug: string
    title: string
    imageUrl: string
    artist?: string
}

export default function EpisodeAudio({ url, episodeSlug, title, imageUrl, artist = "Podcast" }: Props) {
    const playerRef = useRef<AudioPlayer>(null)
    const lastPercentSent = useRef<number>(0)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const initLogged = useRef<boolean>(false)
    const hasStartedFromPosition = useRef<boolean>(false)

    const [startFrom, setStartFrom] = useState<number>(0)

    useEffect(() => {
        async function fetchProgress() {
            try {
                const progress = await fetcher<{ position_seconds: number }>(
                    "/listen-progress/?episode_slug=" + episodeSlug
                )
                setStartFrom(progress.position_seconds || 0)
            } catch (err) {
                console.error("Failed to load progress:", err)
            }
        }

        fetchProgress()

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [episodeSlug])

    useEffect(() => {
        if (!('mediaSession' in navigator)) return

        navigator.mediaSession.metadata = new window.MediaMetadata({
            title,
            artist,
            album: "Podcast Series",
            artwork: [
                { src: imageUrl, sizes: '512x512', type: 'image/png' }
            ]
        })

        navigator.mediaSession.setActionHandler('play', () => {
            playerRef.current?.audio?.current?.play()
        })
        navigator.mediaSession.setActionHandler('pause', () => {
            playerRef.current?.audio?.current?.pause()
        })
        navigator.mediaSession.setActionHandler('seekbackward', () => {
            const audio = playerRef.current?.audio?.current
            if (audio) audio.currentTime = Math.max(audio.currentTime - 10, 0)
        })
        navigator.mediaSession.setActionHandler('seekforward', () => {
            const audio = playerRef.current?.audio?.current
            if (audio) audio.currentTime = Math.min(audio.currentTime + 10, audio.duration)
        })
    }, [title, imageUrl, artist])

    const saveProgress = async (position: number, completed = false) => {
        const audio = playerRef.current?.audio?.current
        if (!audio || isNaN(audio.duration)) return

        try {
            await fetcher("/listen-progress/", {
                method: "POST",
                body: JSON.stringify({
                    episode_slug: episodeSlug,
                    position_seconds: Math.floor(position),
                    duration_seconds: Math.floor(audio.duration),
                    completed,
                }),
            })
        } catch (err) {
            console.error("Failed to save progress:", err)
        }
    }

    const handleCanPlay = () => {
        const audio = playerRef.current?.audio?.current
        if (!audio || initLogged.current) return

        if (startFrom > 0 && !hasStartedFromPosition.current) {
            audio.currentTime = startFrom
            hasStartedFromPosition.current = true
        }

        saveProgress(audio.currentTime, false)
        initLogged.current = true
    }

    const handlePlay = () => {
        const audio = playerRef.current?.audio?.current
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
        const audio = playerRef.current?.audio?.current
        const pos = audio?.currentTime || 0
        saveProgress(pos, false)

        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }

    const handleEnded = () => {
        const audio = playerRef.current?.audio?.current
        const dur = audio?.duration || 0
        saveProgress(dur, true)

        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }

    return (
        <div className="w-full mt-4 relative">
            <div className={styles.liquidGlassPlayer}>
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <div className={`${styles.liquidGlassDistortion} absolute inset-[-25px]`} />
                </div>
                <div className={`${styles.liquidGlassEffect} absolute inset-0 rounded-xl`} />
                <div className="relative z-10">
                    <AudioPlayer
                        ref={playerRef}
                        src={url}
                        onCanPlay={handleCanPlay}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onEnded={handleEnded}
                        showJumpControls={true}
                        showSkipControls={false}
                        showDownloadProgress={true}
                        progressJumpSteps={{
                            backward: 10000,
                            forward: 10000
                        }}
                        customProgressBarSection={[
                            RHAP_UI.CURRENT_TIME,
                            RHAP_UI.PROGRESS_BAR,
                            RHAP_UI.DURATION
                        ]}
                        customControlsSection={[
                            RHAP_UI.MAIN_CONTROLS,
                            RHAP_UI.VOLUME_CONTROLS
                        ]}
                        style={{
                            borderRadius: '12px',
                            backgroundColor: 'transparent',
                            boxShadow: 'none'
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
