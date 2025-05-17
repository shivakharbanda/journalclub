import { useEffect, useState } from "react"

export default function EpisodeAudio({ url }: { url: string }) {
    const [audioSrc, setAudioSrc] = useState<string | null>(null)

    useEffect(() => {
        async function fetchAudio() {
            try {
                const res = await fetch(url)
                const blob = await res.blob()
                const localUrl = URL.createObjectURL(blob)
                setAudioSrc(localUrl)
            } catch (err) {
                console.error("Failed to load audio:", err)
            }
        }

        fetchAudio()

        // Cleanup: revoke the blob URL when unmounted
        return () => {
            if (audioSrc) URL.revokeObjectURL(audioSrc)
        }
    }, [url])

    if (!audioSrc) return <p className="text-sm">Loading audio...</p>

    return (
        <audio controls className="w-full mt-4 rounded-md">
            <source src={audioSrc} type="audio/wav" />
            Your browser does not support the audio element.
        </audio>
    )
}
