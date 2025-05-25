type Topic = {
    id: number
    name: string
    slug: string
    description: string
}

type Props = {
    topics: Topic[]
}

export default function TopicsList({ topics }: Props) {
    if (!topics?.length) return null

    return (
        <div className="flex flex-wrap gap-2 mb-1">
            {topics.map(topic => (
                <span
                    key={topic.id}
                    className="bg-gray-700 text-white text-sm font-medium px-2 py-0.5 rounded-full"
                >
                    {topic.name}
                </span>
            ))}
        </div>
    )
}
