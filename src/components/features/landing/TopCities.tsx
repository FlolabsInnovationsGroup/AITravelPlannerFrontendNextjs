"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const cities = [
  { name: "New York", image: "/image/newnewyork.jpg" },
  { name: "Paris", image: "/image/newparis.jpg" },
  { name: "Tokyo", image: "/image/newtokyo.jpg" },
  { name: "Rome", image: "/image/newrome.jpg" },
  { name: "Sydney", image: "/image/newsydney.jpg" },
  { name: "Dubai", image: "/image/newdubai.jpg" },
  { name: "Mumbai", image: "/image/mumbai.jpg" },
  { name: "Cape Town", image: "/image/cape-town.jpg" },
  { name: "Barcelona", image: "/image/newbarcelona.jpg" },
  { name: "Prague", image: "/image/newprague.jpg" },
  { name: "Vienna", image: "/image/vienna.jpg" },
  { name: "Amsterdam", image: "/image/newamsterdam.jpg" },
  { name: "Lisbon", image: "/image/newlisbon.jpg" },
]

export function TopCities() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScroll()
  }, [])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollRef.current.clientWidth / 2 : scrollRef.current.clientWidth / 2,
        behavior: "smooth",
      })
    }
  }

  return (
    <section className="py-20 bg-white border-t border-stone-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mb-10">
          Top Cities
        </h2>
        <div className="relative -mx-4 sm:mx-0">
          <div
            ref={scrollRef}
            className="flex overflow-x-auto gap-4 pb-2 no-scrollbar scroll-smooth snap-x snap-mandatory"
            onScroll={checkScroll}
          >
            {cities.map((city) => (
              <div key={city.name} className="flex-none w-56 sm:w-64 snap-start">
                <div className="relative aspect-[3/4] group overflow-hidden rounded-xl border border-stone-200/80 shadow-sm hover:shadow-md hover:border-amber-200/80 transition-all duration-300">
                  <Image
                    src={city.image}
                    alt={city.name}
                    fill
                    sizes="(max-width: 640px) 224px, 256px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold text-base drop-shadow-sm">{city.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={`absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-md border border-stone-200/80 transition-opacity ${canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 text-stone-700" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-md border border-stone-200/80 transition-opacity ${canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 text-stone-700" />
          </Button>
        </div>
      </div>
    </section>
  )
}
