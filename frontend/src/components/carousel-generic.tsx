import { useState, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
    children: ReactNode[]
    itemsToShow?: number
    title?: string
    subtitle?: string
    className?: string
}

export default function Carousel({ 
    children, 
    itemsToShow = 4, 
    title,
    subtitle,
    className = ""
}: Props) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const maxIndex = Math.max(0, children.length - itemsToShow)

    const nextSlide = () => {
        setCurrentIndex(prev => Math.min(prev + 1, maxIndex))
    }

    const prevSlide = () => {
        setCurrentIndex(prev => Math.max(prev - 1, 0))
    }

    if (children.length === 0) return null

    return (
        <div className={cn("space-y-4", className)}>
            {(title || subtitle) && (
                <div className="space-y-1">
                    {title && (
                        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                    )}
                    {subtitle && (
                        <p className="text-sm text-muted-foreground">{subtitle}</p>
                    )}
                </div>
            )}
            
            <div className="relative group">
                {/* Navigation Buttons - Only show if more than itemsToShow */}
                {children.length > itemsToShow && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                                currentIndex === 0 && "cursor-not-allowed opacity-30"
                            )}
                            onClick={prevSlide}
                            disabled={currentIndex === 0}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                                currentIndex === maxIndex && "cursor-not-allowed opacity-30"
                            )}
                            onClick={nextSlide}
                            disabled={currentIndex === maxIndex}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </>
                )}

                {/* Carousel Container */}
                <div className="overflow-hidden">
                    <div 
                        className="flex transition-transform duration-300 ease-in-out gap-4"
                        style={{ transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)` }}
                    >
                        {children.map((child, index) => (
                            <div 
                                key={index}
                                className="flex-none"
                                style={{ width: `${100 / itemsToShow}%` }}
                            >
                                {child}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dots Indicator - Only show if more than itemsToShow */}
                {children.length > itemsToShow && (
                    <div className="flex justify-center mt-4 gap-2">
                        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                            <button
                                key={index}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-200",
                                    index === currentIndex 
                                        ? "bg-primary w-4" 
                                        : "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                                )}
                                onClick={() => setCurrentIndex(index)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}