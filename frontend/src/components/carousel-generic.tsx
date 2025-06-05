import { useState, useEffect, ReactNode } from "react"
import { cn } from "@/lib/utils"
import {
  Carousel as ShadcnCarousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import type { CarouselApi } from "@/components/ui/carousel"
import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  children: ReactNode[]
  title?: string
  subtitle?: string
  className?: string
}

export default function Carousel({
  children,
  title,
  subtitle,
  className = "",
}: Props) {
  const [api, setApi] = useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [snapCount, setSnapCount] = useState(0)

  useEffect(() => {
    if (!api) return

    const snaps = api.scrollSnapList().length
    setSnapCount(snaps)
    setCurrentIndex(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrentIndex(api.selectedScrollSnap())
    })
  }, [api])

  if (children.length === 0) return null

  const needsNav = snapCount > 1

  return (
    <div className={cn("space-y-4", className)}>
      {(title || subtitle) && (
        <div className="space-y-1">
          {title && <h2 className="text-2xl font-bold text-foreground">{title}</h2>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      <div className="relative group">
        <ShadcnCarousel
          setApi={setApi}
          opts={{ align: "start", loop: false, skipSnaps: false }}
          className="overflow-visible"
        >
          {needsNav && (
            <>
              <CarouselPrevious
                aria-label="Previous slide"
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-opacity duration-200",
                  currentIndex === 0
                    ? "cursor-not-allowed opacity-30"
                    : "opacity-100"
                )}
                onClick={() => api?.scrollPrev()}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </CarouselPrevious>

              <CarouselNext
                aria-label="Next slide"
                className={cn(
                  "absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-opacity duration-200",
                  currentIndex === snapCount - 1
                    ? "cursor-not-allowed opacity-30"
                    : "opacity-100"
                )}
                onClick={() => api?.scrollNext()}
                disabled={currentIndex === snapCount - 1}
              >
                <ChevronRight className="h-5 w-5" />
              </CarouselNext>
            </>
          )}

          <CarouselContent className={needsNav ? "-ml-4" : ""}>
            {children.map((child, idx) => (
              <CarouselItem
                key={idx}
                className="pl-4 shrink-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                {child}
              </CarouselItem>
            ))}
          </CarouselContent>
        </ShadcnCarousel>

        {needsNav && (
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: snapCount }).map((_, idx) => (
              <button
                key={idx}
                aria-label={`Go to slide ${idx + 1}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-200",
                  idx === currentIndex
                    ? "bg-primary w-4"
                    : "bg-muted-foreground/40 hover:bg-muted-foreground/60 w-2"
                )}
                onClick={() => api?.scrollTo(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
