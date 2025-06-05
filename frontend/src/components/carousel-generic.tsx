import { useState, useEffect, ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
    children: ReactNode[]
    title?: string
    subtitle?: string
    className?: string
    minItemWidth?: number // Minimum width per item in pixels
}

export default function ResponsiveCarousel({ 
    children, 
    title,
    subtitle,
    className = "",
    minItemWidth = 250 // Default minimum width per card
}: Props) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [itemsToShow, setItemsToShow] = useState(4)
    const [isHovered, setIsHovered] = useState(false)

    // Calculate items to show based on screen width
    useEffect(() => {
        const calculateItemsToShow = () => {
            const containerWidth = window.innerWidth - 100 // Account for padding/margins
            const items = Math.floor(containerWidth / minItemWidth)
            setItemsToShow(Math.max(1, Math.min(items, children.length)))
        }

        calculateItemsToShow()
        window.addEventListener('resize', calculateItemsToShow)
        return () => window.removeEventListener('resize', calculateItemsToShow)
    }, [minItemWidth, children.length])

    const maxIndex = Math.max(0, children.length - itemsToShow)

    const nextSlide = () => {
        setCurrentIndex(prev => {
            const next = prev + itemsToShow
            return next > maxIndex ? maxIndex : next
        })
    }

    const prevSlide = () => {
        setCurrentIndex(prev => {
            const next = prev - itemsToShow
            return next < 0 ? 0 : next
        })
    }

    const goToSlide = (index: number) => {
        setCurrentIndex(Math.min(index * itemsToShow, maxIndex))
    }

    if (children.length === 0) return null

    const totalPages = Math.ceil(children.length / itemsToShow)
    const currentPage = Math.floor(currentIndex / itemsToShow)

    return (
        <div className={`w-full ${className}`}>
            {/* Header */}
            {(title || subtitle) && (
                <div className="px-4 md:px-8 mb-4">
                    {title && (
                        <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{title}</h2>
                    )}
                    {subtitle && (
                        <p className="text-sm text-gray-400">{subtitle}</p>
                    )}
                </div>
            )}
            
            {/* Carousel Container */}
            <div 
                className="relative group px-4 md:px-8"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Navigation Buttons */}
                {children.length > itemsToShow && (
                    <>
                        <button
                            className={`
                                absolute left-0 top-1/2 -translate-y-1/2 z-20 
                                bg-black/60 hover:bg-black/80 text-white 
                                rounded-full p-2 transition-all duration-300
                                ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                                ${currentIndex === 0 ? 'cursor-not-allowed opacity-30' : ''}
                                backdrop-blur-sm
                            `}
                            onClick={prevSlide}
                            disabled={currentIndex === 0}
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        <button
                            className={`
                                absolute right-0 top-1/2 -translate-y-1/2 z-20 
                                bg-black/60 hover:bg-black/80 text-white 
                                rounded-full p-2 transition-all duration-300
                                ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                                ${currentIndex >= maxIndex ? 'cursor-not-allowed opacity-30' : ''}
                                backdrop-blur-sm
                            `}
                            onClick={nextSlide}
                            disabled={currentIndex >= maxIndex}
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </>
                )}

                {/* Carousel Items */}
                <div className="overflow-hidden">
                    <div 
                        className="flex transition-transform duration-500 ease-out"
                        style={{ 
                            transform: `translateX(-${(currentIndex / itemsToShow) * 100}%)`,
                            gap: '12px'
                        }}
                    >
                        {children.map((child, index) => (
                            <div 
                                key={index}
                                className="flex-none transition-transform duration-300 hover:scale-105"
                                style={{ width: `calc(${100 / itemsToShow}% - ${12 * (itemsToShow - 1) / itemsToShow}px)` }}
                            >
                                {child}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Page Indicators */}
                {children.length > itemsToShow && totalPages > 1 && (
                    <div className="flex justify-center mt-6 gap-2">
                        {Array.from({ length: totalPages }).map((_, index) => (
                            <button
                                key={index}
                                className={`
                                    h-1 rounded-full transition-all duration-300
                                    ${index === currentPage 
                                        ? 'bg-white w-8' 
                                        : 'bg-gray-600 hover:bg-gray-400 w-6'
                                    }
                                `}
                                onClick={() => goToSlide(index)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// Demo Component with Sample Cards
function DemoCarousel() {
    const sampleCards = Array.from({ length: 12 }, (_, i) => (
        <div 
            key={i}
            className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg p-6 text-white min-h-[200px] flex flex-col justify-between shadow-lg"
        >
            <div>
                <div className="w-8 h-8 bg-white/20 rounded-full mb-4 flex items-center justify-center">
                    <span className="text-sm font-bold">{i + 1}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Episode Title {i + 1}</h3>
                <p className="text-white/80 text-sm">
                    This is a sample description for episode {i + 1}. 
                    Lorem ipsum dolor sit amet consectetur.
                </p>
            </div>
            <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-white/60">
                    <span>42 min</span>
                    <span>★ 4.{Math.floor(Math.random() * 10)}</span>
                </div>
            </div>
        </div>
    ))

    return (
        <div className="min-h-screen bg-gray-900 py-8">
            <ResponsiveCarousel
                title="Latest Episodes"
                subtitle="Fresh content just dropped 🔥"
                minItemWidth={280}
                className="mb-8"
            >
                {sampleCards}
            </ResponsiveCarousel>

            <ResponsiveCarousel
                title="Trending Now"
                subtitle="What everyone's watching"
                minItemWidth={320}
                className="mb-8"
            >
                {sampleCards.slice(0, 8)}
            </ResponsiveCarousel>

            <ResponsiveCarousel
                title="Your Watchlist"
                minItemWidth={250}
            >
                {sampleCards.slice(0, 6)}
            </ResponsiveCarousel>
        </div>
    )
}

export { DemoCarousel }