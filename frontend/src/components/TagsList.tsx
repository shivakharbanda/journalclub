import SellIcon from "@mui/icons-material/Sell"

type Tag = {
    id: number
    name: string
    slug: string
}

type Props = {
    tags: Tag[]
}

export default function TagsList({ tags }: Props) {
    if (!tags?.length) return null

    return (
        <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
                <span
                    key={tag.id}
                    className="flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-3 py-1 rounded-full"
                >
                    <SellIcon style={{ fontSize: "12px", color: "#9CA3AF" }} />
                    {tag.name}
                </span>
            ))}
        </div>
    )
}
