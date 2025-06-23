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
    const positionUpdateRef = useRef<NodeJS.Timeout | null>(null)
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
            if (positionUpdateRef.current) clearInterval(positionUpdateRef.current)
        }
    }, [episodeSlug])

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

    const updateMediaSessionPositionState = () => {
        const audio = playerRef.current?.audio?.current
        if (!audio || isNaN(audio.duration)) return

        try {
            if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
                navigator.mediaSession.setPositionState({
                    duration: audio.duration,
                    playbackRate: audio.playbackRate || 1,
                    position: audio.currentTime
                })
            }
        } catch (err) {
            console.error("Failed to update position state:", err)
        }
    }

    const setupMediaSession = () => {
        if (!('mediaSession' in navigator)) return

        try {
            const audio = playerRef.current?.audio?.current
            if (!audio) return

            // Set metadata
            navigator.mediaSession.metadata = new window.MediaMetadata({
                title,
                artist,
                album: "Podcast Series",
                artwork: [
                    { src: imageUrl, sizes: '96x96', type: 'image/png' },
                    { src: imageUrl, sizes: '128x128', type: 'image/png' },
                    { src: imageUrl, sizes: '192x192', type: 'image/png' },
                    { src: imageUrl, sizes: '256x256', type: 'image/png' },
                    { src: imageUrl, sizes: '384x384', type: 'image/png' },
                    { src: imageUrl, sizes: '512x512', type: 'image/png' }
                ]
            })

            // Set action handlers
            navigator.mediaSession.setActionHandler('play', () => {
                audio.play().catch(console.error)
            })

            navigator.mediaSession.setActionHandler('pause', () => {
                audio.pause()
            })

            navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                const skipTime = details?.seekOffset ?? 10
                const newTime = Math.max(audio.currentTime - skipTime, 0)
                audio.currentTime = newTime
                updateMediaSessionPositionState()
                saveProgress(newTime, false)
            })

            navigator.mediaSession.setActionHandler('seekforward', (details) => {
                const skipTime = details?.seekOffset ?? 10
                const newTime = Math.min(audio.currentTime + skipTime, audio.duration)
                audio.currentTime = newTime
                updateMediaSessionPositionState()
                saveProgress(newTime, false)
            })

            // Handle seek to specific position
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime !== undefined && details.seekTime >= 0) {
                    const newTime = Math.min(details.seekTime, audio.duration)
                    audio.currentTime = newTime
                    updateMediaSessionPositionState()
                    saveProgress(newTime, false)
                }
            })

            // Optional: Handle previous/next track if you have playlist functionality
            // navigator.mediaSession.setActionHandler('previoustrack', () => {
            //     // Handle previous episode
            // })
            // navigator.mediaSession.setActionHandler('nexttrack', () => {
            //     // Handle next episode
            // })

        } catch (err) {
            console.error("Failed to setup media session:", err)
        }
    }

    const startPositionUpdates = () => {
        if (positionUpdateRef.current) return // Already running

        positionUpdateRef.current = setInterval(() => {
            updateMediaSessionPositionState()
        }, 1000) // Update every second for smooth seeking
    }

    const stopPositionUpdates = () => {
        if (positionUpdateRef.current) {
            clearInterval(positionUpdateRef.current)
            positionUpdateRef.current = null
        }
    }

    const handleCanPlay = () => {
        const audio = playerRef.current?.audio?.current
        if (!audio || initLogged.current) return

        if (startFrom > 0 && !hasStartedFromPosition.current) {
            audio.currentTime = startFrom
            hasStartedFromPosition.current = true
        }

        // Setup media session once we know the duration
        setupMediaSession()
        updateMediaSessionPositionState()

        saveProgress(audio.currentTime, false)
        initLogged.current = true
    }

    const handlePlay = () => {
        const audio = playerRef.current?.audio?.current
        if (!audio || isNaN(audio.duration)) return

        // Ensure media session is set up
        setupMediaSession()
        updateMediaSessionPositionState()

        // Start position updates for smooth seeking
        startPositionUpdates()

        // Start progress tracking
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

        // Stop position updates
        stopPositionUpdates()

        // Stop progress tracking
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }

    const handleEnded = () => {
        const audio = playerRef.current?.audio?.current
        const dur = audio?.duration || 0
        saveProgress(dur, true)

        // Stop all intervals
        stopPositionUpdates()
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }

    // Handle seeking from the player itself
    const handleSeeked = () => {
        const audio = playerRef.current?.audio?.current
        if (!audio) return

        updateMediaSessionPositionState()
        saveProgress(audio.currentTime, false)
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
                        onSeeked={handleSeeked}
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